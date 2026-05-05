import { useCallback, useEffect, useState } from 'react';
import { waterDataService } from '../services/WaterDataService';
import type { WaterBodyProfile } from '../types/waterData';

export function useWaterProfile(lat?: number, lng?: number) {
  const [profile, setProfile] = useState<WaterBodyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (forceRefresh: boolean = false) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return;

    setLoading(true);
    setError(null);

    try {
      const data = await waterDataService.getWaterProfile(lat, lng, forceRefresh);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gewaesserdaten konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      setLoading(true);
      setError(null);

      try {
        const data = await waterDataService.getWaterProfile(lat, lng);
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gewaesserdaten konnten nicht geladen werden');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  const refresh = useCallback(() => fetchProfile(true), [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refresh,
  };
}
