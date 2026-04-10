import React from 'react';
import { TideEvent } from '../hooks/useTide';

interface TideTimelineProps {
  events: TideEvent[];
}

const TideTimeline: React.FC<TideTimelineProps> = ({ events }) => {
  const [showInfo, setShowInfo] = React.useState(false);
  const now = new Date();
  const upcoming = events.filter(e => e.time.getTime() > now.getTime() - 2 * 3600 * 1000).slice(0, 4);

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm">Tide-Timeline</h3>
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-800 text-slate-500 hover:text-blue-400 transition-colors border border-slate-700 text-[10px] font-bold"
        >
          i
        </button>
      </div>

      {showInfo && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
          <h4 className="text-blue-400 text-[10px] font-black uppercase">Gezeiten-Lexikon</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-slate-400 leading-tight">
            <p><strong className="text-slate-200">HW:</strong> Hochwasser (Peak)</p>
            <p><strong className="text-slate-200">NW:</strong> Niedrigwasser (Tal)</p>
            <p className="col-span-2"><strong className="text-slate-200">Ablaufend:</strong> Strömung zur Nordsee. Oft die beste Beißzeit!</p>
            <p className="col-span-2"><strong className="text-slate-200">Kenterwasser:</strong> Stillstand bei HW/NW (ca. 45 min).</p>
          </div>
        </div>
      )}
      
      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        {upcoming.map((event, i) => {
          const isActive = i === 0 || (i === 1 && upcoming[0].time < now);
          return (
            <div 
              key={i} 
              className={`flex-shrink-0 w-32 p-3 rounded-xl border ${isActive ? 'bg-blue-900/40 border-blue-500 ring-2 ring-blue-500/20' : 'bg-slate-700/30 border-slate-600'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-400">
                  {event.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`text-[10px] px-1 rounded ${event.type === 'HW' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {event.type}
                </span>
              </div>
              <div className="text-lg font-black text-slate-100">
                {event.height.toFixed(0)}<span className="text-[10px] font-normal text-slate-400 ml-1">cm</span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full ${event.type === 'HW' ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${(event.height / 800) * 100}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      
      {upcoming.length === 0 && (
        <p className="text-slate-500 text-xs italic">Warte auf Gezeitendaten...</p>
      )}
    </div>
  );
};

export default TideTimeline;
