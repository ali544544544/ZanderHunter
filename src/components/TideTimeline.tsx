import React from 'react';
import { TideEvent } from '../hooks/useTide';

interface TideTimelineProps {
  events: TideEvent[];
}

const TideTimeline: React.FC<TideTimelineProps> = ({ events }) => {
  const now = new Date();
  const upcoming = events.filter(e => e.time.getTime() > now.getTime() - 2 * 3600 * 1000).slice(0, 4);

  return (
    <div className="card">
      <h3 className="text-slate-400 font-medium mb-4 uppercase tracking-wider text-sm">Tide-Timeline</h3>
      
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
