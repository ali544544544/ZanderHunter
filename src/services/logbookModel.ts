import type { CatchEntry, FishSpecies, LogbookTrip, WeightUnit } from '../components/LogbookView';

const validFishSpecies = new Set<FishSpecies>([
  'zander',
  'hecht',
  'barsch',
  'forelle',
  'rapfen',
  'rotfeder',
  'grundel',
  'aal',
  'karpfen',
  'schleie',
  'wels',
  'brassen',
  'dorsch',
  'sonstiges',
]);

const validWeightUnits = new Set<WeightUnit>(['g', 'kg']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function text(value: unknown, fallback = '', maxLength = 160) {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/[ \t]+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}

function multilineText(value: unknown, maxLength = 1200) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

function finiteNumber(value: unknown, fallback: number) {
  const next = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeIsoDate(value: unknown, fallback = new Date().toISOString()) {
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : null;
  if (date && Number.isFinite(date.getTime())) return date.toISOString();

  const fallbackDate = new Date(fallback);
  return Number.isFinite(fallbackDate.getTime()) ? fallbackDate.toISOString() : new Date().toISOString();
}

export function normalizeWeight(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const raw = String(value).trim();
  if (raw.startsWith('-')) return '';
  const compact = raw.replace(/\s+/g, '').replace(',', '.').replace(/[^\d.]/g, '');
  if (!compact) return '';

  const parts = compact.split('.');
  const normalized = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : compact;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return normalized.slice(0, 12);
}

function normalizeFishSpecies(value: unknown): FishSpecies {
  return typeof value === 'string' && validFishSpecies.has(value as FishSpecies)
    ? value as FishSpecies
    : 'zander';
}

function normalizeWeightUnit(value: unknown): WeightUnit {
  return typeof value === 'string' && validWeightUnits.has(value as WeightUnit)
    ? value as WeightUnit
    : 'g';
}

function normalizeWeather(value: unknown): LogbookTrip['weather'] | undefined {
  if (!isRecord(value)) return undefined;
  return {
    temperature: Math.round(clamp(finiteNumber(value.temperature, 0), -60, 60)),
    windSpeed: Math.round(clamp(finiteNumber(value.windSpeed, 0), 0, 250)),
    windDirection: Math.round(clamp(finiteNumber(value.windDirection, 0), 0, 360)),
    cloudCover: Math.round(clamp(finiteNumber(value.cloudCover, 0), 0, 100)),
  };
}

function normalizeWater(value: unknown): LogbookTrip['water'] | undefined {
  if (!isRecord(value)) return undefined;
  const waterTemperature = value.temperature === undefined
    ? undefined
    : clamp(finiteNumber(value.temperature, 0), -5, 40);

  return {
    temperature: waterTemperature,
    clarity: text(value.clarity, 'unbekannt', 40),
    current: text(value.current, 'unbekannt', 40),
  };
}

export function normalizeCatchEntry(
  value: unknown,
  fallbackId: string,
  fallbackDate = new Date().toISOString(),
): CatchEntry | null {
  if (!isRecord(value)) return null;

  const fishSpecies = normalizeFishSpecies(value.fishSpecies);
  const caughtAt = normalizeIsoDate(value.caughtAt, fallbackDate);
  const photoDataUrl = typeof value.photoDataUrl === 'string' && value.photoDataUrl.startsWith('data:image/')
    ? value.photoDataUrl
    : undefined;

  return {
    id: text(value.id, fallbackId, 120),
    fishSpecies,
    customFishName: fishSpecies === 'sonstiges' ? text(value.customFishName, '', 80) : '',
    lengthCm: Math.round(clamp(finiteNumber(value.lengthCm, 1), 1, 300)),
    weight: normalizeWeight(value.weight),
    weightUnit: normalizeWeightUnit(value.weightUnit),
    caughtAt,
    bait: text(value.bait, 'Unbekannt', 80),
    method: text(value.method, 'Unbekannt', 80),
    released: typeof value.released === 'boolean' ? value.released : true,
    notes: multilineText(value.notes),
    photoName: text(value.photoName, '', 120) || undefined,
    photoDataUrl,
  };
}

export function normalizeLogbookTrip(value: unknown, index = 0): LogbookTrip | null {
  if (!isRecord(value)) return null;

  const id = text(value.id, `trip-migrated-${index}`, 120);
  const startedAt = normalizeIsoDate(value.startedAt);
  const rawCatches = Array.isArray(value.catches) ? value.catches : [];
  const catchesById = new Map<string, CatchEntry>();

  rawCatches.forEach((entry, catchIndex) => {
    const normalized = normalizeCatchEntry(entry, `catch-migrated-${id}-${catchIndex}`, startedAt);
    if (normalized) catchesById.set(normalized.id, normalized);
  });

  return {
    id,
    startedAt,
    spotName: text(value.spotName, 'Unbenannter Spot', 120),
    lat: Number(clamp(finiteNumber(value.lat, 0), -90, 90).toFixed(5)),
    lng: Number(clamp(finiteNumber(value.lng, 0), -180, 180).toFixed(5)),
    accuracy: value.accuracy === undefined ? undefined : Math.round(clamp(finiteNumber(value.accuracy, 0), 0, 50000)),
    weather: normalizeWeather(value.weather),
    water: normalizeWater(value.water),
    catches: [...catchesById.values()].sort(
      (a, b) => new Date(b.caughtAt).getTime() - new Date(a.caughtAt).getTime(),
    ),
  };
}

export function normalizeLogbookTrips(values: unknown[]): LogbookTrip[] {
  return values
    .map((value, index) => normalizeLogbookTrip(value, index))
    .filter((trip): trip is LogbookTrip => trip !== null)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}
