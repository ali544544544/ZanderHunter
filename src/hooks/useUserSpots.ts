import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Spot } from '../data/spots';
import {
  ACCOUNT_DATA_CHANGED_EVENT,
  ACCOUNT_DATA_CLEARED_EVENT,
  getUserSpotsStorageKey,
  markAccountDataSaved,
  USER_SPOTS_STORAGE_KEY,
} from '../services/accountData';
import { readJson, writeJson } from '../services/storage';
import { supabase } from '../services/supabase';
import {
  loadRemoteUserSpots,
  MAX_USER_SPOTS,
  mergeUserSpots,
  normalizeUserSpots,
  syncRemoteUserSpots,
} from '../services/userSpotsSync';

export interface UserSpotSaveResult {
  ok: boolean;
  message?: string;
}

const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

function readStoredSpots(userId?: string | null) {
  return normalizeUserSpots(
    readJson<Spot[]>(
      getUserSpotsStorageKey(userId),
      [],
      isArray as (value: unknown) => value is Spot[]
    )
  );
}

function readLegacySpots() {
  return normalizeUserSpots(
    readJson<Spot[]>(
      USER_SPOTS_STORAGE_KEY,
      [],
      isArray as (value: unknown) => value is Spot[]
    )
  );
}

export function useUserSpots() {
  const [userSpots, setUserSpots] = useState<Spot[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userRef = useRef<User | null>(null);
  const spotsRef = useRef<Spot[]>([]);

  useEffect(() => {
    spotsRef.current = userSpots;
  }, [userSpots]);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setLoading(false);
      return undefined;
    }
    const client = supabase;

    let cancelled = false;

    const hydrateSession = async () => {
      const { data } = await client.auth.getSession();
      if (!cancelled) {
        setUser(data.session?.user ?? null);
      }
    };

    hydrateSession().catch(() => {
      if (!cancelled) setUser(null);
    });

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadUserSpots = useCallback(async (forceRemote: boolean = false) => {
    const currentUser = userRef.current;
    const localSpots = readStoredSpots(currentUser?.id);

    setUserSpots(localSpots);
    setError(null);

    if (!currentUser || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const remoteSpots = await loadRemoteUserSpots(currentUser);
      const shouldSeedFromLegacy = remoteSpots.length === 0 && localSpots.length === 0;
      const merged = mergeUserSpots(
        forceRemote ? remoteSpots : localSpots,
        forceRemote ? localSpots : remoteSpots,
        shouldSeedFromLegacy ? readLegacySpots() : []
      );

      setUserSpots(merged);
      writeJson(getUserSpotsStorageKey(currentUser.id), merged);

      if (JSON.stringify(remoteSpots) !== JSON.stringify(merged)) {
        await syncRemoteUserSpots(currentUser, merged);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gespeicherte Spots konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    userRef.current = user;
    void loadUserSpots(true);
  }, [loadUserSpots, user]);

  useEffect(() => {
    const reloadLocalSpots = () => {
      const localSpots = readStoredSpots(userRef.current?.id);
      setUserSpots(localSpots);
    };

    const clearSpots = () => {
      setUserSpots([]);
      setError(null);
    };

    window.addEventListener(ACCOUNT_DATA_CHANGED_EVENT, reloadLocalSpots);
    window.addEventListener(ACCOUNT_DATA_CLEARED_EVENT, clearSpots);
    window.addEventListener('storage', reloadLocalSpots);

    return () => {
      window.removeEventListener(ACCOUNT_DATA_CHANGED_EVENT, reloadLocalSpots);
      window.removeEventListener(ACCOUNT_DATA_CLEARED_EVENT, clearSpots);
      window.removeEventListener('storage', reloadLocalSpots);
    };
  }, []);

  const persistUserSpots = useCallback(async (spots: Spot[]): Promise<UserSpotSaveResult> => {
    const currentUser = userRef.current;
    const safeSpots = normalizeUserSpots(spots);

    setUserSpots(safeSpots);
    writeJson(getUserSpotsStorageKey(currentUser?.id), safeSpots);
    markAccountDataSaved();

    if (!currentUser || !supabase) {
      return { ok: true };
    }

    setSyncing(true);
    setError(null);

    try {
      await syncRemoteUserSpots(currentUser, safeSpots);
      markAccountDataSaved();
      return { ok: true };
    } catch (syncError) {
      const message = syncError instanceof Error
        ? syncError.message
        : 'Gespeicherte Spots konnten nicht synchronisiert werden.';
      setError(message);
      return { ok: true, message };
    } finally {
      setSyncing(false);
    }
  }, []);

  const addUserSpot = useCallback(async (spot: Spot): Promise<UserSpotSaveResult> => {
    const currentSpots = spotsRef.current;

    if (currentSpots.length >= MAX_USER_SPOTS) {
      return { ok: false, message: `Maximal ${MAX_USER_SPOTS} Spots speicherbar.` };
    }

    const nextSpot = {
      ...spot,
      id: spot.id || `user-${Date.now()}`,
    };

    return persistUserSpots([...currentSpots, nextSpot]);
  }, [persistUserSpots]);

  const deleteUserSpot = useCallback(async (id: string): Promise<UserSpotSaveResult> => {
    const updated = spotsRef.current.filter((spot) => spot.id !== id);
    return persistUserSpots(updated);
  }, [persistUserSpots]);

  return {
    userSpots,
    addUserSpot,
    deleteUserSpot,
    user,
    loading,
    syncing,
    error,
    limit: MAX_USER_SPOTS,
    refresh: loadUserSpots,
  };
}
