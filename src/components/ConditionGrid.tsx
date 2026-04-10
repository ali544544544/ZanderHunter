import React, { useState } from 'react';

interface ConditionGridProps {
  conditions: any;
  pegel: any;
  weather: any;
  moon: any;
}

const ConditionGrid: React.FC<ConditionGridProps> = ({ conditions, pegel, weather, moon }) => {
  const [activeInfo, setActiveInfo] = useState<string | null>(null);

  const items = [
    { 
      label: 'Wassertemp', 
      value: `${pegel?.waterTemp || '--'}°C`, 
      sub: 'Seemannshöft', 
      icon: '🌡️',
      info: 'Optimal 10-18°C. Bei unter 6°C wird der Zander extrem träge, über 22°C sinkt der Sauerstoffgehalt und die Beißlust.'
    },
    { 
      label: 'Luftdruck', 
      value: `${weather?.pressure || '--'} hPa`, 
      sub: conditions?.luftdruckTrend || 'stabil', 
      icon: '⏲️',
      info: 'Fallender Druck vor Wetterumschwung ist oft der Startschuss für eine Beißphase. Stark steigender Druck ist oft schwierig.'
    },
    { 
      label: 'Wind', 
      value: `${weather?.windSpeed || '--'} km/h`, 
      sub: `${weather?.windDirection || 0}°`, 
      icon: '💨',
      info: 'Wind bringt Sauerstoff, erschwert aber ab ca. 25 km/h die Köderkontrolle beim Jiggen (Gummifisch-Angeln).'
    },
    { 
      label: 'Mondphase', 
      value: moon?.name || '--', 
      sub: `${moon?.illumination || 0}% Licht`, 
      icon: moon?.icon || '🌑',
      info: 'Neumond ist der Favorit. Vollmondphasen sind nachts oft besser, machen die Fische am Tag aber manchmal vorsichtiger.'
    },
    { 
      label: 'Tide-Phase', 
      value: conditions?.stromPhase || '--', 
      sub: pegel?.levelTrend || '---', 
      icon: '🌊',
      info: 'Ablaufendes Wasser erzeugt die perfekte Strömungskante. Kenterwasser (Stillstand) ist meistens eine Beißpause.'
    },
    { 
      label: 'Trübung', 
      value: conditions?.trübung || 'mittel', 
      sub: 'Berechnet', 
      icon: '🌫️',
      info: 'Trübes Wasser ist Zander-Wetter! Ihre Augen sind auf Restlicht optimiert. Klares Wasser macht sie scheu.'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {items.map((item, i) => (
        <div key={i} className="card p-3 flex flex-col justify-between relative group min-h-[100px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{item.label}</span>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setActiveInfo(activeInfo === item.label ? null : item.label)}
                className="w-4 h-4 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] hover:text-blue-400 transition-colors border border-slate-700"
              >
                i
              </button>
              <span className="text-lg">{item.icon}</span>
            </div>
          </div>
          
          {activeInfo === item.label ? (
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm p-3 rounded-2xl z-20 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200">
              <p className="text-[10px] text-slate-300 leading-tight italic">
                {item.info}
              </p>
              <button 
                onClick={() => setActiveInfo(null)}
                className="mt-2 text-[8px] font-bold text-blue-400 uppercase tracking-widest self-end"
              >
                Schließen
              </button>
            </div>
          ) : (
            <div>
              <div className="text-lg font-black text-slate-100 truncate">{item.value}</div>
              <div className={`text-[10px] capitalize ${item.sub === 'getrübt' || item.sub === 'fallend' ? 'text-blue-400' : 'text-slate-500'}`}>
                {item.sub}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConditionGrid;
