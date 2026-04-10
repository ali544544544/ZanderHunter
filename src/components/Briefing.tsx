import React from 'react';

interface BriefingProps {
  text: string;
}

const Briefing: React.FC<BriefingProps> = ({ text }) => {
  return (
    <div className="card bg-blue-600/10 border-blue-500/30">
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-xl">🎣</span>
        <h3 className="text-blue-400 font-bold uppercase tracking-wider text-sm">Zander-Briefing</h3>
      </div>
      
      <p className="text-slate-200 text-sm leading-relaxed font-medium">
        {text}
      </p>
      
      <div className="mt-4 flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-700/50 pt-2">
        <span>Basierend auf aktuellen Bedingungen</span>
        <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 uppercase font-bold text-[9px]">Live Update</span>
      </div>
    </div>
  );
};

export default Briefing;
