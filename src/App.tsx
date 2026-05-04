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

const fishOptions: { value: TargetFish; label: string; icon: React.ReactNode }[] = [
  {
    value: 'zander',
    label: 'Zander',
    icon: (
      <svg viewBox="0 0 64 32" aria-hidden="true" className="h-6 w-10">
        <path d="M5 17c9-10 25-12 41-5l10-6-2 10 5 8-11-3C33 30 16 28 5 17Z" fill="currentColor" opacity="0.9" />
        <path d="M18 14c6-3 15-4 25 0" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
        <circle cx="44" cy="14" r="2" fill="#0f172a" />
        <path d="M13 20c7 2 17 2 28-1" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      </svg>
    ),
  },
  {
    value: 'hecht',
    label: 'Hecht',
    icon: (
      <svg viewBox="0 0 72 32" aria-hidden="true" className="h-6 w-11">
        <path d="M4 16c11-9 31-12 52-5l10-7-3 11 5 9-12-4C35 29 15 27 4 16Z" fill="currentColor" opacity="0.9" />
        <path d="M43 10 56 15 43 20" fill="#0f172a" opacity="0.28" />
        <path d="M12 16h24" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
        <circle cx="52" cy="13" r="2" fill="#0f172a" />
      </svg>
    ),
  },
  {
    value: 'barsch',
    label: 'Barsch',
    icon: (
      <svg viewBox="0 0 60 34" aria-hidden="true" className="h-6 w-10">
        <path d="M5 18c8-9 24-13 41-5l9-6-2 10 5 7-11-2C31 32 14 29 5 18Z" fill="currentColor" opacity="0.9" />
        <path d="M21 8 16 1l12 5M31 8l4-7 4 9" fill="currentColor" opacity="0.75" />
        <path d="M20 13v11M28 11v14M36 11v13" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" opacity="0.32" />
        <circle cx="43" cy="14" r="2" fill="#0f172a" />
      </svg>
    ),
  },
];

const navItems: { id: ActiveTab; label: string; icon: string }[] = [
  { id: 'jetzt', label: 'Jetzt', icon: '🏠' },
  { id: 'spots', label: 'Spots', icon: '📍' },
  { id: 'koder', label: 'Taktik', icon: '🐟' },
  { id: 'forecast', label: 'Kalender', icon: '📅' },
];

const getScoreTone = (score: number) => {
  if (score >= 75) return 'text-angel-green';
  if (score >= 55) return 'text-angel-light';
  if (score >= 40) return 'text-angel-yellow';
  return 'text-angel-red';
};

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
                  className={`flex h-11 min-w-16 items-center justify-center rounded-md px-2 transition-colors ${
                    targetFish === fish.value
                      ? 'bg-blue-500 text-white shadow-sm shadow-blue-950/60'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                  aria-pressed={targetFish === fish.value}
                  aria-label={`${fish.label} auswaehlen`}
                  title={fish.label}
                >
                  {fish.icon}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Score</p>
              <p className={`text-xl font-black ${loading ? 'text-slate-500' : getScoreTone(score)}`}>
                {loading ? '--' : score}
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Top Spot</p>
              <p className="truncate text-xs font-bold text-slate-100">{topSpot?.name ?? '--'}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Fenster</p>
              <p className="truncate text-xs font-bold text-slate-100">{scoreDetails?.primeWindow ?? '--'}</p>
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
