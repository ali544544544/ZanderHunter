import React from 'react';

const ZanderInfo: React.FC = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed

  // Schonzeit Hamburg: 01.02. bis 31.05.
  const isSchonzeit = (month === 1) || (month === 2) || (month === 3) || (month === 4);
  
  return (
    <div className="space-y-4 pt-4">
      <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm px-1">Zander-Info Hamburg</h3>
      
      {/* Schonzeit Status */}
      <div className={`card border-l-4 ${isSchonzeit ? 'border-l-red-500 bg-red-500/5' : 'border-l-green-500 bg-green-500/5'}`}>
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status Schonzeit</span>
            <h4 className={`text-lg font-black ${isSchonzeit ? 'text-red-400' : 'text-green-400'}`}>
              {isSchonzeit ? '⚠️ AKTUELL SCHONZEIT' : '✅ FISCHEREI FREI'}
            </h4>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase block">Zeitraum</span>
            <span className="text-xs font-bold text-slate-300">01.02. – 31.05.</span>
          </div>
        </div>
        
        {isSchonzeit && (
          <div className="mt-3 p-2 bg-red-900/20 rounded-lg border border-red-500/20 text-[11px] text-red-200/80 leading-relaxed">
            <strong>Hinweis:</strong> In Hamburg ist während der Schonzeit das Angeln mit Kunstködern und totem Köderfisch untersagt (Ausnahme: Elbe-Hauptstrom).
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Entnahmefenster */}
        <div className="card p-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Entnahmefenster</span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-slate-100">45-75</span>
            <span className="text-xs text-slate-500 font-bold uppercase">cm</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1">Küchenfenster Hamburg. Größere/kleinere Fische müssen zurückgesetzt werden.</p>
        </div>

        {/* Tageslimit */}
        <div className="card p-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fanglimit</span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-slate-100">2</span>
            <span className="text-xs text-slate-500 font-bold uppercase">Stück</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1">Maximale Entnahme pro Tag und Angler in Hamburger Gewässern.</p>
        </div>
      </div>

      <div className="card bg-slate-800/30 border-slate-700/30">
        <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">Habitat-Tipp</h5>
        <p className="text-xs text-slate-500 leading-relaxed">
          Zander lieben harte Böden, Steinpackungen und Strömungskanten. Tagsüber suchen sie oft tiefe, dunkle Bereiche auf, während sie in der Dämmerung aktiv in flacheres Wasser ziehen, um Beute zu machen.
        </p>
      </div>
    </div>
  );
};

export default ZanderInfo;
