import React, { useState, useMemo } from 'react';
import { SPOTS, calculateSpotScore } from '../data/spots';
import SpotCard from './SpotCard';

interface SpotListProps {
  conditions: any;
}

const SpotList: React.FC<SpotListProps> = ({ conditions }) => {
  const [filter, setFilter] = useState<'alle' | 'ufer' | 'boot'>('alle');

  const scoredSpots = useMemo(() => {
    return SPOTS.map(spot => ({
      ...spot,
      currentScore: calculateSpotScore(spot, conditions)
    })).sort((a, b) => b.currentScore - a.currentScore);
  }, [conditions]);

  const filteredSpots = scoredSpots.filter(spot => {
    if (filter === 'ufer') return spot.uferAngling;
    if (filter === 'boot') return spot.bootNötig;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm">Beste Plätze heute</h3>
        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
          {(['alle', 'ufer', 'boot'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${filter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredSpots.length > 0 ? (
          filteredSpots.map(spot => (
            <SpotCard key={spot.id} spot={spot} score={spot.currentScore} />
          ))
        ) : (
          <div className="card text-center py-10 opacity-50">
            <p className="text-sm">Keine Spots für diesen Filter gefunden.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotList;
