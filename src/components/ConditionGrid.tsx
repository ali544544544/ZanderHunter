import React, { useState } from 'react';
import type { HechtScoreDetails, TargetFish } from '../utils/calculations';

interface ConditionGridProps {
  conditions: any;
  pegel: any;
  weather: any;
  moon: any;
  targetFish?: TargetFish;
  scoreDetails?: HechtScoreDetails | null;
}

const ConditionGrid: React.FC<ConditionGridProps> = ({ conditions, pegel, weather, moon, targetFish = 'zander', scoreDetails }) => {
  const [activeInfo, setActiveInfo] = useState<string | null>(null);

  const isHecht = targetFish === 'hecht';
  const fishInfo = isHecht
    ? {
        temp: 'Hecht nutzt eine bimodale Temperaturkurve: Hauptpeak um 15C, zweiter Aktivitaetspuls um 10C. Unter 4C und ueber 25C wird stark gedaempft.',
        wind: 'Wind plus Wolken kann Hechte ans Ufer druecken. Entscheidend ist, ob der Wind auf die Uferkante steht.',
        tide: 'Fuer Hecht zaehlen Stroemungsdruck und Kenterfenster. Die erste Phase nach dem Wechsel bekommt einen Boost.',
        turbidity: 'Leichte Truebung hilft. Klares, sonniges Stillwasser ist fuer Hecht im Score schwach.'
      }
    : {
        temp: 'Optimal 10-18C. Bei unter 6C wird der Zander extrem traege, ueber 22C sinkt der Sauerstoffgehalt und die Beisslust.',
        wind: 'Wind bringt Sauerstoff, erschwert aber ab ca. 25 km/h die Koederkontrolle beim Jiggen.',
        tide: 'Ablaufendes Wasser erzeugt Stroemungskanten. Kenterwasser ist ein kurzes, sensibles Fenster.',
        turbidity: 'Truebes Wasser ist Zander-Wetter. Klares Wasser macht sie scheuer.'
      };

  const items = [
    {
      label: 'Wassertemp',
      value: `${pegel?.waterTemp || '--'}C`,
      sub: 'Seemannshoeft',
      icon: 'T',
      info: fishInfo.temp
    },
    {
      label: 'Luftdruck',
      value: `${weather?.pressure || '--'} hPa`,
      sub: conditions?.luftdruckTrend || 'stabil',
      icon: 'P',
      info: 'Fallender Druck vor Wetterumschwung ist oft ein Aktivitaets-Trigger. Rasch steigender Druck ist schwierig.'
    },
    {
      label: 'Wind',
      value: `${weather?.windSpeed || '--'} km/h`,
      sub: `${weather?.windDirection || 0} deg`,
      icon: 'W',
      info: fishInfo.wind
    },
    {
      label: 'Wolken',
      value: `${weather?.cloudCover ?? '--'}%`,
      sub: isHecht ? 'Lichtmodul' : 'Wetter',
      icon: 'C',
      info: isHecht ? 'Wolken reduzieren harte Sonneneinstrahlung und verbessern den Licht/Wind-Score.' : 'Bewoelkung hilft bei vorsichtigen Raeubern und stabilisiert das Licht.'
    },
    {
      label: 'Mondphase',
      value: moon?.name || '--',
      sub: `${moon?.illumination || 0}% Licht`,
      icon: moon?.icon || 'M',
      info: 'Solunar- und Mondfenster bleiben Zusatzsignale. Beim Hecht dominieren Temperatur, Druck und Licht/Wind.'
    },
    {
      label: 'Tide-Phase',
      value: conditions?.stromPhase || '--',
      sub: pegel?.levelTrend || '---',
      icon: 'H',
      info: fishInfo.tide
    },
    {
      label: 'Truebung',
      value: conditions?.trübung || 'mittel',
      sub: 'Berechnet',
      icon: 'S',
      info: fishInfo.turbidity
    },
    ...(scoreDetails ? [
      {
        label: 'Temp-Modul',
        value: `${scoreDetails.subScores.temperatur}`,
        sub: '35% Gewicht',
        icon: 'A',
        info: 'Hecht Modul A: Gausskurven bei 15C und 10C plus Extremwert-Daempfung.'
      },
      {
        label: 'Druck-Modul',
        value: `${scoreDetails.subScores.barometer}`,
        sub: '25% Gewicht',
        icon: 'B',
        info: 'Hecht Modul B: Drucktrend ueber 3h/6h, fallender Druck wird belohnt, schnelle Anstiege bekommen Hysterese-Malus.'
      },
      {
        label: 'Hydro-Modul',
        value: `${scoreDetails.subScores.hydrologie}`,
        sub: '25% Gewicht',
        icon: 'C',
        info: 'Hecht Modul C: Tidenwinkel, geschaetzte Stroemung und Kenter-/Ablauffenster.'
      },
      {
        label: 'Licht/Wind',
        value: `${scoreDetails.subScores.lichtWind}`,
        sub: '15% Gewicht',
        icon: 'D',
        info: 'Hecht Modul D: Wolken, Windstaerke, Wind auf Ufer und Daemmerung werden kombiniert.'
      }
    ] : [])
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {items.map((item, i) => (
        <div key={`${item.label}-${i}`} className="card p-3 flex flex-col justify-between relative group min-h-[100px]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{item.label}</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveInfo(activeInfo === item.label ? null : item.label)}
                className="w-4 h-4 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] hover:text-blue-400 transition-colors border border-slate-700"
              >
                i
              </button>
              <span className="text-sm font-black text-slate-400">{item.icon}</span>
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
                Schliessen
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
