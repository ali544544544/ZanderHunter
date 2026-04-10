import React from 'react';
import { KoderEmpfehlung } from '../data/koderLogik';

interface KoderCardProps {
  empfehlungen: KoderEmpfehlung[];
}

const KoderCard: React.FC<KoderCardProps> = ({ empfehlungen }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm px-1">Köder-Empfehlungen</h3>
      
      {empfehlungen.map((k, i) => (
        <div key={i} className={`card border-l-4 ${i === 0 ? 'border-l-blue-500' : 'border-l-slate-600'}`}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-slate-100">{k.name}</h4>
                <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold">Prio {k.priorität}</span>
              </div>
              <p className="text-xs text-blue-400 font-medium">{k.wann}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Größe & Farbe</span>
              <p className="text-xs text-slate-200">{k.größe} · {k.farbe}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Gewicht / Blei</span>
              <p className="text-xs text-slate-200">{k.gewicht}</p>
            </div>
          </div>
          
          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/50">
            <div className="flex items-start space-x-2 text-xs leading-relaxed">
              <span className="text-lg">🎯</span>
              <div>
                <span className="font-bold text-slate-300 block mb-0.5">Technik:</span>
                <p className="text-slate-400">{k.technik}</p>
              </div>
            </div>
          </div>
          
          <p className="mt-3 text-[10px] text-slate-500 italic">
            <strong>Warum:</strong> {k.warum}
          </p>
        </div>
      ))}
    </div>
  );
};

export default KoderCard;
