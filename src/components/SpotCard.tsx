import React, { useState } from 'react';
import { Spot } from '../data/spots';

interface SpotCardProps {
  spot: Spot;
  score: number;
}

const SpotCard: React.FC<SpotCardProps> = ({ spot, score }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card mb-3 overflow-hidden transition-all duration-300">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="font-bold text-slate-100">{spot.name}</h4>
            {spot.bootNötig && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Boot</span>}
            {spot.uferAngling && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Ufer</span>}
          </div>
          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{spot.beschreibung}</p>
        </div>
        <div className="flex flex-col items-end ml-4">
          <div className={`text-xl font-black ${score >= 70 ? 'text-angel-green' : score >= 50 ? 'text-angel-light' : 'text-angel-yellow'}`}>
            {score}%
          </div>
          <span className="text-[8px] text-slate-500 uppercase">Score</span>
        </div>
      </div>

      <div className="w-full h-1 bg-slate-700 mt-3 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${score >= 70 ? 'bg-angel-green' : score >= 50 ? 'bg-angel-light' : 'bg-angel-yellow'}`}
          style={{ width: `${score}%` }}
        ></div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Beschreibung</span>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">{spot.beschreibung}</p>
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase w-full mb-1">Struktur</span>
            {spot.struktur.map(s => (
              <span key={s} className="bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700">
              <span className="text-slate-500 block mb-0.5 uppercase">Tiefe</span>
              <span className="text-slate-200 font-bold">{spot.tiefe}</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700">
              <span className="text-slate-500 block mb-0.5 uppercase">Beste Phase</span>
              <span className="text-slate-200 font-bold capitalize">{spot.bestePhase}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotCard;
