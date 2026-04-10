import React from 'react';

interface ConditionGridProps {
  conditions: any;
  pegel: any;
  weather: any;
  moon: any;
}

const ConditionGrid: React.FC<ConditionGridProps> = ({ conditions, pegel, weather, moon }) => {
  const items = [
    { label: 'Wassertemp', value: `${pegel?.waterTemp || '--'}°C`, sub: 'Seemannshöft', icon: '🌡️' },
    { label: 'Luftdruck', value: `${weather?.pressure || '--'} hPa`, sub: conditions?.luftdruckTrend || 'stabil', icon: '⏲️' },
    { label: 'Wind', value: `${weather?.windSpeed || '--'} km/h`, sub: `${weather?.windDirection || 0}°`, icon: '💨' },
    { label: 'Mondphase', value: moon?.name || '--', sub: `${moon?.illumination || 0}% Licht`, icon: moon?.icon || '🌑' },
    { label: 'Tide-Phase', value: conditions?.stromPhase || '--', sub: pegel?.levelTrend || '---', icon: '🌊' },
    { label: 'Trübung', value: conditions?.trübung || 'mittel', sub: 'Berechnet', icon: '🌫️' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {items.map((item, i) => (
        <div key={i} className="card p-3 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{item.label}</span>
            <span className="text-lg">{item.icon}</span>
          </div>
          <div>
            <div className="text-lg font-black text-slate-100 truncate">{item.value}</div>
            <div className={`text-[10px] capitalize ${item.sub === 'getrübt' || item.sub === 'fallend' ? 'text-blue-400' : 'text-slate-500'}`}>
              {item.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConditionGrid;
