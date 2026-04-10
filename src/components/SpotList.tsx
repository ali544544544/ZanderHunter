import React, { useState } from 'react';
import SpotCard from './SpotCard';
import { SPOTS, calculateSpotScore } from '../data/spots';
import { useUserSpots } from '../hooks/useUserSpots';
import AddSpotModal from './AddSpotModal';

interface SpotListProps {
  conditions: any;
}

const SpotList: React.FC<SpotListProps> = ({ conditions }) => {
  const { userSpots, addUserSpot, deleteUserSpot } = useUserSpots();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'boot' | 'ufer'>('all');

  const allSpots = [...SPOTS, ...userSpots].map(spot => ({
    ...spot,
    currentScore: conditions ? calculateSpotScore(spot, conditions) : 0,
    isUserSpot: spot.id.startsWith('user-')
  }));

  const filteredSpots = allSpots.filter(spot => {
    if (filter === 'boot') return spot.bootNötig;
    if (filter === 'ufer') return spot.uferAngling;
    return true;
  }).sort((a, b) => b.currentScore - a.currentScore);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm">Spots in deiner Nähe</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
        >
          <span>Neu</span>
          <span className="text-sm">+</span>
        </button>
      </div>

      <div className="flex space-x-2 px-1">
        {(['all', 'boot', 'ufer'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-full border transition-all ${
              filter === f 
                ? 'bg-slate-700 border-slate-600 text-white' 
                : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            {f === 'all' ? 'Alle' : f === 'boot' ? 'Boot' : 'Ufer'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredSpots.length > 0 ? (
          filteredSpots.map(spot => (
            <div key={spot.id} className="relative group">
              <SpotCard spot={spot} score={spot.currentScore} conditions={conditions} />
              {spot.isUserSpot && (
                <button 
                  onClick={() => deleteUserSpot(spot.id)}
                  className="absolute top-4 right-14 bg-red-500/10 hover:bg-red-500/20 text-red-500 p-1.5 rounded-lg border border-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Spot löschen"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
            <p className="text-slate-500 text-sm">Keine Spots gefunden.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <AddSpotModal 
          onClose={() => setIsModalOpen(false)} 
          onAdd={(spot) => addUserSpot(spot)} 
        />
      )}
    </div>
  );
};

export default SpotList;
