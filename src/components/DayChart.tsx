import React from 'react';

interface DayChartProps {
  scores?: number[];
}

const DayChart: React.FC<DayChartProps> = ({ scores = [] }) => {
  const currentHour = new Date().getHours();
  
  // Use provided scores or fallback to mock logic if needed (safety first)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="card">
      <h3 className="text-slate-400 font-medium mb-6 uppercase tracking-wider text-xs flex justify-between items-center">
        <span>Tagesprognose (24h)</span>
        <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">Aktiv</span>
      </h3>
      
      <div className="relative h-24 w-full flex items-end space-x-1 px-1">
        {hours.map(hour => {
          // Use provided score for this hour
          const hourScore = scores[hour] || 0;
          
          const isNow = hour === currentHour;
          const isFutur = hour > currentHour;

          return (
            <div key={hour} className="group relative flex-1 flex flex-col items-center">
              <div className="absolute -top-10 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-700 whitespace-nowrap">
                {hour}:00 · {Math.round(hourScore)}%
              </div>

              <div 
                className={`w-full rounded-t-lg transition-all duration-500 ${
                  isNow 
                    ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10' 
                    : isFutur 
                      ? 'bg-slate-600 hover:bg-slate-500' 
                      : 'bg-slate-700/40'
                }`}
                style={{ height: `${Math.max(5, hourScore)}%` }}
              ></div>
              
              {hour % 4 === 0 && (
                <span className="absolute -bottom-6 text-[10px] text-slate-500 font-medium">{hour}h</span>
              )}

              {isNow && (
                <div className="absolute -bottom-8 w-1 h-1 bg-blue-500 rounded-full"></div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-10 flex flex-wrap gap-4 text-[10px] text-slate-500 border-t border-slate-700/50 pt-4">
        <div className="flex items-center">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm mr-2 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div> 
          <span>Jetzt</span>
        </div>
        <div className="flex items-center">
          <div className="w-2.5 h-2.5 bg-slate-600 rounded-sm mr-2"></div> 
          <span>Prognose</span>
        </div>
        <div className="flex items-center">
          <div className="w-2.5 h-2.5 bg-slate-700/40 rounded-sm mr-2"></div> 
          <span>Vergangen</span>
        </div>
      </div>
    </div>
  );
};

export default DayChart;
