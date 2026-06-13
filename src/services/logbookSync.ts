import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { normalizeLogbookTrips } from './logbookModel';
import type { CatchEntry, LogbookTrip } from '../components/LogbookView';

interface SpotRow {
  id: string;
  user_id: string;
  name: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  started_at: string;
  weather: LogbookTrip['weather'] | null;
  water: LogbookTrip['water'] | null;
  updated_at?: string;
}

interface CatchRow {
  id: string;
  user_id: string;
  spot_id: string;
  fish_species: CatchEntry['fishSpecies'];
  custom_fish_name: string | null;
  length_cm: number;
  weight: string | null;
  weight_unit: CatchEntry['weightUnit'];
  bait: string;
  method: string;
  released: boolean;
  notes: string;
  caught_at: string;
  photo_name: string | null;
  photo_data_url: string | null;
  updated_at?: string;
}

function getSupabaseErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const maybeError = error as { code?: unknown; message?: unknown };
    const message = typeof maybeError.message === 'string' ? maybeError.message : '';
    const code = typeof maybeError.code === 'string' ? maybeError.code : '';

    if (code === 'PGRST205' || message.toLowerCase().includes('could not find the table')) {
      return 'Supabase-Tabellen fehlen. Bitte SQL für logbook_spots und logbook_catches im Supabase SQL Editor ausführen.';
    }

    if (message) return message;
  }

  return fallback;
}

function toSpotRow(trip: LogbookTrip, user: User): SpotRow {
  return {
    id: trip.id,
    user_id: user.id,
    name: trip.spotName,
    lat: trip.lat,
    lng: trip.lng,
    accuracy: trip.accuracy ?? null,
    started_at: trip.startedAt,
    weather: trip.weather ?? null,
    water: trip.water ?? null,
    updated_at: new Date().toISOString(),
  };
}

function toCatchRow(entry: CatchEntry, trip: LogbookTrip, user: User): CatchRow {
  return {
    id: entry.id,
    user_id: user.id,
    spot_id: trip.id,
    fish_species: entry.fishSpecies,
    custom_fish_name: entry.customFishName?.trim() || null,
    length_cm: entry.lengthCm,
    weight: entry.weight?.trim() || null,
    weight_unit: entry.weightUnit,
    bait: entry.bait,
    method: entry.method,
    released: entry.released,
    notes: entry.notes,
    caught_at: entry.caughtAt,
    photo_name: entry.photoName ?? null,
    photo_data_url: entry.photoDataUrl ?? null,
    updated_at: new Date().toISOString(),
  };
}

function rowsToTrips(spots: SpotRow[], catches: CatchRow[]): LogbookTrip[] {
  const catchesBySpot = new Map<string, CatchEntry[]>();

  catches.forEach((row) => {
    const entries = catchesBySpot.get(row.spot_id) ?? [];
    entries.push({
      id: row.id,
      fishSpecies: row.fish_species,
      customFishName: row.custom_fish_name ?? '',
      lengthCm: row.length_cm,
      weight: row.weight ?? '',
      weightUnit: row.weight_unit,
      caughtAt: row.caught_at,
      bait: row.bait,
      method: row.method,
      released: row.released,
      notes: row.notes,
      photoName: row.photo_name ?? undefined,
      photoDataUrl: row.photo_data_url ?? undefined,
    });
    catchesBySpot.set(row.spot_id, entries);
  });

  return spots.map((spot) => ({
    id: spot.id,
    startedAt: spot.started_at,
    spotName: spot.name,
    lat: spot.lat,
    lng: spot.lng,
    accuracy: spot.accuracy ?? undefined,
    weather: spot.weather ?? undefined,
    water: spot.water ?? undefined,
    catches: (catchesBySpot.get(spot.id) ?? []).sort(
      (a, b) => new Date(b.caughtAt).getTime() - new Date(a.caughtAt).getTime(),
    ),
  }));
}

export function mergeTrips(localTrips: LogbookTrip[], remoteTrips: LogbookTrip[]) {
  const byId = new Map<string, LogbookTrip>();

  [...normalizeLogbookTrips(remoteTrips), ...normalizeLogbookTrips(localTrips)].forEach((trip) => {
    const existing = byId.get(trip.id);
    if (!existing) {
      byId.set(trip.id, trip);
      return;
    }

    const catchesById = new Map<string, CatchEntry>();
    [...existing.catches, ...trip.catches].forEach((entry) => catchesById.set(entry.id, entry));
    byId.set(trip.id, {
      ...existing,
      ...trip,
      catches: [...catchesById.values()].sort(
        (a, b) => new Date(b.caughtAt).getTime() - new Date(a.caughtAt).getTime(),
      ),
    });
  });

  return [...byId.values()].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
}

export async function loadRemoteLogbook(user: User) {
  if (!supabase) return [];

  const [{ data: spots, error: spotsError }, { data: catches, error: catchesError }] = await Promise.all([
    supabase
      .from('logbook_spots')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false }),
    supabase
      .from('logbook_catches')
      .select('*')
      .eq('user_id', user.id)
      .order('caught_at', { ascending: false }),
  ]);

  if (spotsError) throw new Error(getSupabaseErrorMessage(spotsError, 'Spots konnten nicht aus Supabase geladen werden'));
  if (catchesError) throw new Error(getSupabaseErrorMessage(catchesError, 'Fänge konnten nicht aus Supabase geladen werden'));

  return normalizeLogbookTrips(rowsToTrips((spots ?? []) as SpotRow[], (catches ?? []) as CatchRow[]));
}

export async function syncLogbook(user: User, trips: LogbookTrip[]) {
  if (!supabase) return;

  const safeTrips = normalizeLogbookTrips(trips);
  const spotRows = safeTrips.map((trip) => toSpotRow(trip, user));
  const catchRows = safeTrips.flatMap((trip) => trip.catches.map((entry) => toCatchRow(entry, trip, user)));

  if (spotRows.length > 0) {
    const { error } = await supabase.from('logbook_spots').upsert(spotRows, { onConflict: 'id' });
    if (error) throw new Error(getSupabaseErrorMessage(error, 'Spots konnten nicht synchronisiert werden'));
  }

  if (catchRows.length > 0) {
    const { error } = await supabase.from('logbook_catches').upsert(catchRows, { onConflict: 'id' });
    if (error) throw new Error(getSupabaseErrorMessage(error, 'Fänge konnten nicht synchronisiert werden'));
  }
}

export async function deleteRemoteSpot(user: User, spotId: string) {
  if (!supabase) return;

  const { error } = await supabase
    .from('logbook_spots')
    .delete()
    .eq('user_id', user.id)
    .eq('id', spotId);

  if (error) throw new Error(getSupabaseErrorMessage(error, 'Spot konnte nicht gelöscht werden'));
}

export async function deleteRemoteCatch(user: User, catchId: string) {
  if (!supabase) return;

  const { error } = await supabase
    .from('logbook_catches')
    .delete()
    .eq('user_id', user.id)
    .eq('id', catchId);

  if (error) throw new Error(getSupabaseErrorMessage(error, 'Fang konnte nicht gelöscht werden'));
}
