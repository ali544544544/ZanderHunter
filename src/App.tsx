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

const fishOptions: { value: TargetFish; label: string; short: string }[] = [
  { value: 'zander', label: 'Zander', short: 'Z' },
  { value: 'hecht', label: 'Hecht', short: 'H' },
  { value: 'barsch', label: 'Barsch', short: 'B' },
];

const navItems: { id: ActiveTab; label: string; icon: string }[] = [
  { id: 'jetzt', label: 'Jetzt', icon: 'J' },
  { id: 'spots', label: 'Spots', icon: 'S' },
  { id: 'koder', label: 'Taktik', icon: 'T' },
  { id: 'forecast', label: 'Kalender', icon: 'K' },
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
                  className={`h-9 min-w-14 rounded-md px-2 text-xs font-black transition-colors ${
                    targetFish === fish.value
                      ? 'bg-blue-500 text-white shadow-sm shadow-blue-950/60'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                  aria-pressed={targetFish === fish.value}
                  aria-label={`${fish.label} auswaehlen`}
                >
                  {fish.short}
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
              <span className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg border border-current/20 text-xs font-black">
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
