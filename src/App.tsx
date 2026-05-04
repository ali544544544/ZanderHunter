import React, { useState, useEffect } from 'react';
import { useAngelIndex } from './hooks/useAngelIndex';
import { getKoderEmpfehlung, generateBriefing } from './data/koderLogik';
import { SPOTS, calculateSpotScoreForFish } from './data/spots';

// Components
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jetzt' | 'spots' | 'koder' | 'forecast'>('jetzt');
  const [targetFish, setTargetFish] = useState<TargetFish>('zander');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { userSpots } = useUserSpots();
  const { score, loading, conditions, weather, pegel, tide, moon, hourlyScores, startHour, scoreDetails } = useAngelIndex(targetFish);

  useEffect(() => {
    if (!loading && (weather || pegel)) {
      setLastUpdated(new Date());
    }
  }, [loading, weather, pegel]);

  const fishLabel = targetFish === 'hecht' ? 'Hecht' : targetFish === 'barsch' ? 'Barsch' : 'Zander';
  const koder = conditions ? getKoderEmpfehlung(conditions, targetFish) : [];
  const topSpot = conditions ? SPOTS.map(s => ({...s, currentScore: calculateSpotScoreForFish(s, conditions, targetFish)})).sort((a, b) => b.currentScore - a.currentScore)[0] : null;
  const briefingText = conditions ? generateBriefing(conditions, topSpot, koder, targetFish, scoreDetails) : 'Lade Daten...';

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 pt-6">
      <header className="flex justify-between items-center mb-8 px-2">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">ZanderHunter</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Hamburg · {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="flex flex-col items-end gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Zielfisch</span>
            <select
              value={targetFish}
              onChange={(event) => setTargetFish(event.target.value as TargetFish)}
              className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              aria-label="Zielfisch auswahlen"
            >
              <option value="zander">Zander</option>
              <option value="hecht">Hecht</option>
              <option value="barsch">Barsch</option>
            </select>
          </label>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-slate-500 font-mono">LIVE UPDATES</span>
          </div>
        </div>
      </header>

      <main className="space-y-6">
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
            {!loading && <ConditionGrid conditions={conditions} pegel={pegel} weather={weather} moon={moon} targetFish={targetFish} scoreDetails={scoreDetails} />}
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
          <ForecastView spots={[...SPOTS, ...userSpots]} initialSpot={topSpot} targetFish={targetFish} />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 p-3 pb-8 z-40">
        <div className="max-w-lg mx-auto flex justify-around">
          <button 
            onClick={() => setActiveTab('jetzt')}
            className={`btn-tab ${activeTab === 'jetzt' ? 'active' : 'text-slate-500'}`}
          >
            <span className="text-2xl mb-1">🏠</span>
            <span className="text-[10px] uppercase font-bold">Jetzt</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('spots')}
            className={`btn-tab ${activeTab === 'spots' ? 'active' : 'text-slate-500'}`}
          >
            <span className="text-2xl mb-1">📍</span>
            <span className="text-[10px] uppercase font-bold">Spots</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('koder')}
            className={`btn-tab ${activeTab === 'koder' ? 'active' : 'text-slate-500'}`}
          >
            <span className="text-2xl mb-1">🐟</span>
            <span className="text-[10px] uppercase font-bold">Taktik</span>
          </button>

          <button 
            onClick={() => setActiveTab('forecast')}
            className={`btn-tab ${activeTab === 'forecast' ? 'active' : 'text-slate-500'}`}
          >
            <span className="text-2xl mb-1">📅</span>
            <span className="text-[10px] uppercase font-bold">Kalender</span>
          </button>
        </div>
      </nav>

      <DataStatus lastUpdated={lastUpdated} />
    </div>
  );
};

export default App;
