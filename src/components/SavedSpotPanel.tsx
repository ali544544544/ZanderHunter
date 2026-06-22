import React, { useMemo } from 'react';
import type { Spot } from '../data/spots';
import { calculateSpotScoreForFish } from '../data/spots';
import type { PegelData } from '../hooks/usePegel';
import type { TideEvent } from '../hooks/useTide';
import type { WeatherData } from '../hooks/useWeather';
import type { WaterBodyProfile } from '../types/waterData';
import {
  getLocalConditions,
  getTideOffset,
  type PredatorScoreDetails,
  type TargetFish,
} from '../utils/calculations';

interface SavedSpotPanelProps {
  spots: Spot[];
  selectedSpotId: string | null;
  onSelectSpot: (spot: Spot) => void;
  onManageSpots: () => void;
  conditions: any;
  weather: WeatherData | null;
  pegel: PegelData | null;
  tide: TideEvent[];
  waterProfile: WaterBodyProfile | null;
  scoreDetails: PredatorScoreDetails | null;
  hourlyScores: number[];
  startHour?: number;
  targetFish: TargetFish;
  loading?: boolean;
}

const phaseLabels: Record<string, string> = {
  ablauf: 'Ablaufend',
  auflauf: 'Auflaufend',
  kenter: 'Kenterwasser',
  stagnation: 'Stagnation',
};

const tideTypeLabels: Record<TideEvent['type'], string> = {
  HW: 'Hochwasser',
  NW: 'Niedrigwasser',
};

function formatTime(value?: Date | string | null) {
  if (!value) return '--:--';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';

  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatNumber(value: number | undefined | null, digits = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--';
  return new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function getBestWindow(hourlyScores: number[], startHour?: number) {
  if (!hourlyScores.length || typeof startHour !== 'number') return null;

  const now = new Date();
  const candidates = hourlyScores
    .map((score, index) => {
      const date = new Date(now);
      date.setHours(startHour + index, 0, 0, 0);
      return { score, date };
    })
    .filter((entry) => entry.date.getTime() >= now.getTime() - 30 * 60 * 1000);

  const best = candidates.reduce<typeof candidates[number] | null>((currentBest, entry) => {
    if (!currentBest || entry.score > currentBest.score) return entry;
    return currentBest;
  }, null);

  if (!best) return null;

  const dayLabel = best.date.toDateString() === now.toDateString() ? 'Heute' : 'Morgen';
  return `${dayLabel} ${formatTime(best.date)} (${Math.round(best.score)}%)`;
}

function weatherLabel(code?: number) {
  if (typeof code !== 'number') return 'Wetter';
  if (code === 0) return 'Klar';
  if (code <= 3) return 'Bewölkt';
  if (code < 60) return 'Niesel/Regen';
  if (code < 80) return 'Regen';
  if (code < 90) return 'Schauer';
  return 'Gewitter';
}

function MetricTile({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: 'default' | 'good' | 'warn';
}) {
  const toneClass = tone === 'good'
    ? 'border-emerald-400/25 bg-emerald-400/10'
    : tone === 'warn'
      ? 'border-yellow-400/25 bg-yellow-400/10'
      : 'border-slate-700/80 bg-slate-950/25';

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
      <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <span className="mt-0.5 block text-sm font-black leading-snug text-slate-100">{value}</span>
      {sub && <span className="mt-1 block text-[10px] font-bold leading-snug text-slate-400">{sub}</span>}
    </div>
  );
}

const SavedSpotPanel: React.FC<SavedSpotPanelProps> = ({
  spots,
  selectedSpotId,
  onSelectSpot,
  onManageSpots,
  conditions,
  weather,
  pegel,
  tide,
  waterProfile,
  scoreDetails,
  hourlyScores,
  startHour,
  targetFish,
  loading = false,
}) => {
  const selectedSpot = useMemo(
    () => spots.find((spot) => spot.id === selectedSpotId) ?? null,
    [selectedSpotId, spots]
  );

  const detail = useMemo(() => {
    if (!selectedSpot) return null;

    const local = conditions ? getLocalConditions(selectedSpot, conditions) : null;
    const tideOffset = getTideOffset(selectedSpot.lng);
    const now = new Date();
    const localTideEvents = tide
      .map((event) => ({
        ...event,
        time: new Date(event.time.getTime() + tideOffset * 60000),
      }))
      .sort((a, b) => a.time.getTime() - b.time.getTime());
    const nextTide = localTideEvents.find((event) => event.time > now) ?? null;
    const spotScore = conditions ? calculateSpotScoreForFish(selectedSpot, conditions, targetFish) : null;
    const bestWindow = scoreDetails?.primeWindow ?? getBestWindow(hourlyScores, startHour) ?? 'Nächstes Tide- oder Dämmerungsfenster';

    return {
      local,
      tideOffset,
      nextTide,
      spotScore,
      bestWindow,
      mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.lat},${selectedSpot.lng}`,
    };
  }, [conditions, hourlyScores, scoreDetails?.primeWindow, selectedSpot, startHour, targetFish, tide]);

  if (spots.length === 0) {
    return (
      <section className="card space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Meine Spots</p>
            <h2 className="mt-1 text-lg font-black text-slate-100">0/5 gespeichert</h2>
          </div>
          <button
            type="button"
            onClick={onManageSpots}
            className="rounded-lg border border-blue-500/40 bg-blue-500/15 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-blue-200"
          >
            Anlegen
          </button>
        </div>
        <p className="text-xs font-semibold leading-relaxed text-slate-400">
          Speichere bis zu fünf Angelplätze im Spots-Tab. Danach kannst du sie hier direkt für Live-Daten auswählen.
        </p>
      </section>
    );
  }

  return (
    <section className="card space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Meine Spots</p>
          <h2 className="mt-1 text-lg font-black text-slate-100">{spots.length}/5 gespeichert</h2>
        </div>
        <button
          type="button"
          onClick={onManageSpots}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-200"
        >
          Verwalten
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {spots.map((spot) => {
          const active = spot.id === selectedSpotId;
          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => onSelectSpot(spot)}
              className={`min-h-[54px] rounded-lg border px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-blue-400/50 bg-blue-500/15 text-blue-100'
                  : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500'
              }`}
              aria-pressed={active}
            >
              <span className="block truncate text-sm font-black">{spot.name}</span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {spot.tiefe} - {spot.uferAngling ? 'Ufer' : 'Boot'} - {spot.type ?? 'Spot'}
              </span>
            </button>
          );
        })}
      </div>

      {!selectedSpot && (
        <p className="rounded-lg border border-slate-800 bg-slate-950/25 p-3 text-xs font-semibold text-slate-400">
          Wähle einen gespeicherten Spot aus, um die Jetzt-Daten genau für diesen Ort zu laden.
        </p>
      )}

      {selectedSpot && detail && (
        <div className="space-y-4 border-t border-slate-800 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-black leading-tight text-slate-100">{selectedSpot.name}</h3>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-400">{selectedSpot.beschreibung}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className={`text-2xl font-black ${detail.spotScore && detail.spotScore >= 70 ? 'text-angel-green' : 'text-angel-yellow'}`}>
                {detail.spotScore ?? '--'}%
              </p>
              <p className="text-[9px] font-black uppercase text-slate-500">Spot</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MetricTile
              label="Tide jetzt"
              value={phaseLabels[detail.local?.stromPhase ?? 'stagnation']}
              sub={detail.nextTide
                ? `${tideTypeLabels[detail.nextTide.type]} ${formatTime(detail.nextTide.time)} - ${formatNumber(detail.nextTide.height)} cm`
                : `Offset ${detail.tideOffset >= 0 ? '+' : ''}${detail.tideOffset} min`}
              tone={detail.local?.stromPhase === 'ablauf' || detail.local?.stromPhase === 'kenter' ? 'good' : 'default'}
            />
            <MetricTile
              label="Beste Zeit"
              value={detail.bestWindow}
              sub={loading ? 'Aktualisiert...' : scoreDetails?.probability}
              tone="good"
            />
            <MetricTile
              label="Wetter dort"
              value={`${formatNumber(weather?.temperature, 1)}°C - ${weatherLabel(weather?.weatherCode)}`}
              sub={`${formatNumber(weather?.windSpeed)} km/h Wind, ${formatNumber(weather?.cloudCover)}% Wolken`}
            />
            <MetricTile
              label="Wasser Hamburg"
              value={`${formatNumber(pegel?.waterTemp, 1)}°C`}
              sub={`${formatNumber(pegel?.waterLevel)} cm Pegel, ${pegel?.levelTrend ?? 'stabil'}`}
            />
            <MetricTile
              label="Gewässerdaten"
              value={waterProfile?.name ?? 'Keine Daten'}
              sub={waterProfile ? `${waterProfile.region} - ${waterProfile.species.length} Fischarten` : 'Hamburg-Daten werden geprüft'}
            />
            <MetricTile
              label="Navigation"
              value={
                <a
                  href={detail.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-md bg-blue-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white"
                >
                  Google Maps
                </a>
              }
              sub={`${selectedSpot.lat.toFixed(4)}, ${selectedSpot.lng.toFixed(4)}`}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default SavedSpotPanel;
