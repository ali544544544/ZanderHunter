import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { GeoPosition } from '../hooks/useGeolocation';
import type { WeatherData } from '../hooks/useWeather';
import { waterDataService } from '../services/WaterDataService';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import { deleteRemoteCatch, deleteRemoteSpot, loadRemoteLogbook, mergeTrips, syncLogbook } from '../services/logbookSync';
import { ACCOUNT_DATA_CLEARED_EVENT, LOGBOOK_STORAGE_KEY, markAccountDataSaved } from '../services/accountData';
import { readJson, writeJson } from '../services/storage';
import LocationPickerMap from './LocationPickerMap';

export type FishSpecies =
  | 'zander'
  | 'hecht'
  | 'barsch'
  | 'forelle'
  | 'rapfen'
  | 'rotfeder'
  | 'grundel'
  | 'aal'
  | 'karpfen'
  | 'schleie'
  | 'wels'
  | 'brassen'
  | 'dorsch'
  | 'sonstiges';
export type WeightUnit = 'g' | 'kg';

export interface CatchEntry {
  id: string;
  fishSpecies: FishSpecies;
  customFishName?: string;
  lengthCm: number;
  weight?: string;
  weightUnit: WeightUnit;
  caughtAt: string;
  bait: string;
  method: string;
  released: boolean;
  notes: string;
  photoName?: string;
  photoDataUrl?: string;
}

export interface LogbookTrip {
  id: string;
  startedAt: string;
  spotName: string;
  lat: number;
  lng: number;
  accuracy?: number;
  weather?: {
    temperature: number;
    windSpeed: number;
    windDirection: number;
    cloudCover: number;
  };
  water?: {
    temperature?: number;
    clarity: string;
    current: string;
  };
  catches: CatchEntry[];
}

interface PendingSpot {
  name: string;
  lat: number;
  lng: number;
  accuracy?: number;
}

interface LogbookViewProps {
  currentLocation: { lat: number; lng: number };
  gpsPosition: GeoPosition | null;
  gpsLoading: boolean;
  gpsError: string | null;
  locationLabel: string;
  weather: WeatherData | null;
  waterName?: string;
  baseUrl: string;
  quickAddRequest?: number;
}

const OTHER_FISH_VALUE = 'sonstiges';

const primaryFishOptions: { id: FishSpecies; label: string; icon: string; defaultLength: number }[] = [
  { id: 'zander', label: 'Zander', icon: 'icons/zander.svg', defaultLength: 50 },
  { id: 'hecht', label: 'Hecht', icon: 'icons/hecht.svg', defaultLength: 70 },
  { id: 'barsch', label: 'Barsch', icon: 'icons/barsch.svg', defaultLength: 28 },
  { id: 'forelle', label: 'Forelle', icon: 'icons/trout.svg', defaultLength: 35 },
  { id: 'rapfen', label: 'Rapfen', icon: 'icons/hecht.svg', defaultLength: 60 },
  { id: 'rotfeder', label: 'Rotfeder', icon: 'icons/barsch.svg', defaultLength: 22 },
  { id: 'grundel', label: 'Grundel', icon: 'icons/barsch.svg', defaultLength: 12 },
  { id: OTHER_FISH_VALUE, label: 'Andere', icon: 'icons/carp.svg', defaultLength: 35 },
];

const otherFishOptions: { id: FishSpecies; label: string; defaultLength: number }[] = [
  { id: 'aal', label: 'Aal', defaultLength: 55 },
  { id: 'karpfen', label: 'Karpfen', defaultLength: 45 },
  { id: 'schleie', label: 'Schleie', defaultLength: 32 },
  { id: 'wels', label: 'Wels', defaultLength: 85 },
  { id: 'brassen', label: 'Brassen', defaultLength: 35 },
  { id: 'dorsch', label: 'Dorsch', defaultLength: 45 },
  { id: OTHER_FISH_VALUE, label: 'Sonstiger Fisch', defaultLength: 35 },
];

const fishLabels = new Map(
  [...primaryFishOptions, ...otherFishOptions].map((fish) => [fish.id, fish.label]),
);
const primaryFishIds = primaryFishOptions.map((fish) => fish.id);

const baitCatalog: Record<FishSpecies, string[]> = {
  zander: ['Gummifisch', 'No-Action Shad', 'Wobbler', 'Crankbait', 'Köderfisch', 'Creature Bait'],
  hecht: ['Spinnerbait', 'Jerkbait', 'Gummifisch', 'Crankbait', 'Swimbait', 'Blinker'],
  barsch: ['Dropshot', 'Creature Bait', 'Micro Jig', 'Twitchbait', 'Spinner'],
  forelle: ['Spoon', 'Spinner', 'Tremarella', 'Wobbler klein', 'Bienenmade'],
  rapfen: ['Stickbait', 'Minnow Wobbler', 'Metallköder', 'Topwater', 'Streamer'],
  rotfeder: ['Mais', 'Made', 'Brotflocke', 'Mini-Pellet', 'Teig'],
  grundel: ['Wurmstück', 'Made', 'Mini-Jig', 'Dropshot klein', 'Teig'],
  aal: ['Tauwurm', 'Köderfisch', 'Made', 'Wurm', 'Grundmontage'],
  karpfen: ['Boilie', 'Mais', 'Pellet', 'Tigernuss', 'Method Feeder'],
  schleie: ['Wurm', 'Mais', 'Made', 'Teig', 'Mini-Boilie'],
  wels: ['Wallerholz', 'Tauwurmbündel', 'Köderfisch', 'Pellet', 'Calamari'],
  brassen: ['Futterkorb', 'Made', 'Mais', 'Wurm', 'Pellet'],
  dorsch: ['Pilker', 'Gummifisch', 'Naturköder', 'Jigkopf', 'Beifänger'],
  sonstiges: ['Wurm', 'Made', 'Mais', 'Gummifisch', 'Spinner'],
};

const fallbackBaits = ['Gummifisch', 'Tauwurm', 'Made', 'Grundmontage', 'Wobbler', 'Crankbait', 'Dropshot', 'Spinnerbait', 'Köderfisch'];
const quickBaitButtons = ['Spinner', 'Gummifisch', 'Wobbler', 'Crankbait'];
const methods = ['Jiggen', 'Faulenzen', 'Dropshot', 'Twitchbait', 'Ansitz', 'Topwater', 'Feeder', 'Pose'];

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

const getDateKey = (value: string) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const normalizeSpotName = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const getSpotCoordinateKey = (lat: number, lng: number) => `${lat.toFixed(4)},${lng.toFixed(4)}`;

function getTripMatchKey(trip: Pick<LogbookTrip, 'spotName' | 'lat' | 'lng'>) {
  const name = normalizeSpotName(trip.spotName);
  return name || getSpotCoordinateKey(trip.lat, trip.lng);
}

function dedupeTrips(trips: LogbookTrip[]) {
  const merged = new Map<string, LogbookTrip>();

  trips.forEach((trip) => {
    const nameKey = getTripMatchKey(trip);
    const coordinateKey = getSpotCoordinateKey(trip.lat, trip.lng);
    const existingKey = merged.has(nameKey)
      ? nameKey
      : [...merged.entries()].find(([, candidate]) => getSpotCoordinateKey(candidate.lat, candidate.lng) === coordinateKey)?.[0];

    if (existingKey) {
      const existing = merged.get(existingKey);
      if (!existing) return;
      merged.set(existingKey, {
        ...existing,
        catches: [...existing.catches, ...trip.catches],
      });
      return;
    }

    merged.set(nameKey, trip);
  });

  return [...merged.values()];
}

function readStoredTrips(): LogbookTrip[] {
  const parsed = readJson<LogbookTrip[]>(LOGBOOK_STORAGE_KEY, [], Array.isArray as (value: unknown) => value is LogbookTrip[]);
  return dedupeTrips(parsed);
}

function stripPersistedPhotoData(trips: LogbookTrip[]): LogbookTrip[] {
  return trips.map((trip) => ({
    ...trip,
    catches: trip.catches.map((entry) => ({
      ...entry,
      photoDataUrl: undefined,
    })),
  }));
}

function persistTrips(trips: LogbookTrip[]) {
  const result = writeJson(LOGBOOK_STORAGE_KEY, trips);

  if (!result.persisted && result.error instanceof DOMException) {
    const leanResult = writeJson(LOGBOOK_STORAGE_KEY, stripPersistedPhotoData(trips));
    return { ...leanResult, strippedPhotos: leanResult.persisted };
  }

  return { ...result, strippedPhotos: false };
}

function getWeatherSnapshot(weather: WeatherData | null): LogbookTrip['weather'] | undefined {
  if (!weather) return undefined;
  return {
    temperature: Math.round(weather.temperature),
    windSpeed: Math.round(weather.windSpeed),
    windDirection: Math.round(weather.windDirection),
    cloudCover: Math.round(weather.cloudCover),
  };
}

function getCurrentSpotSnapshot(
  name: string,
  currentLocation: { lat: number; lng: number },
  gpsPosition: GeoPosition | null,
): PendingSpot {
  const liveLocation = gpsPosition ?? { ...currentLocation, accuracy: undefined };
  return {
    name,
    lat: Number(liveLocation.lat.toFixed(5)),
    lng: Number(liveLocation.lng.toFixed(5)),
    accuracy: gpsPosition?.accuracy,
  };
}

const getMarkerTone = (catchCount: number, bestLength: number) => {
  if (catchCount >= 4 || bestLength >= 70) return 'bg-emerald-400 shadow-emerald-500/40';
  if (catchCount >= 2 || bestLength >= 45) return 'bg-amber-300 shadow-amber-500/40';
  return 'bg-red-400 shadow-red-500/40';
};

const getFishLabel = (id: FishSpecies, customName?: string) =>
  id === OTHER_FISH_VALUE && customName?.trim()
    ? customName.trim()
    : fishLabels.get(id) ?? 'Fisch';

const isNamedWater = (name: string) => {
  const normalized = name.toLowerCase();
  return !normalized.includes('kartenpunkt')
    && !normalized.includes('keine gewässerdaten')
    && !normalized.includes('unbekanntes gewässer');
};

const getDefaultLength = (id: FishSpecies) =>
  primaryFishOptions.find((fish) => fish.id === id)?.defaultLength
  ?? otherFishOptions.find((fish) => fish.id === id)?.defaultLength
  ?? 35;

const emptyCatch = (): Omit<CatchEntry, 'id'> => ({
  fishSpecies: 'zander',
  customFishName: '',
  lengthCm: 50,
  weight: '',
  weightUnit: 'g',
  caughtAt: new Date().toISOString(),
  bait: baitCatalog.zander[0],
  method: methods[0],
  released: true,
  notes: '',
  photoName: undefined,
  photoDataUrl: undefined,
});

function readPhotoPreview(file: File): Promise<{ name: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Foto konnte nicht gelesen werden.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Foto konnte nicht verarbeitet werden.'));
      image.onload = () => {
        const maxSize = 960;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('Foto konnte nicht vorbereitet werden.'));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve({ name: file.name, dataUrl: canvas.toDataURL('image/jpeg', 0.78) });
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const LogbookView: React.FC<LogbookViewProps> = ({
  currentLocation,
  gpsPosition,
  gpsLoading,
  gpsError,
  locationLabel,
  weather,
  waterName,
  baseUrl,
  quickAddRequest = 0,
}) => {
  const suggestedSpotName = waterName || locationLabel || 'Aktueller Spot';
  const [trips, setTrips] = useState<LogbookTrip[]>(readStoredTrips);
  const [activeTripId, setActiveTripId] = useState<string | null>(() => trips[0]?.id ?? null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [catchDraft, setCatchDraft] = useState(emptyCatch);
  const [spotDraftName, setSpotDraftName] = useState(suggestedSpotName);
  const [editingCatch, setEditingCatch] = useState<{ tripId: string; catchId: string } | null>(null);
  const [spotFeedback, setSpotFeedback] = useState('');
  const [pendingSpot, setPendingSpot] = useState<PendingSpot | null>(null);
  const [quickAddMapOpen, setQuickAddMapOpen] = useState(false);
  const [quickAddMapLoading, setQuickAddMapLoading] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<'local' | 'loading' | 'synced' | 'error'>('local');
  const [syncMessage, setSyncMessage] = useState('Lokal gespeichert');
  const handledQuickAddRequest = useRef(0);
  const remoteLoadedForUser = useRef<string | null>(null);
  const syncDebounce = useRef<number | null>(null);
  const didPersistInitialTrips = useRef(false);

  useEffect(() => {
    const persistResult = persistTrips(trips);

    if (persistResult.strippedPhotos) {
      setSyncStatus('error');
      setSyncMessage('Lokaler Speicher voll: Fotos bleiben nur bis zum Neuladen erhalten.');
    }

    if (didPersistInitialTrips.current) {
      markAccountDataSaved();
      return;
    }

    didPersistInitialTrips.current = true;
  }, [trips]);

  useEffect(() => {
    const clearLogbookState = () => {
      didPersistInitialTrips.current = false;
      setTrips([]);
      setActiveTripId(null);
      setSpotDraftName(suggestedSpotName);
      setEditingCatch(null);
      setPendingSpot(null);
      setQuickAddOpen(false);
      setQuickAddMapOpen(false);
    };

    window.addEventListener(ACCOUNT_DATA_CLEARED_EVENT, clearLogbookState);

    return () => {
      window.removeEventListener(ACCOUNT_DATA_CLEARED_EVENT, clearLogbookState);
    };
  }, [suggestedSpotName]);

  useEffect(() => {
    if (!supabase) return undefined;

    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) {
        setAuthUser(data.user ?? null);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (!session?.user) {
        remoteLoadedForUser.current = null;
        setSyncStatus('local');
        setSyncMessage('Lokal gespeichert');
      }
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authUser || remoteLoadedForUser.current === authUser.id) return;

    let cancelled = false;
    setSyncStatus('loading');
    setSyncMessage('Lade Supabase-Daten...');

    loadRemoteLogbook(authUser)
      .then((remoteTrips) => {
        if (cancelled) return;
        remoteLoadedForUser.current = authUser.id;
        setTrips((current) => mergeTrips(current, remoteTrips));
        setSyncStatus('synced');
        setSyncMessage('Mit Supabase verbunden');
      })
      .catch((error) => {
        if (cancelled) return;
        setSyncStatus('error');
        setSyncMessage(error instanceof Error ? error.message : 'Supabase konnte nicht geladen werden');
      });

    return () => {
      cancelled = true;
    };
  }, [authUser]);

  useEffect(() => {
    if (!authUser || remoteLoadedForUser.current !== authUser.id) return undefined;

    setSyncStatus('loading');
    setSyncMessage('Synchronisiere...');

    if (syncDebounce.current) {
      window.clearTimeout(syncDebounce.current);
    }

    syncDebounce.current = window.setTimeout(() => {
      syncLogbook(authUser, trips)
        .then(() => {
          markAccountDataSaved();
          setSyncStatus('synced');
          setSyncMessage('Synchronisiert');
        })
        .catch((error) => {
          setSyncStatus('error');
          setSyncMessage(error instanceof Error ? error.message : 'Sync fehlgeschlagen');
        });
    }, 700);

    return () => {
      if (syncDebounce.current) {
        window.clearTimeout(syncDebounce.current);
      }
    };
  }, [authUser, trips]);

  useEffect(() => {
    if (!activeTripId) {
      setSpotDraftName(suggestedSpotName);
    }
  }, [activeTripId, suggestedSpotName]);

  useEffect(() => {
    if (!spotFeedback) return undefined;
    const timeoutId = window.setTimeout(() => setSpotFeedback(''), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [spotFeedback]);

  const activeTrip = useMemo(
    () => trips.find((trip) => trip.id === activeTripId) ?? null,
    [activeTripId, trips],
  );

  const allCatches = useMemo(
    () => trips.flatMap((trip) => trip.catches.map((entry) => ({ ...entry, trip }))),
    [trips],
  );

  const recentBaits = useMemo(() => {
    const ranked = new Map<string, number>();
    allCatches.forEach((entry) => ranked.set(entry.bait, (ranked.get(entry.bait) ?? 0) + 1));
    const fromHistory = [...ranked.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([bait]) => bait);
    return [...new Set([...fromHistory, ...fallbackBaits])].slice(0, 8);
  }, [allCatches]);

  const selectedPrimaryFishId = primaryFishIds.includes(catchDraft.fishSpecies)
    ? catchDraft.fishSpecies
    : OTHER_FISH_VALUE;
  const selectedFishLabel = getFishLabel(catchDraft.fishSpecies, catchDraft.customFishName);
  const baitOptions = useMemo(
    () => [...new Set([...recentBaits, ...(baitCatalog[catchDraft.fishSpecies] ?? baitCatalog.sonstiges)])],
    [catchDraft.fishSpecies, recentBaits],
  );

  const stats = useMemo(() => {
    const bestLength = allCatches.reduce((best, entry) => Math.max(best, entry.lengthCm), 0);
    const releasedCount = allCatches.filter((entry) => entry.released).length;
    const fishingDays = new Set([
      ...trips.map((trip) => getDateKey(trip.startedAt)),
      ...allCatches.map((entry) => getDateKey(entry.caughtAt)),
    ]).size;
    const topBait = recentBaits[0] ?? fallbackBaits[0];
    const bestSpot = trips
      .map((trip) => ({ name: trip.spotName, count: trip.catches.length }))
      .sort((a, b) => b.count - a.count)[0]?.name ?? 'Noch offen';

    return {
      catches: allCatches.length,
      fishingDays,
      spots: trips.length,
      bestLength,
      releasedCount,
      topBait,
      bestSpot,
    };
  }, [allCatches, recentBaits, trips]);

  const spotSummaries = useMemo(
    () => trips
      .filter((trip) => trip.catches.length > 0)
      .map((trip) => ({
        id: trip.id,
        name: trip.spotName,
        lat: trip.lat,
        lng: trip.lng,
        catches: trip.catches.length,
        bestLength: trip.catches.reduce((best, entry) => Math.max(best, entry.lengthCm), 0),
        topBait: trip.catches[0]?.bait ?? 'Noch kein Köder',
      }))
      .slice(0, 6),
    [trips],
  );

  const createTrip = useCallback((
    name = spotDraftName,
    selectedLocation?: { lat: number; lng: number; accuracy?: number },
  ) => {
    const liveLocation = selectedLocation ?? gpsPosition ?? { ...currentLocation, accuracy: undefined };
    const cleanedName = name.trim() || suggestedSpotName;
    const nextLat = Number(liveLocation.lat.toFixed(5));
    const nextLng = Number(liveLocation.lng.toFixed(5));
    const duplicate = trips.find((trip) => (
      normalizeSpotName(trip.spotName) === normalizeSpotName(cleanedName)
      || getSpotCoordinateKey(trip.lat, trip.lng) === getSpotCoordinateKey(nextLat, nextLng)
    ));

    if (duplicate) {
      setActiveTripId(duplicate.id);
      setSpotDraftName(duplicate.spotName);
      setPendingSpot(null);
      return duplicate.id;
    }

    const trip: LogbookTrip = {
      id: createId('trip'),
      startedAt: new Date().toISOString(),
      spotName: cleanedName,
      lat: nextLat,
      lng: nextLng,
      accuracy: selectedLocation?.accuracy ?? gpsPosition?.accuracy,
      weather: getWeatherSnapshot(weather),
      water: {
        temperature: undefined,
        clarity: 'mittel',
        current: 'unbekannt',
      },
      catches: [],
    };

    setTrips((current) => [trip, ...current]);
    setActiveTripId(trip.id);
    setSpotDraftName(cleanedName);
    return trip.id;
  }, [currentLocation, gpsPosition, spotDraftName, suggestedSpotName, trips, weather]);

  const getOrCreateTripForSpot = useCallback((spot: PendingSpot) => {
    const duplicate = trips.find((trip) => (
      normalizeSpotName(trip.spotName) === normalizeSpotName(spot.name)
      || getSpotCoordinateKey(trip.lat, trip.lng) === getSpotCoordinateKey(spot.lat, spot.lng)
    ));

    if (duplicate) {
      setActiveTripId(duplicate.id);
      setSpotDraftName(duplicate.spotName);
      return duplicate.id;
    }

    const trip: LogbookTrip = {
      id: createId('trip'),
      startedAt: new Date().toISOString(),
      spotName: spot.name,
      lat: Number(spot.lat.toFixed(5)),
      lng: Number(spot.lng.toFixed(5)),
      accuracy: spot.accuracy,
      weather: getWeatherSnapshot(weather),
      water: {
        temperature: undefined,
        clarity: 'mittel',
        current: 'unbekannt',
      },
      catches: [],
    };

    setTrips((current) => [trip, ...current]);
    setActiveTripId(trip.id);
    setSpotDraftName(trip.spotName);
    setPendingSpot(null);
    return trip.id;
  }, [trips, weather]);

  const renameActiveTrip = () => {
    if (!activeTrip) return;
    const cleanedName = spotDraftName.trim();
    if (!cleanedName) return;
    setTrips((current) => current.map((trip) => (
      trip.id === activeTrip.id ? { ...trip, spotName: cleanedName } : trip
    )));
  };

  const deleteTrip = (tripId: string) => {
    const trip = trips.find((candidate) => candidate.id === tripId);
    const shouldDelete = window.confirm(
      `Spot "${trip?.spotName ?? 'ohne Namen'}" samt allen Fängen löschen?`,
    );
    if (!shouldDelete) return;

    const remainingTrips = trips.filter((candidate) => candidate.id !== tripId);
    setTrips(remainingTrips);

    if (activeTripId === tripId) {
      const nextTrip = remainingTrips[0] ?? null;
      setActiveTripId(nextTrip?.id ?? null);
      setSpotDraftName(nextTrip?.spotName ?? suggestedSpotName);
    }

    if (editingCatch?.tripId === tripId) {
      setEditingCatch(null);
      setQuickAddOpen(false);
      setCatchDraft(emptyCatch());
    }

    if (authUser) {
      deleteRemoteSpot(authUser, tripId).catch((error) => {
        setSyncStatus('error');
        setSyncMessage(error instanceof Error ? error.message : 'Spot konnte remote nicht gelöscht werden');
      });
    }
  };

  const selectTrip = (tripId: string) => {
    const nextTrip = trips.find((trip) => trip.id === tripId);
    setActiveTripId(tripId);
    if (nextTrip) {
      setSpotDraftName(nextTrip.spotName);
      setSpotFeedback(`${nextTrip.spotName} als Spot ausgewählt.`);
    }
  };

  const resetDraftForNewCatch = useCallback(() => {
    const nextDraft = emptyCatch();
    nextDraft.bait = recentBaits[0] ?? baitCatalog.zander[0];
    nextDraft.caughtAt = new Date().toISOString();
    setCatchDraft(nextDraft);
    setEditingCatch(null);
  }, [recentBaits]);

  const openQuickAdd = useCallback(() => {
    setPendingSpot(activeTrip
      ? {
          name: activeTrip.spotName,
          lat: activeTrip.lat,
          lng: activeTrip.lng,
          accuracy: activeTrip.accuracy,
        }
      : getCurrentSpotSnapshot(spotDraftName || suggestedSpotName, currentLocation, gpsPosition));
    resetDraftForNewCatch();
    setQuickAddMapOpen(false);
    setQuickAddOpen(true);
  }, [activeTrip, currentLocation, gpsPosition, resetDraftForNewCatch, spotDraftName, suggestedSpotName]);

  const selectMapWaterForCatch = async (location: { lat: number; lng: number; label: string }) => {
    setQuickAddMapLoading(true);
    setSpotFeedback('Suche nächstes Gewässer...');

    try {
      const profile = await waterDataService.getWaterProfile(location.lat, location.lng);
      const waterName = isNamedWater(profile.name)
        ? profile.name
        : isNamedWater(location.label)
          ? location.label
          : '';

      if (!waterName) {
        setSpotFeedback('Kein Gewässer in der Nähe gefunden. Bitte näher an ein Gewässer tippen.');
        return;
      }

      const nextSpot = {
        name: waterName,
        lat: Number((profile.dataQuality === 'unknown' ? location.lat : profile.latitude).toFixed(5)),
        lng: Number((profile.dataQuality === 'unknown' ? location.lng : profile.longitude).toFixed(5)),
      };

      setPendingSpot(nextSpot);
      setSpotDraftName(waterName);
      setSpotFeedback(`${waterName} für diesen Fang ausgewählt. Historie entsteht erst beim Speichern.`);
    } catch (error) {
      setSpotFeedback(error instanceof Error ? error.message : 'Gewässer konnte nicht ermittelt werden.');
    } finally {
      setQuickAddMapLoading(false);
    }
  };

  useEffect(() => {
    if (!quickAddRequest || quickAddRequest === handledQuickAddRequest.current) return;
    handledQuickAddRequest.current = quickAddRequest;
    openQuickAdd();
  }, [openQuickAdd, quickAddRequest]);

  const copyLastCatch = () => {
    const lastCatch = allCatches[0];
    if (!lastCatch) return;
    setCatchDraft({
      fishSpecies: lastCatch.fishSpecies,
      customFishName: lastCatch.customFishName ?? '',
      lengthCm: lastCatch.lengthCm,
      weight: lastCatch.weight ?? '',
      weightUnit: lastCatch.weightUnit,
      caughtAt: new Date().toISOString(),
      bait: lastCatch.bait,
      method: lastCatch.method,
      released: lastCatch.released,
      notes: '',
      photoName: undefined,
      photoDataUrl: undefined,
    });
    setEditingCatch(null);
    setPendingSpot({
      name: lastCatch.trip.spotName,
      lat: lastCatch.trip.lat,
      lng: lastCatch.trip.lng,
      accuracy: lastCatch.trip.accuracy,
    });
    setQuickAddOpen(true);
  };

  const updateDraft = <K extends keyof Omit<CatchEntry, 'id'>>(key: K, value: Omit<CatchEntry, 'id'>[K]) => {
    setCatchDraft((draft) => ({ ...draft, [key]: value }));
  };

  const selectFishSpecies = (fishSpecies: FishSpecies) => {
    const catalog = baitCatalog[fishSpecies] ?? baitCatalog.sonstiges;
    setCatchDraft((draft) => ({
      ...draft,
      fishSpecies,
      customFishName: fishSpecies === OTHER_FISH_VALUE ? draft.customFishName : '',
      lengthCm: getDefaultLength(fishSpecies),
      bait: catalog[0],
    }));
  };

  const editCatchEntry = (tripId: string, entry: CatchEntry) => {
    const trip = trips.find((candidate) => candidate.id === tripId);
    setActiveTripId(tripId);
    if (trip) {
      setSpotDraftName(trip.spotName);
      setPendingSpot({
        name: trip.spotName,
        lat: trip.lat,
        lng: trip.lng,
        accuracy: trip.accuracy,
      });
    }
    setCatchDraft({
      fishSpecies: entry.fishSpecies,
      customFishName: entry.customFishName ?? '',
      lengthCm: entry.lengthCm,
      weight: entry.weight ?? '',
      weightUnit: entry.weightUnit,
      caughtAt: entry.caughtAt,
      bait: entry.bait,
      method: entry.method,
      released: entry.released,
      notes: entry.notes,
      photoName: entry.photoName,
      photoDataUrl: entry.photoDataUrl,
    });
    setEditingCatch({ tripId, catchId: entry.id });
    setQuickAddOpen(true);
  };

  const deleteCatchEntry = (tripId: string, catchId: string) => {
    const shouldDelete = window.confirm('Diesen Fang wirklich löschen?');
    if (!shouldDelete) return;

    setTrips((current) => current.map((trip) => (
      trip.id === tripId
        ? { ...trip, catches: trip.catches.filter((entry) => entry.id !== catchId) }
        : trip
    )));

    if (editingCatch?.catchId === catchId) {
      setEditingCatch(null);
      setQuickAddOpen(false);
      setCatchDraft(emptyCatch());
    }

    if (authUser) {
      deleteRemoteCatch(authUser, catchId).catch((error) => {
        setSyncStatus('error');
        setSyncMessage(error instanceof Error ? error.message : 'Fang konnte remote nicht gelöscht werden');
      });
    }
  };

  const saveCatch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const spotForSave = pendingSpot
      ?? (activeTrip
        ? {
            name: activeTrip.spotName,
            lat: activeTrip.lat,
            lng: activeTrip.lng,
            accuracy: activeTrip.accuracy,
          }
        : getCurrentSpotSnapshot(spotDraftName || suggestedSpotName, currentLocation, gpsPosition));
    const tripId = editingCatch?.tripId ?? getOrCreateTripForSpot(spotForSave);
    const entry: CatchEntry = {
      id: editingCatch?.catchId ?? createId('catch'),
      ...catchDraft,
      lengthCm: Math.max(1, Math.round(Number(catchDraft.lengthCm) || 1)),
      customFishName: catchDraft.fishSpecies === OTHER_FISH_VALUE ? catchDraft.customFishName?.trim() : '',
      bait: catchDraft.bait.trim() || baitCatalog[catchDraft.fishSpecies]?.[0] || fallbackBaits[0],
      method: catchDraft.method.trim() || methods[0],
      notes: catchDraft.notes.trim(),
      weight: catchDraft.weight?.trim(),
    };

    setTrips((current) => current.map((trip) => {
      if (trip.id !== tripId) return trip;

      if (editingCatch) {
        return {
          ...trip,
          catches: trip.catches.map((candidate) => (
            candidate.id === editingCatch.catchId ? entry : candidate
          )),
        };
      }

      return { ...trip, catches: [entry, ...trip.catches] };
    }));

    setCatchDraft(emptyCatch());
    setEditingCatch(null);
    setPendingSpot(null);
    setQuickAddMapOpen(false);
    setQuickAddOpen(false);
  };

  const gpsText = gpsPosition
    ? `GPS +/-${Math.round(gpsPosition.accuracy)} m`
    : gpsLoading
      ? 'GPS wird erfasst'
      : gpsError
        ? 'GPS nicht verfügbar'
        : 'GPS bereit';
  const gpsStatusClass = gpsError
    ? 'text-red-300'
    : gpsPosition
      ? 'text-emerald-200'
      : 'text-slate-300';
  const syncStatusClass = syncStatus === 'error'
    ? 'text-red-300'
    : syncStatus === 'synced'
      ? 'text-emerald-300'
      : 'text-slate-300';

  return (
    <div className="space-y-5 pb-24">
      <section className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4 shadow-lg shadow-slate-950/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Logbuch</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white">Fang schnell sichern</h2>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-300">
              Spot wählen, Fang antippen, speichern. Pflicht bleibt nur Fischart und ungefähre Größe.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-300/20 bg-slate-950/50 px-3 py-2 text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Status</p>
            <p className={`text-xs font-black ${gpsStatusClass}`}>{gpsText}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={openQuickAdd}
          className="mt-4 flex min-h-[56px] w-full items-center justify-center gap-3 rounded-lg bg-emerald-400 px-5 py-4 text-sm font-black uppercase tracking-wide text-slate-950 shadow-lg shadow-emerald-950/40 transition-transform active:scale-[0.98]"
        >
          <span className="text-2xl leading-none">+</span>
          Fang hinzufügen
        </button>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => createTrip()}
            className="min-h-[48px] rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-100"
          >
            GPS-Spot starten
          </button>
          <button
            type="button"
            onClick={copyLastCatch}
            disabled={allCatches.length === 0}
            className="min-h-[48px] rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-100 disabled:opacity-40"
          >
            Wie letztes Mal
          </button>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Sync</h3>
            <p className={`mt-1 text-xs font-black ${syncStatusClass}`}>{syncMessage}</p>
          </div>
        </div>

        {!isSupabaseConfigured ? (
          <p className="text-xs font-semibold text-red-300">Supabase ENV fehlt. Prüfe `.env.local`.</p>
        ) : authUser ? (
          <p className="text-xs font-semibold text-slate-400">
            Eingeloggt als <span className="font-black text-slate-200">{authUser.email}</span>. Neue Änderungen werden automatisch synchronisiert.
          </p>
        ) : (
          <p className="text-xs font-semibold text-slate-400">
            Lokal gespeichert. Für Sync auf Handy und Desktop oben rechts über das Account-Icon einloggen.
          </p>
        )}
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Spot auswählen</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Dieser Spot wird für neue Fänge verwendet.</p>
          </div>
          <span className="rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-[10px] font-black uppercase text-emerald-300">
            {activeTrip ? 'aktiv' : 'neu'}
          </span>
        </div>

        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gespeicherter Spot</span>
          <select
            value={activeTripId ?? ''}
            onChange={(event) => {
              if (event.target.value) {
                selectTrip(event.target.value);
              } else {
                setActiveTripId(null);
                setSpotDraftName(suggestedSpotName);
              }
            }}
            className="mt-1 h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-bold text-white outline-none focus:border-emerald-300"
          >
            <option value="">Neuen GPS-Spot verwenden</option>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.spotName} · {formatDateTime(trip.startedAt)} · {trip.catches.length} Fänge
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Spotname</span>
            <input
              value={spotDraftName}
              onChange={(event) => setSpotDraftName(event.target.value)}
              placeholder={suggestedSpotName}
              className="mt-1 h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
            />
          </label>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
            <button
              type="button"
              onClick={() => createTrip()}
              className="min-h-[48px] rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-emerald-200"
            >
              Neu mit GPS
            </button>
            <button
              type="button"
              onClick={renameActiveTrip}
              disabled={!activeTrip}
              className="min-h-[48px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-100 disabled:opacity-40"
            >
              Umbenennen
            </button>
            <button
              type="button"
              onClick={() => activeTrip && deleteTrip(activeTrip.id)}
              disabled={!activeTrip}
              className="min-h-[48px] rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-lg font-black leading-none text-red-200 disabled:opacity-40"
              aria-label="Spot löschen"
              title="Spot löschen"
            >
              ×
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Aktiver Spot</p>
          <p className="mt-1 text-sm font-black text-white">{activeTrip?.spotName ?? spotDraftName}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">
            {activeTrip
              ? `${activeTrip.lat}, ${activeTrip.lng}${activeTrip.accuracy ? ` · +/-${Math.round(activeTrip.accuracy)} m` : ''}`
              : `${currentLocation.lat}, ${currentLocation.lng} · ${gpsText}`}
          </p>
        </div>
        {spotFeedback && (
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-200">
            {spotFeedback}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Heute / Aktiv</p>
          <p className="mt-2 text-xl font-black text-white">{activeTrip ? formatDateTime(activeTrip.startedAt) : 'Neuer Spot'}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">{activeTrip?.spotName ?? spotDraftName}</p>
        </div>
        <div className="card">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Wetter</p>
          <p className="mt-2 text-xl font-black text-white">{weather ? `${Math.round(weather.temperature)}°C` : '--'}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {weather ? `${Math.round(weather.windSpeed)} km/h Wind · ${Math.round(weather.cloudCover)}% Wolken` : 'Offline speicherbar'}
          </p>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Meine Angel-Spots</h3>
          <span className="text-[10px] font-bold text-slate-500">{spotSummaries.length || 'keine'} Marker</span>
        </div>
        <div className="relative min-h-[180px] overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
          <div className="absolute inset-0 opacity-70">
            <div className="h-full w-full bg-[linear-gradient(135deg,rgba(15,23,42,1)_0%,rgba(20,83,45,0.55)_48%,rgba(8,47,73,0.9)_100%)]" />
            <div className="absolute left-[-10%] top-[44%] h-12 w-[120%] rotate-[-8deg] bg-cyan-400/20 blur-sm" />
            <div className="absolute left-[8%] top-[20%] h-[1px] w-[86%] rotate-12 bg-slate-500/25" />
            <div className="absolute left-[18%] top-[72%] h-[1px] w-[78%] rotate-[-16deg] bg-slate-500/20" />
          </div>
          {spotSummaries.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-xs font-bold text-slate-400">
              Der erste gespeicherte Fang setzt deinen ersten Spot-Marker.
            </div>
          )}
          {spotSummaries.map((spot, index) => (
            <button
              key={spot.id}
              type="button"
              onClick={() => selectTrip(spot.id)}
              className={`absolute h-5 w-5 rounded-full border-2 border-white/80 shadow-lg ${getMarkerTone(spot.catches, spot.bestLength)}`}
              style={{
                left: `${18 + (index * 17) % 66}%`,
                top: `${22 + (index * 23) % 54}%`,
              }}
              title={`${spot.name}: ${spot.catches} Fänge, bester ${spot.bestLength} cm, Top-Köder ${spot.topBait}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2 py-2">
            <p className="text-[9px] font-black uppercase text-emerald-300">Grün</p>
            <p className="text-[10px] font-semibold text-slate-400">stark</p>
          </div>
          <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 px-2 py-2">
            <p className="text-[9px] font-black uppercase text-amber-200">Gelb</p>
            <p className="text-[10px] font-semibold text-slate-400">mittel</p>
          </div>
          <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-2 py-2">
            <p className="text-[9px] font-black uppercase text-red-300">Rot</p>
            <p className="text-[10px] font-semibold text-slate-400">wenig</p>
          </div>
        </div>
      </section>

      <section className="card space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Statistiken</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Fänge', stats.catches],
            ['Angeltage', stats.fishingDays],
            ['Spots', stats.spots],
            ['Bestmaß', stats.bestLength ? `${stats.bestLength} cm` : '--'],
            ['Released', stats.catches ? `${Math.round((stats.releasedCount / stats.catches) * 100)}%` : '--'],
            ['Top-Köder', stats.catches ? stats.topBait : '--'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-black text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Top-Empfehlung</p>
          <p className="mt-1 text-sm font-bold text-slate-200">
            {stats.topBait} an {stats.bestSpot}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Logbuch-Historie</h3>
          <span className="text-[10px] font-bold text-slate-500">bearbeitbar</span>
        </div>
        {trips.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 bg-slate-800/25 px-5 py-8 text-center">
            <p className="text-sm font-bold text-slate-300">Noch keine Einträge.</p>
            <p className="mt-1 text-xs text-slate-500">Ein Fang reicht, dann entsteht dein erstes Logbuch automatisch.</p>
          </div>
        ) : (
          trips.map((trip) => (
            <article key={trip.id} className="card space-y-3">
              <button
                type="button"
                onClick={() => selectTrip(trip.id)}
                className="block w-full text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{formatDateTime(trip.startedAt)}</p>
                    <h4 className="mt-1 text-base font-black text-white">{trip.spotName}</h4>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">
                      {trip.lat}, {trip.lng}{trip.accuracy ? ` · +/-${Math.round(trip.accuracy)} m` : ''}
                    </p>
                  </div>
                  <span className="rounded-lg bg-slate-950/70 px-3 py-2 text-sm font-black text-emerald-300">
                    {trip.catches.length}
                  </span>
                </div>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => selectTrip(trip.id)}
                  className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-100"
                >
                  Spot wählen
                </button>
                <button
                  type="button"
                  onClick={() => deleteTrip(trip.id)}
                  className="min-h-[40px] rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-lg font-black leading-none text-red-200"
                  aria-label="Spot löschen"
                  title="Spot löschen"
                >
                  ×
                </button>
              </div>
              {trip.catches.length > 0 && (
                <div className="space-y-2">
                  {trip.catches.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-slate-700 bg-slate-900/70 p-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-100">{getFishLabel(entry.fishSpecies, entry.customFishName)} · {entry.lengthCm} cm</p>
                          <p className="truncate text-[11px] font-semibold text-slate-500">{formatTime(entry.caughtAt)} · {entry.bait}</p>
                        </div>
                        {entry.photoDataUrl && (
                          <img
                            src={entry.photoDataUrl}
                            alt=""
                            className="h-11 w-11 rounded-md object-cover"
                            loading="lazy"
                          />
                        )}
                        <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-black uppercase ${entry.released ? 'bg-cyan-400/10 text-cyan-300' : 'bg-amber-300/10 text-amber-200'}`}>
                          {entry.released ? 'Released' : 'Mitgenommen'}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => editCatchEntry(trip.id, entry)}
                          className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-100"
                        >
                          Bearbeiten
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCatchEntry(trip.id, entry.id)}
                          className="min-h-[40px] rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-red-200"
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </section>

      <button
        type="button"
        onClick={openQuickAdd}
        className="fixed bottom-24 left-1/2 z-30 flex min-h-[58px] w-[min(92vw,28rem)] -translate-x-1/2 items-center justify-center gap-3 rounded-lg bg-emerald-400 px-5 py-4 text-sm font-black uppercase tracking-wide text-slate-950 shadow-2xl shadow-slate-950/60 active:scale-[0.98]"
      >
        <span className="text-2xl leading-none">+</span>
        Fang hinzufügen
      </button>

      {quickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/75 backdrop-blur-sm">
          <form onSubmit={saveCatch} className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg border-t border-slate-700 bg-slate-900 p-4 shadow-2xl">
            <div className="mx-auto max-w-lg space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    {editingCatch ? 'Fang bearbeiten' : 'Schnellerfassung'}
                  </p>
                  <h3 className="text-xl font-black text-white">
                    {editingCatch ? `${selectedFishLabel} bearbeiten` : 'Fang hinzufügen'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddOpen(false);
                    setEditingCatch(null);
                    setPendingSpot(null);
                    setQuickAddMapOpen(false);
                  }}
                  className="min-h-[44px] min-w-[44px] rounded-lg border border-slate-700 bg-slate-800 text-lg font-black text-slate-200"
                  aria-label="Schließen"
                >
                  ×
                </button>
              </div>

              <section className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Spot für diesen Fang</p>
                    <p className="mt-1 text-sm font-black text-white">{pendingSpot?.name ?? activeTrip?.spotName ?? spotDraftName}</p>
                    {pendingSpot && !editingCatch && (
                      <p className="mt-1 text-[10px] font-semibold text-emerald-300">Historie entsteht erst beim Speichern</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickAddMapOpen((open) => !open)}
                      className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border px-3 py-2 text-lg font-black ${
                        quickAddMapOpen
                          ? 'border-emerald-300 bg-emerald-400/15 text-emerald-100'
                          : 'border-slate-700 bg-slate-800 text-slate-100'
                      }`}
                      aria-label="Gewässer auf Karte auswählen"
                      title="Gewässer auf Karte auswählen"
                    >
                      🗺️
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextSpot = getCurrentSpotSnapshot(spotDraftName || suggestedSpotName, currentLocation, gpsPosition);
                        setPendingSpot(nextSpot);
                        setSpotDraftName(nextSpot.name);
                        setSpotFeedback(`${nextSpot.name} per GPS für diesen Fang ausgewählt. Historie entsteht erst beim Speichern.`);
                      }}
                      className="min-h-[44px] rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-emerald-200"
                    >
                      GPS
                    </button>
                  </div>
                </div>
                <select
                  value={pendingSpot ? '' : activeTripId ?? ''}
                  onChange={(event) => {
                    if (event.target.value) {
                      selectTrip(event.target.value);
                      const trip = trips.find((candidate) => candidate.id === event.target.value);
                      setPendingSpot(trip
                        ? {
                            name: trip.spotName,
                            lat: trip.lat,
                            lng: trip.lng,
                            accuracy: trip.accuracy,
                          }
                        : null);
                    }
                  }}
                  className="mt-3 h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-bold text-white outline-none focus:border-emerald-300"
                >
                  <option value="">Neuer Spot für diesen Fang</option>
                  {trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.spotName} · {trip.catches.length} Fänge
                    </option>
                  ))}
                </select>
                {quickAddMapOpen && (
                  <div className="mt-3 space-y-2">
                    <LocationPickerMap
                      center={activeTrip ? { lat: activeTrip.lat, lng: activeTrip.lng } : currentLocation}
                      onSelect={selectMapWaterForCatch}
                    />
                    <p className="text-[10px] font-semibold text-slate-500">
                      {quickAddMapLoading
                        ? 'Nächstes Gewässer wird ermittelt...'
                        : 'Gewässer oder Kartenbereich antippen. Gespeichert wird das nächste erkannte Gewässer, nicht der rohe Kartenpunkt.'}
                    </p>
                  </div>
                )}
              </section>

              <div className="grid grid-cols-4 gap-2">
                {primaryFishOptions.map((fish) => (
                  <button
                    key={fish.id}
                    type="button"
                    onClick={() => selectFishSpecies(fish.id === OTHER_FISH_VALUE ? 'aal' : fish.id)}
                    className={`min-h-[84px] rounded-lg border px-2 py-2 transition-colors ${
                      selectedPrimaryFishId === fish.id
                        ? 'border-emerald-300 bg-emerald-400/15 text-white'
                        : 'border-slate-700 bg-slate-950/50 text-slate-400'
                    }`}
                  >
                    <img src={`${baseUrl}${fish.icon}`} alt="" className="mx-auto h-8 w-16 object-contain invert" />
                    <span className="mt-1 block text-[9px] font-black uppercase tracking-wide">{fish.label}</span>
                  </button>
                ))}
              </div>

              {selectedPrimaryFishId === OTHER_FISH_VALUE && (
                <div className="grid gap-3">
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Andere Fischart</span>
                    <select
                      value={catchDraft.fishSpecies}
                      onChange={(event) => selectFishSpecies(event.target.value as FishSpecies)}
                      className="mt-1 h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-bold text-white outline-none focus:border-emerald-300"
                    >
                      {otherFishOptions.map((fish) => (
                        <option key={fish.id} value={fish.id}>{fish.label}</option>
                      ))}
                    </select>
                  </label>
                  {catchDraft.fishSpecies === OTHER_FISH_VALUE && (
                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fischart eingeben</span>
                      <input
                        value={catchDraft.customFishName ?? ''}
                        onChange={(event) => updateDraft('customFishName', event.target.value)}
                        placeholder="z.B. Döbel, Plötze, Meeräsche"
                        className="mt-1 h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
                      />
                    </label>
                  )}
                </div>
              )}

              <label className="block rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Länge · Pflichtfeld</span>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="180"
                    value={catchDraft.lengthCm}
                    onChange={(event) => updateDraft('lengthCm', Number(event.target.value))}
                    className="min-w-0 flex-1 accent-emerald-400"
                  />
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={catchDraft.lengthCm}
                    onChange={(event) => updateDraft('lengthCm', Number(event.target.value))}
                    className="h-12 w-20 rounded-lg border border-slate-700 bg-slate-900 text-center text-lg font-black text-white outline-none focus:border-emerald-300"
                  />
                  <span className="text-sm font-black text-slate-400">cm</span>
                </div>
              </label>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Köder</p>
                  <span className="text-[10px] font-bold text-slate-500">{selectedFishLabel}</span>
                </div>
                <select
                  value={baitOptions.includes(catchDraft.bait) ? catchDraft.bait : ''}
                  onChange={(event) => updateDraft('bait', event.target.value || '')}
                  className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-bold text-white outline-none focus:border-emerald-300"
                >
                  <option value="">Vorschlag auswählen</option>
                  {baitOptions.map((bait) => <option key={bait} value={bait}>{bait}</option>)}
                </select>
                <input
                  value={catchDraft.bait}
                  onChange={(event) => updateDraft('bait', event.target.value)}
                  placeholder="Köder frei eintragen"
                  className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
                />
                <div className="grid grid-cols-2 gap-2">
                  {quickBaitButtons.map((bait) => (
                    <button
                      key={bait}
                      type="button"
                      onClick={() => updateDraft('bait', bait)}
                      className={`min-h-[40px] rounded-lg border px-3 py-2 text-left text-[10px] font-black ${
                        catchDraft.bait === bait
                          ? 'border-emerald-300 bg-emerald-400/15 text-emerald-100'
                          : 'border-slate-700 bg-slate-950/50 text-slate-300'
                      }`}
                    >
                      {bait}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Methode</span>
                  <select
                    value={catchDraft.method}
                    onChange={(event) => updateDraft('method', event.target.value)}
                    className="mt-1 h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-bold text-white outline-none focus:border-emerald-300"
                  >
                    {methods.map((method) => <option key={method}>{method}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gewicht</span>
                  <div className="mt-1 flex h-12 rounded-lg border border-slate-700 bg-slate-950 focus-within:border-emerald-300">
                    <input
                      value={catchDraft.weight}
                      onChange={(event) => updateDraft('weight', event.target.value)}
                      inputMode="decimal"
                      className="min-w-0 flex-1 bg-transparent px-3 text-sm font-bold text-white outline-none"
                      placeholder="optional"
                    />
                    <select
                      value={catchDraft.weightUnit}
                      onChange={(event) => updateDraft('weightUnit', event.target.value as WeightUnit)}
                      className="bg-transparent px-2 text-xs font-black text-slate-300 outline-none"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex min-h-[52px] items-center justify-between rounded-lg border border-slate-700 bg-slate-950/50 px-3">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-300">Released</span>
                  <input
                    type="checkbox"
                    checked={catchDraft.released}
                    onChange={(event) => updateDraft('released', event.target.checked)}
                    className="h-6 w-6 accent-emerald-400"
                  />
                </label>
                <label className="flex min-h-[52px] items-center justify-center rounded-lg border border-slate-700 bg-slate-950/50 px-3 text-center text-xs font-black uppercase tracking-wide text-slate-300">
                  Foto
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      try {
                        const preview = await readPhotoPreview(file);
                        setCatchDraft((draft) => ({
                          ...draft,
                          photoName: preview.name,
                          photoDataUrl: preview.dataUrl,
                        }));
                      } catch {
                        updateDraft('photoName', file.name);
                      }
                    }}
                    className="sr-only"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notizen</span>
                <textarea
                  value={catchDraft.notes}
                  onChange={(event) => updateDraft('notes', event.target.value)}
                  rows={3}
                  placeholder={`z.B. ${selectedFishLabel} stand an der Kante, Biss direkt nach Köderwechsel`}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300"
                />
              </label>

              <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Snapshot</p>
                <p className="mt-1 text-xs font-semibold text-slate-300">
                  {activeTrip?.spotName ?? spotDraftName} · {gpsText}
                  {catchDraft.photoName ? ` · Foto: ${catchDraft.photoName}` : ''}
                </p>
              </div>

              <div className="grid gap-2">
                <button
                  type="submit"
                  className="min-h-[56px] w-full rounded-lg bg-emerald-400 px-5 py-4 text-sm font-black uppercase tracking-wide text-slate-950 shadow-lg shadow-emerald-950/40"
                >
                  {editingCatch ? 'Änderungen speichern ✓' : 'Speichern ✓'}
                </button>
                {editingCatch && (
                  <button
                    type="button"
                    onClick={() => deleteCatchEntry(editingCatch.tripId, editingCatch.catchId)}
                    className="min-h-[48px] w-full rounded-lg border border-red-400/30 bg-red-400/10 px-5 py-3 text-xs font-black uppercase tracking-wide text-red-200"
                  >
                    Fang löschen
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default LogbookView;
