import React, { useMemo, useState } from 'react';
import { useAngelIndex } from './hooks/useAngelIndex';
import { getKoderEmpfehlung, generateBriefing } from './data/koderLogik';
import { SPOTS, calculateSpotScoreForFish } from './data/spots';

import AngelIndex from './components/AngelIndex';
import TideTimeline from './components/TideTimeline';
import ConditionGrid from './components/ConditionGrid';
import SpotList from './components/SpotList';
import Briefing from './components/Briefing';
import HechtInfo from './components/HechtInfo';
import ForecastView from './components/ForecastView';
import DailyForecastChart from './components/DailyForecastChart';
import HechtTaktikView from './components/HechtTaktikView';
import LocationPickerMap from './components/LocationPickerMap';
import { WaterProfileCard } from './components/WaterProfileCard';
import { WaterAreaMap } from './components/WaterAreaMap';
import { useGeolocation } from './hooks/useGeolocation';
import { useLocationSearch } from './hooks/useLocationSearch';
import { useUserSpots } from './hooks/useUserSpots';
import type { TargetFish } from './utils/calculations';
import type { SearchLocation } from './hooks/useLocationSearch';

type ActiveTab = 'jetzt' | 'spots' | 'koder' | 'forecast';

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path}`;

const fishOptions: { value: TargetFish; label: string; iconSrc: string }[] = [
  { value: 'zander', label: 'Zander', iconSrc: assetPath('icons/zander.svg') },
  { value: 'hecht', label: 'Hecht', iconSrc: assetPath('icons/hecht.svg') },
  { value: 'barsch', label: 'Barsch', iconSrc: assetPath('icons/barsch.svg') },
];

const navItems: { id: ActiveTab; label: string; icon: string }[] = [
  { id: 'jetzt', label: 'Jetzt', icon: '🏠' },
  { id: 'spots', label: 'Spots', icon: '📍' },
  { id: 'koder', label: 'Taktik', icon: '🐟' },
  { id: 'forecast', label: 'Kalender', icon: '📅' },
];

const defaultLocation = { lat: 53.55, lng: 9.99 };
const normalizeCoordinate = (value: number) => Number(value.toFixed(4));

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('jetzt');
  const [targetFish, setTargetFish] = useState<TargetFish>('zander');
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [manualLocation, setManualLocation] = useState<SearchLocation | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationMapOpen, setLocationMapOpen] = useState(false);
  const [locationRevision, setLocationRevision] = useState(0);
  const { position: gpsPosition, loading: gpsLoading, error: gpsError } = useGeolocation(gpsEnabled);
  const {
    results: locationResults,
    loading: locationLoading,
    error: locationError,
    search: searchLocation,
    clear: clearLocationSearch,
  } = useLocationSearch();

  const activeLocation = manualLocation
    ? { lat: normalizeCoordinate(manualLocation.lat), lng: normalizeCoordinate(manualLocation.lng) }
    : gpsEnabled && gpsPosition
      ? { lat: normalizeCoordinate(gpsPosition.lat), lng: normalizeCoordinate(gpsPosition.lng) }
      : defaultLocation;

  const { userSpots } = useUserSpots();
  const {
    score,
    loading,
    conditions,
    weather,
    pegel,
    tide,
    moon,
    hourlyScores,
    startHour,
    scoreDetails,
    waterProfile,
    waterProfileLoading,
    waterProfileError,
    refreshWaterProfile,
  } = useAngelIndex(targetFish, activeLocation.lat, activeLocation.lng, locationRevision);

  const headerDate = useMemo(
    () => new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }),
    []
  );
  const fishLabel = useMemo(
    () => fishOptions.find((fish) => fish.value === targetFish)?.label ?? 'Zander',
    [targetFish]
  );
  const allSpots = useMemo(() => [...SPOTS, ...userSpots], [userSpots]);
  const koder = useMemo(
    () => conditions ? getKoderEmpfehlung(conditions, targetFish) : [],
    [conditions, targetFish]
  );
  const topSpot = useMemo(
    () => conditions
      ? allSpots.reduce<((typeof allSpots)[number] & { currentScore: number }) | null>((best, spot) => {
          const currentScore = calculateSpotScoreForFish(spot, conditions, targetFish);
          if (!best || currentScore > best.currentScore) {
            return { ...spot, currentScore };
          }
          return best;
        }, null)
      : null,
    [allSpots, conditions, targetFish]
  );
  const briefingText = useMemo(
    () => conditions ? generateBriefing(conditions, topSpot, koder, targetFish, scoreDetails) : 'Lade Daten...',
    [conditions, topSpot, koder, targetFish, scoreDetails]
  );
  const primaryKoder = koder[0];
  const quickTactic = scoreDetails?.topTactic || primaryKoder?.technik;
  const quickHotspot = scoreDetails?.hotspot || topSpot?.name;
  const locationLabel = manualLocation
    ? manualLocation.label.split(',').slice(0, 2).join(', ')
    : gpsEnabled
      ? gpsPosition
        ? `GPS +/-${Math.round(gpsPosition.accuracy)} m`
        : gpsLoading
          ? 'GPS sucht...'
          : 'GPS aktiv'
      : 'Hamburg';

  const handleLocationSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    searchLocation(locationQuery);
  };

  const selectManualLocation = (location: SearchLocation, closeMap = true) => {
    setManualLocation(location);
    setGpsEnabled(false);
    setLocationRevision((revision) => revision + 1);
    setLocationQuery(location.label.split(',')[0]);
    setLocationSearchOpen(false);
    setLocationMapOpen(!closeMap);
    clearLocationSearch();
  };

  const clearManualLocation = () => {
    setManualLocation(null);
    setLocationRevision((revision) => revision + 1);
    setLocationQuery('');
    setLocationSearchOpen(false);
    setLocationMapOpen(false);
    clearLocationSearch();
  };

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 pt-5">
      <header className="mb-6 space-y-4">
        <div className="flex items-start justify-between gap-4 px-1">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Hamburg - {headerDate}
            </p>
            <h1 className="text-3xl font-black text-white tracking-tight">ZanderHunter</h1>
          </div>
        </div>

        <section className="card p-3">
          <div className="mb-3 space-y-2 rounded-lg border border-slate-800 bg-slate-950/35 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Standort</span>
              <span className="text-right text-[10px] font-bold text-slate-300">
                {locationLabel}
                {gpsError && <span className="ml-1 text-red-400">Fehler</span>}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setGpsEnabled((enabled) => !enabled);
                  setManualLocation(null);
                  setLocationRevision((revision) => revision + 1);
                  setLocationSearchOpen(false);
                  setLocationMapOpen(false);
                  clearLocationSearch();
                }}
                className={`rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-wide transition-colors ${
                  gpsEnabled
                    ? 'border-blue-500/40 bg-blue-500/15 text-blue-300'
                    : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
                aria-pressed={gpsEnabled}
              >
                {gpsEnabled ? 'GPS aus' : 'GPS an'}
              </button>
              <button
                type="button"
                onClick={() => setLocationSearchOpen((open) => !open)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-200 transition-colors hover:bg-slate-700"
                aria-expanded={locationSearchOpen}
              >
                {locationSearchOpen ? 'Suche zu' : 'Ort suchen'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocationMapOpen((open) => !open);
                  setLocationSearchOpen(false);
                  clearLocationSearch();
                }}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-200 transition-colors hover:bg-slate-700"
                aria-expanded={locationMapOpen}
              >
                {locationMapOpen ? 'Karte zu' : 'Karte'}
              </button>
            </div>
            {manualLocation && (
              <button
                type="button"
                onClick={clearManualLocation}
                className="w-full rounded-lg border border-blue-500/40 bg-blue-500/15 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-blue-300 transition-colors"
              >
                Ort aus
              </button>
            )}
            {locationSearchOpen && (
              <div className="space-y-1">
                <form onSubmit={handleLocationSearch} className="flex gap-2">
                  <input
                    value={locationQuery}
                    onChange={(event) => setLocationQuery(event.target.value)}
                    placeholder="Ort oder Gewaesser suchen"
                    className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-2 text-xs font-semibold text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500/60"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-200 transition-colors hover:bg-slate-700"
                  >
                    {locationLoading ? '...' : 'Suchen'}
                  </button>
                </form>
                {(locationError || locationResults.length > 0) && (
                  <div className="space-y-1">
                    {locationError && <p className="text-[10px] font-bold text-red-400">{locationError}</p>}
                    {locationResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => selectManualLocation(result)}
                        className="block w-full rounded-md border border-slate-800 bg-slate-900/70 px-2 py-1.5 text-left text-[10px] font-semibold leading-snug text-slate-300 transition-colors hover:border-blue-500/50 hover:text-slate-100"
                      >
                        {result.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {locationMapOpen && (
              <LocationPickerMap
                center={activeLocation}
                onSelect={(location) => {
                  selectManualLocation(
                    {
                      id: `map-${location.lat}-${location.lng}`,
                      label: location.label,
                      lat: location.lat,
                      lng: location.lng,
                    },
                    false
                  );
                }}
              />
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Zielfisch</p>
              <p className="text-sm font-bold text-slate-100">{fishLabel}-Modus</p>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-950/60 p-1 border border-slate-800">
              {fishOptions.map((fish) => (
                <button
                  key={fish.value}
                  type="button"
                  onClick={() => setTargetFish(fish.value)}
                  className={`flex min-h-[58px] min-w-16 flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 transition-colors ${
                    targetFish === fish.value
                      ? 'bg-blue-500 text-white shadow-sm shadow-blue-950/60'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                  aria-pressed={targetFish === fish.value}
                  aria-label={`${fish.label} auswaehlen`}
                  title={fish.label}
                >
                  <img
                    src={fish.iconSrc}
                    alt=""
                    className="h-8 w-16 object-contain invert"
                    loading="eager"
                  />
                  <span className="text-[9px] font-black uppercase tracking-wide leading-none">{fish.label}</span>
                </button>
              ))}
            </div>
          </div>

        </section>
      </header>

      <main className="space-y-5">
        {activeTab === 'jetzt' && (
          <>
            <AngelIndex score={score} loading={loading} fishLabel={fishLabel} scoreDetails={scoreDetails} />
            <WaterProfileCard
              profile={waterProfile}
              loading={waterProfileLoading}
              error={waterProfileError}
              onRefresh={refreshWaterProfile}
            />
            <WaterAreaMap profile={waterProfile} />
            {!loading && briefingText && (
              <Briefing
                text={briefingText}
                fishLabel={fishLabel}
                koder={primaryKoder}
                tactic={quickTactic}
                hotspot={quickHotspot}
              />
            )}
            {!loading && hourlyScores && hourlyScores.length > 0 && startHour !== undefined && (
              <DailyForecastChart
                hourlyScores={hourlyScores}
                startHour={startHour}
                liveScore={score}
                sunrises={weather?.sunrises}
                sunsets={weather?.sunsets}
              />
            )}
            {!loading && <TideTimeline events={tide || []} />}
            {!loading && (
              <ConditionGrid
                conditions={conditions}
                pegel={pegel}
                weather={weather}
                moon={moon}
                targetFish={targetFish}
                scoreDetails={scoreDetails}
              />
            )}
            <HechtInfo scoreDetails={scoreDetails} fishLabel={fishLabel} targetFish={targetFish} />
          </>
        )}

        {activeTab === 'spots' && (
          <SpotList conditions={conditions} targetFish={targetFish} />
        )}

        {activeTab === 'koder' && (
          <HechtTaktikView
            conditions={conditions}
            weather={weather}
            koder={koder}
            scoreDetails={scoreDetails}
            fishLabel={fishLabel}
            targetFish={targetFish}
          />
        )}

        {activeTab === 'forecast' && (
          <ForecastView spots={allSpots} initialSpot={topSpot} targetFish={targetFish} />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 px-3 pt-2 pb-7 z-40">
        <div className="max-w-lg mx-auto grid grid-cols-4 gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`btn-tab ${activeTab === item.id ? 'active' : 'text-slate-500'}`}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              <span className="mb-1 text-2xl leading-none">
                {item.icon}
              </span>
              <span className="text-[10px] uppercase font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default App;
