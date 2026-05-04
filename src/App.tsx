import React, { useEffect, useMemo, useState } from 'react';
import { useAngelIndex } from './hooks/useAngelIndex';
import { getKoderEmpfehlung, generateBriefing } from './data/koderLogik';
import { SPOTS, calculateSpotScoreForFish } from './data/spots';

import AngelIndex from './components/AngelIndex';
import TideTimeline from './components/TideTimeline';
import ConditionGrid from './components/ConditionGrid';
import SpotList from './components/SpotList';
import Briefing from './components/Briefing';
import HechtInfo from './components/HechtInfo';
import DataStatus from './components/DataStatus';
import ForecastView from './components/ForecastView';
import DailyForecastChart from './components/DailyForecastChart';
import HechtTaktikView from './components/HechtTaktikView';
import { useUserSpots } from './hooks/useUserSpots';
import type { TargetFish } from './utils/calculations';

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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('jetzt');
  const [targetFish, setTargetFish] = useState<TargetFish>('zander');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
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
  } = useAngelIndex(targetFish);

  useEffect(() => {
    if (!loading && (weather || pegel)) {
      setLastUpdated(new Date());
    }
  }, [loading, weather, pegel]);

  const fishLabel = fishOptions.find((fish) => fish.value === targetFish)?.label ?? 'Zander';
  const allSpots = useMemo(() => [...SPOTS, ...userSpots], [userSpots]);
  const koder = useMemo(
    () => conditions ? getKoderEmpfehlung(conditions, targetFish) : [],
    [conditions, targetFish]
  );
  const topSpot = useMemo(
    () => conditions
      ? allSpots
          .map((spot) => ({ ...spot, currentScore: calculateSpotScoreForFish(spot, conditions, targetFish) }))
          .sort((a, b) => b.currentScore - a.currentScore)[0]
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

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 pt-5">
      <header className="mb-6 space-y-4">
        <div className="flex items-start justify-between gap-4 px-1">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Hamburg - {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
            </p>
            <h1 className="text-3xl font-black text-white tracking-tight">ZanderHunter</h1>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Live</span>
          </div>
        </div>

        <section className="card p-3">
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

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Köder</p>
              <p className="truncate text-xs font-bold text-slate-100">{primaryKoder?.name ?? '--'}</p>
              <p className="truncate text-[10px] font-semibold text-slate-500">{primaryKoder?.farbe ?? 'Live-Daten'}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Führung</p>
              <p className="line-clamp-2 text-xs font-bold leading-snug text-slate-100">{quickTactic ?? '--'}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Standplatz</p>
              <p className="line-clamp-2 text-xs font-bold leading-snug text-slate-100">{quickHotspot ?? '--'}</p>
            </div>
          </div>
        </section>
      </header>

      <main className="space-y-5">
        {activeTab === 'jetzt' && (
          <>
            <AngelIndex score={score} loading={loading} fishLabel={fishLabel} scoreDetails={scoreDetails} />
            {!loading && briefingText && <Briefing text={briefingText} fishLabel={fishLabel} />}
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

      <DataStatus lastUpdated={lastUpdated} />
    </div>
  );
};

export default App;
