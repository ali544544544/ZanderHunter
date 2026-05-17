import type { User } from '@supabase/supabase-js';
import type { Spot } from '../data/spots';
import type { LogbookTrip } from '../components/LogbookView';
import { supabase } from './supabase';

export const LOGBOOK_STORAGE_KEY = 'zanderhunter-logbook-v1';
export const USER_SPOTS_STORAGE_KEY = 'zanderhunter_user_spots';
const ACCOUNT_ACTIVITY_STORAGE_KEY = 'zanderhunter-account-activity-v1';
export const ACCOUNT_DATA_CHANGED_EVENT = 'zanderhunter-account-data-changed';
export const ACCOUNT_DATA_CLEARED_EVENT = 'zanderhunter-account-data-cleared';

export interface AccountStorageSummary {
  customSpots: number;
  logbookSpots: number;
  catches: number;
  totalItems: number;
  lastSavedAt: string | null;
}

interface AccountActivity {
  lastSavedAt?: string;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getStoredLastSavedAt() {
  return readJson<AccountActivity>(ACCOUNT_ACTIVITY_STORAGE_KEY, {}).lastSavedAt ?? null;
}

function getLatestDate(values: Array<string | null | undefined>) {
  const timestamps = values
    .map((value) => (value ? new Date(value).getTime() : Number.NaN))
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

function dispatchAccountDataChanged() {
  window.dispatchEvent(new CustomEvent(ACCOUNT_DATA_CHANGED_EVENT));
}

export function markAccountDataSaved() {
  window.localStorage.setItem(
    ACCOUNT_ACTIVITY_STORAGE_KEY,
    JSON.stringify({ lastSavedAt: new Date().toISOString() }),
  );
  dispatchAccountDataChanged();
}

export function getLocalAccountSummary(): AccountStorageSummary {
  const trips = readJson<LogbookTrip[]>(LOGBOOK_STORAGE_KEY, []);
  const customSpots = readJson<Spot[]>(USER_SPOTS_STORAGE_KEY, []);
  const logbookSpots = Array.isArray(trips) ? trips.length : 0;
  const catches = Array.isArray(trips)
    ? trips.reduce((sum, trip) => sum + (Array.isArray(trip.catches) ? trip.catches.length : 0), 0)
    : 0;
  const userSpots = Array.isArray(customSpots) ? customSpots.length : 0;

  return {
    customSpots: userSpots,
    logbookSpots,
    catches,
    totalItems: userSpots + logbookSpots + catches,
    lastSavedAt: getStoredLastSavedAt(),
  };
}

export async function getRemoteAccountSummary(user: User): Promise<AccountStorageSummary> {
  if (!supabase) return getLocalAccountSummary();

  const [{ data: spots, error: spotsError }, { data: catches, error: catchesError }] = await Promise.all([
    supabase
      .from('logbook_spots')
      .select('updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('logbook_catches')
      .select('updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
  ]);

  if (spotsError || catchesError) {
    return getLocalAccountSummary();
  }

  const local = getLocalAccountSummary();
  const remoteSpots = spots ?? [];
  const remoteCatches = catches ?? [];

  return {
    customSpots: local.customSpots,
    logbookSpots: Math.max(local.logbookSpots, remoteSpots.length),
    catches: Math.max(local.catches, remoteCatches.length),
    totalItems: local.customSpots
      + Math.max(local.logbookSpots, remoteSpots.length)
      + Math.max(local.catches, remoteCatches.length),
    lastSavedAt: getLatestDate([
      local.lastSavedAt,
      remoteSpots[0]?.updated_at,
      remoteCatches[0]?.updated_at,
    ]),
  };
}

export function clearLocalAccountData() {
  window.localStorage.removeItem(LOGBOOK_STORAGE_KEY);
  window.localStorage.removeItem(USER_SPOTS_STORAGE_KEY);
  window.localStorage.removeItem(ACCOUNT_ACTIVITY_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(ACCOUNT_DATA_CLEARED_EVENT));
  dispatchAccountDataChanged();
}

export async function deleteCurrentAccount() {
  if (!supabase) throw new Error('Supabase ist nicht konfiguriert.');

  const { error } = await supabase.rpc('delete_current_user');

  if (error) {
    throw new Error(
      'Account konnte nicht geloescht werden. Bitte die SQL-Datei supabase/delete-current-user.sql einmal im Supabase SQL Editor ausfuehren.',
    );
  }

  clearLocalAccountData();
  await supabase.auth.signOut({ scope: 'local' });
}
