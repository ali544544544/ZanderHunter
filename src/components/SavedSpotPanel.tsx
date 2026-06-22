import React, { useMemo } from 'react';
import type { Spot } from '../data/spots';
import { calculateSpotScoreForFish } from '../data/spots';
import type { PegelData } from '../hooks/usePegel';
import type { TideEvent } from '../hooks/useTide';
import type { WeatherData } from '../hooks/useWeather';
import type { WaterBodyProfile } from '../types/waterData';
import HoopteZanderAnalysisCard from './HoopteZanderAnalysisCard';
import { HOOPTE_ZOLLENSPIEKER_SPOT_ID } from '../data/userSpotSeeds';
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
  onCreateSpot: () => void;
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

const SLOT_COUNT = 5;

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
    <div className={`rounded-lg border px-2.5 py-2 ${toneClass}`}>
      <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <span className="mt-0.5 block text-xs font-black leading-snug text-slate-100">{value}</span>
      {sub && <span className="mt-1 block text-[10px] font-bold leading-snug text-slate-400">{sub}</span>}
    </div>
  );
}

const SavedSpotPanel: React.FC<SavedSpotPanelProps> = ({
  spots,
  selectedSpotId,
  onSelectSpot,
  onCreateSpot,
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

  const slotItems = Array.from({ length: SLOT_COUNT }, (_, index) => spots[index] ?? null);
  const isHoopteSpotSelected = selectedSpot?.id === HOOPTE_ZOLLENSPIEKER_SPOT_ID;

  return (
    <section className="card space-y-3 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Meine Spots</p>
          <h2 className="mt-0.5 text-sm font-black text-slate-100">{spots.length}/{SLOT_COUNT} gespeichert</h2>
        </div>
        <button
          type="button"
          onClick={onManageSpots}
          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-[10px] font-black uppercase tracking-wide text-slate-200"
        >
          Verwalten
        </button>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {slotItems.map((spot, index) => {
          const active = spot?.id === selectedSpotId;

          if (!spot) {
            return (
              <button
                key={`empty-${index}`}
                type="button"
                onClick={onCreateSpot}
                className="flex aspect-square min-h-[58px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/50 text-slate-500 transition-colors hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-200"
                aria-label={`Spot ${index + 1} anlegen`}
                title="Spot anlegen"
              >
                <span className="text-xl font-black leading-none">+</span>
                <span className="mt-1 text-[8px] font-black uppercase tracking-wide">Spot</span>
              </button>
            );
          }

          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => onSelectSpot(spot)}
              className={`flex aspect-square min-h-[58px] flex-col items-center justify-center rounded-lg border px-1.5 py-1.5 text-center transition-colors ${
                active
                  ? 'border-blue-400/60 bg-blue-500/20 text-blue-100 shadow-sm shadow-blue-950/50'
                  : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500'
              }`}
              aria-pressed={active}
              title={spot.name}
            >
              <span className="line-clamp-2 max-w-full text-[10px] font-black leading-tight">{spot.name}</span>
              <span className="mt-1 block text-[8px] font-bold uppercase tracking-wide text-slate-500">
                {spot.uferAngling ? 'Ufer' : 'Boot'}
              </span>
            </button>
          );
        })}
      </div>

      {!selectedSpot && (
        <p className="rounded-lg border border-slate-800 bg-slate-950/25 px-3 py-2 text-[10px] font-bold leading-relaxed text-slate-400">
          Tippe auf + zum Anlegen oder auf einen Slot zum Auswählen.
        </p>
      )}

      {selectedSpot && detail && (
        isHoopteSpotSelected ? (
          <HoopteZanderAnalysisCard enabled />
        ) : (
        <div className="space-y-3 border-t border-slate-800 pt-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black leading-tight text-slate-100">{selectedSpot.name}</h3>
              {selectedSpot.beschreibung && (
                <p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-relaxed text-slate-400">{selectedSpot.beschreibung}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className={`text-xl font-black ${detail.spotScore && detail.spotScore >= 70 ? 'text-angel-green' : 'text-angel-yellow'}`}>
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
        )
      )}
    </section>
  );
};

export default SavedSpotPanel;
