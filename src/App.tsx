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
      <svg viewBox="0 0 88 42" aria-hidden="true" className="h-7 w-14">
        <path d="M6 23c12-13 33-17 57-7l15-9-4 15 8 11-17-5C43 41 18 36 6 23Z" fill="currentColor" />
        <path d="M22 13 29 4l5 10M36 12l8-8 4 10M50 13l9-6 2 10" fill="currentColor" opacity="0.72" />
        <path d="M17 23c14 5 31 5 48 0" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
        <path d="M28 19c8-3 19-3 31 1" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />
        <path d="M62 16 70 22 62 27" fill="#0f172a" opacity="0.22" />
        <circle cx="66" cy="17" r="2.5" fill="#0f172a" />
      </svg>
    ),
  },
  {
    value: 'hecht',
    label: 'Hecht',
    icon: (
      <svg viewBox="0 0 96 42" aria-hidden="true" className="h-7 w-16">
        <path d="M5 21c16-10 43-13 72-4l12-10-3 14 6 12-15-6C47 38 19 35 5 21Z" fill="currentColor" />
        <path d="M63 14 78 20 63 27" fill="#0f172a" opacity="0.28" />
        <path d="M12 21c15-4 32-4 50 0" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
        <path d="M22 15h20M19 27h24" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" opacity="0.24" />
        <circle cx="75" cy="17" r="2.5" fill="#0f172a" />
        <path d="M78 24h8" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      </svg>
    ),
  },
  {
    value: 'barsch',
    label: 'Barsch',
    icon: (
      <svg viewBox="0 0 82 46" aria-hidden="true" className="h-7 w-14">
        <path d="M6 25c9-14 28-20 55-9l13-8-3 13 7 10-15-3C40 43 15 38 6 25Z" fill="currentColor" />
        <path d="M22 14 17 2l15 8M36 12l6-11 7 12M51 14l8-8 3 11" fill="currentColor" opacity="0.78" />
        <path d="M23 17v18M33 14v23M43 13v24M53 15v19" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" opacity="0.32" />
        <path d="M13 27c11 5 25 6 44 0" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" opacity="0.28" />
        <circle cx="61" cy="18" r="2.5" fill="#0f172a" />
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
                  className={`flex min-h-[58px] min-w-16 flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 transition-colors ${
                    targetFish === fish.value
                      ? 'bg-blue-500 text-white shadow-sm shadow-blue-950/60'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                  aria-pressed={targetFish === fish.value}
                  aria-label={`${fish.label} auswaehlen`}
                  title={fish.label}
                >
                  {fish.icon}
                  <span className="text-[9px] font-black uppercase tracking-wide leading-none">{fish.label}</span>
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
