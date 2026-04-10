import React, { useState } from 'react';
import { Spot } from '../data/spots';
import { generateDynamicSpotAdvice } from '../data/koderLogik';

interface SpotCardProps {
  spot: Spot;
  score: number;
  conditions: any;
}

const SpotCard: React.FC<SpotCardProps> = ({ spot, score, conditions }) => {
  const [expanded, setExpanded] = useState(false);
  const advice = generateDynamicSpotAdvice(spot, conditions);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;

  return (
    <div className="card mb-3 overflow-hidden transition-all duration-300">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="font-bold text-slate-100">{spot.name}</h4>
            {spot.bootNötig && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase font-bold">Boot</span>}
            {spot.uferAngling && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded uppercase font-bold">Ufer</span>}
          </div>
          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{spot.beschreibung}</p>
        </div>
        <div className="flex flex-col items-end ml-4">
          <div className={`text-xl font-black ${score >= 70 ? 'text-angel-green' : score >= 50 ? 'text-angel-light' : 'text-angel-yellow'}`}>
            {score}%
          </div>
          <span className="text-[8px] text-slate-500 uppercase font-bold">Score</span>
        </div>
      </div>

      <div className="w-full h-1 bg-slate-700 mt-3 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${score >= 70 ? 'bg-angel-green' : score >= 50 ? 'bg-angel-light' : 'bg-angel-yellow'}`}
          style={{ width: `${score}%` }}
        ></div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Taktik-Guide</span>
                <p className="text-xs text-slate-300 leading-relaxed mt-1 bg-slate-900/40 p-2 rounded-lg border border-slate-700/50 italic">
                  "{advice.taktik}"
                </p>
              </div>
              
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Köder-Tipp</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-lg">🪱</span>
                  <p className="text-xs text-blue-400 font-bold">{advice.koderTipp}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase w-full mb-1">Struktur vor Ort</span>
                {spot.struktur.map(s => (
                  <span key={s} className="bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-md border border-slate-600">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="aspect-video w-full bg-slate-800 rounded-xl overflow-hidden border border-slate-700 relative group">
                <iframe
                  title={`Map for ${spot.name}`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0, opacity: 0.8 }}
                  src={`https://maps.google.com/maps?q=${spot.lat},${spot.lng}&z=15&output=embed`}
                  allowFullScreen
                ></iframe>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none"></div>
              </div>

              <a 
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
              >
                <span className="text-sm font-bold uppercase tracking-tight">Route planen</span>
                <span className="text-lg">🗺️</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] pt-2">
            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700">
              <span className="text-slate-500 block mb-0.5 uppercase tracking-tighter">Wassertiefe</span>
              <span className="text-slate-200 font-bold">{spot.tiefe}</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700">
              <span className="text-slate-500 block mb-0.5 uppercase tracking-tighter">Beste Tide</span>
              <span className="text-slate-200 font-bold capitalize">{advice.bestePhase}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotCard;
