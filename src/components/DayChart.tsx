import React from 'react';

const DayChart: React.FC = () => {
  const currentHour = new Date().getHours();
  
  // Generating visual segments representing a day
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="card">
      <h3 className="text-slate-400 font-medium mb-4 uppercase tracking-wider text-sm">Tagesverlauf (24h)</h3>
      
      <div className="relative h-20 w-full flex items-end space-x-0.5">
        {hours.map(hour => {
          // Mock score logic for visualization
          const hourScore = Math.sin((hour - 6) / 4) * 50 + 50;
          const isNow = hour === currentHour;
          
          return (
            <div key={hour} className="group relative flex-1 flex flex-col items-center">
              <div 
                className={`w-full rounded-t-sm transition-all duration-300 ${isNow ? 'bg-blue-500 scale-y-110' : 'bg-slate-700 hover:bg-slate-600'}`}
                style={{ height: `${hourScore}%`, opacity: hourScore / 100 + 0.2 }}
              ></div>
              {hour % 6 === 0 && (
                <span className="absolute -bottom-6 text-[10px] text-slate-500">{hour}h</span>
              )}
              {isNow && (
                <div className="absolute top-0 w-1 h-1 bg-white rounded-full -translate-y-2"></div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 flex justify-between text-[10px] text-slate-500 border-t border-slate-700 pt-2">
        <div className="flex items-center"><div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div> Jetzt</div>
        <div className="flex items-center"><div className="w-2 h-2 bg-slate-700 rounded-sm mr-1"></div> Zander-Aktivität (Prognose)</div>
      </div>
    </div>
  );
};

export default DayChart;
