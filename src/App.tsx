import React, { useState, useEffect } from 'react';
import { useAngelIndex } from './hooks/useAngelIndex';
import { getKoderEmpfehlung, generateBriefing } from './data/koderLogik';
import { SPOTS, calculateSpotScore } from './data/spots';

// Components
import AngelIndex from './components/AngelIndex';
import TideTimeline from './components/TideTimeline';
import ConditionGrid from './components/ConditionGrid';
import DayChart from './components/DayChart';
import SpotList from './components/SpotList';
import KoderCard from './components/KoderCard';
import Briefing from './components/Briefing';
import ZanderInfo from './components/ZanderInfo';
import DataStatus from './components/DataStatus';
import ForecastView from './components/ForecastView';
import { useUserSpots } from './hooks/useUserSpots';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jetzt' | 'spots' | 'koder' | 'forecast'>('jetzt');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { userSpots } = useUserSpots();
  const { score, loading, conditions, weather, pegel, tide, moon, hourlyScores } = useAngelIndex();

  useEffect(() => {
    if (!loading && (weather || pegel)) {
      setLastUpdated(new Date());
    }
  }, [loading, weather, pegel]);

  const koder = conditions ? getKoderEmpfehlung(conditions) : [];
  const topSpot = conditions ? SPOTS.map(s => ({...s, currentScore: calculateSpotScore(s, conditions)})).sort((a, b) => b.currentScore - a.currentScore)[0] : null;
  const briefingText = conditions ? generateBriefing(conditions, topSpot, koder) : 'Lade Daten...';

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 pt-6">
      <header className="flex justify-between items-center mb-8 px-2">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">ZanderHunter</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Hamburg · {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mb-1"></div>
          <span className="text-[10px] text-slate-500 font-mono">LIVE UPDATES</span>
        </div>
      </header>

      <main className="space-y-6">
        {activeTab === 'jetzt' && (
          <>
            <AngelIndex score={score} loading={loading} />
            {!loading && briefingText && <Briefing text={briefingText} />}
            {!loading && <TideTimeline events={tide || []} />}
            {!loading && <ConditionGrid conditions={conditions} pegel={pegel} weather={weather} moon={moon} />}
            <DayChart currentScore={score} scores={hourlyScores} />
            <ZanderInfo />
          </>
        )}

        {activeTab === 'spots' && (
          <SpotList conditions={conditions} />
        )}

        {activeTab === 'koder' && (
          <div className="space-y-8">
            <KoderCard empfehlungen={koder} />
            <div className="card space-y-4">
              <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm">Technik & Taktik</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <p>• <strong>Wurfrichtung:</strong> Gegen die Strömung werfen, Köder mit der Strömung führen.</p>
                <p>• <strong>Führung:</strong> Lift-and-Drop. Kurze Sprünge am Grund, 2-3 Sek. Absinkphase.</p>
                <p>• <strong>Biss:</strong> Oft nur ein feines "Tock". Sofort Quittieren (Anschlag!).</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'forecast' && (
          <ForecastView spots={[...SPOTS, ...userSpots]} initialSpot={topSpot} />
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
