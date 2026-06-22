import type { User } from '@supabase/supabase-js';
import type { Spot } from '../data/spots';
import { supabase } from './supabase';

export const MAX_USER_SPOTS = 5;
const FAVORITE_SPOTS_TABLE = 'user_favorite_spots';

interface FavoriteSpotRow {
  id: string;
  spot: Spot;
  sort_order: number;
  updated_at?: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function stringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : fallback;
}

function seasonBonus(value: unknown): Spot['jahreszeitBonus'] {
  if (!isRecord(value)) {
    return { frühling: 5, sommer: 5, herbst: 10, winter: 5 };
  }

  return {
    frühling: numberValue(value.frühling, 5),
    sommer: numberValue(value.sommer, 5),
    herbst: numberValue(value.herbst, 10),
    winter: numberValue(value.winter, 5),
  };
}

function tidePhase(value: unknown): Spot['bestePhase'] {
  return value === 'ablauf' || value === 'auflauf' || value === 'kenter' || value === 'alle'
    ? value
    : 'alle';
}

function turbidityPreference(value: unknown): Spot['trübungsPräferenz'] {
  return value === 'getrübt' || value === 'mittel' || value === 'klar' || value === 'alle'
    ? value
    : 'mittel';
}

function spotType(value: unknown): Spot['type'] {
  return value === 'elbe' || value === 'hafen' || value === 'kanal' ? value : undefined;
}

export function normalizeUserSpot(value: unknown): Spot | null {
  if (!isRecord(value)) return null;

  const lat = numberValue(value.lat, Number.NaN);
  const lng = numberValue(value.lng, Number.NaN);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    id: stringValue(value.id, `user-${Date.now()}`),
    name: stringValue(value.name, 'Gespeicherter Spot'),
    beschreibung: stringValue(value.beschreibung, 'Individuell gespeicherter Spot.'),
    lat,
    lng,
    tiefe: stringValue(value.tiefe, '3-6 m'),
    bestePhase: tidePhase(value.bestePhase),
    windtoleranz: numberValue(value.windtoleranz, 30),
    bootNötig: booleanValue(value.bootNötig, false),
    uferAngling: booleanValue(value.uferAngling, true),
    struktur: stringArray(value.struktur, ['Kante']),
    trübungsPräferenz: turbidityPreference(value.trübungsPräferenz),
    temperaturMin: numberValue(value.temperaturMin, 5),
    jahreszeitBonus: seasonBonus(value.jahreszeitBonus),
    taktik: stringValue(value.taktik, ''),
    koderTipp: stringValue(value.koderTipp, ''),
    type: spotType(value.type),
    isWindExposed: booleanValue(value.isWindExposed, true),
  };
}

export function normalizeUserSpots(value: unknown): Spot[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const spots: Spot[] = [];

  value.forEach((entry) => {
    const spot = normalizeUserSpot(entry);
    if (!spot || seen.has(spot.id) || spots.length >= MAX_USER_SPOTS) return;

    seen.add(spot.id);
    spots.push(spot);
  });

  return spots;
}

export function mergeUserSpots(...spotLists: Spot[][]) {
  const seen = new Set<string>();
  const merged: Spot[] = [];

  spotLists.flat().forEach((spot) => {
    const normalized = normalizeUserSpot(spot);
    if (!normalized || seen.has(normalized.id) || merged.length >= MAX_USER_SPOTS) return;

    seen.add(normalized.id);
    merged.push(normalized);
  });

  return merged;
}

function getSupabaseErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '');
    if (message.includes(FAVORITE_SPOTS_TABLE) || message.includes('relation') || message.includes('schema cache')) {
      return 'Supabase-Tabelle fuer gespeicherte Spots fehlt. Bitte supabase/user-favorite-spots.sql im Supabase SQL Editor ausfuehren.';
    }
    if (message.trim()) return message;
  }

  return fallback;
}

export async function loadRemoteUserSpots(user: User): Promise<Spot[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(FAVORITE_SPOTS_TABLE)
    .select('id, spot, sort_order, updated_at')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: true })
    .limit(MAX_USER_SPOTS);

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Gespeicherte Spots konnten nicht geladen werden.'));
  }

  return normalizeUserSpots(((data ?? []) as FavoriteSpotRow[]).map((row) => row.spot));
}

export async function syncRemoteUserSpots(user: User, spots: Spot[]) {
  if (!supabase) return;

  const safeSpots = normalizeUserSpots(spots);
  const now = new Date().toISOString();

  const { error: deleteError } = await supabase
    .from(FAVORITE_SPOTS_TABLE)
    .delete()
    .eq('user_id', user.id);

  if (deleteError) {
    throw new Error(getSupabaseErrorMessage(deleteError, 'Gespeicherte Spots konnten nicht synchronisiert werden.'));
  }

  if (safeSpots.length === 0) return;

  const rows = safeSpots.map((spot, index) => ({
    user_id: user.id,
    id: spot.id,
    name: spot.name,
    spot,
    sort_order: index,
    updated_at: now,
  }));

  const { error } = await supabase
    .from(FAVORITE_SPOTS_TABLE)
    .insert(rows);

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Gespeicherte Spots konnten nicht synchronisiert werden.'));
  }
}
