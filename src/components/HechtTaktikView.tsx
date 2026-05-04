import React from 'react';
import type { KoderEmpfehlung } from '../data/koderLogik';
import type { HechtScoreDetails } from '../utils/calculations';

interface HechtTaktikViewProps {
  conditions: any;
  weather: any;
  koder: KoderEmpfehlung[];
  scoreDetails?: HechtScoreDetails | null;
}

const HechtTaktikView: React.FC<HechtTaktikViewProps> = ({ conditions, weather, koder, scoreDetails }) => {
  const legalClosed = scoreDetails?.legal.schonzeitAktiv;

  const rules = [
    {
      title: 'Temperatur',
      value: `${conditions?.wasserTemp ?? '--'}C`,
      text: conditions?.wasserTemp < 8
        ? 'Kaltwasser: langsam, lange Pausen, Koeder im Sichtfeld halten.'
        : conditions?.wasserTemp <= 16
          ? 'Aktivfenster: grosse Silhouette, Jerks und Swimbaits funktionieren gut.'
          : 'Warmwasser: frueh/spaet fischen, Sauerstoff und Schatten suchen.'
    },
    {
      title: 'Drucktrend',
      value: conditions?.luftdruckTrend || '--',
      text: conditions?.luftdruckTrend === 'fallend'
        ? 'Sanft fallender Druck triggert Such- und Fressphasen.'
        : 'Bei stabilem oder steigendem Druck langsamer fuehren und Struktur enger abfischen.'
    },
    {
      title: 'Licht & Wind',
      value: `${weather?.cloudCover ?? '--'}% Wolken`,
      text: weather?.cloudCover > 60 && weather?.windSpeed > 10
        ? 'Wolken plus Wind auf Ufer: flache Kanten, Kraut und Einlaeufe priorisieren.'
        : 'Bei Sonne und wenig Wind tiefer, schattiger und natuerlicher fischen.'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {legalClosed && (
        <div className="card bg-red-500/10 border-red-500/30">
          <h3 className="text-red-400 text-sm font-black uppercase tracking-widest mb-2">Schonzeit aktiv</h3>
          <p className="text-slate-200 text-sm leading-relaxed">
            Das Hecht-Scoring wird rechtlich auf 0 gesetzt. Nutze die Ansicht nur zur Analyse, nicht zur gezielten Angelei.
          </p>
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div>
            <h3 className="text-white font-black text-xl">Hecht-Taktik</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
              Score {scoreDetails?.total ?? '--'} / Rating {scoreDetails?.rating ?? '--'}
            </p>
          </div>
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">
            +/-{scoreDetails?.confidence ?? 8}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase font-bold block mb-1">Prime Window</span>
            <span className="text-slate-100 font-black">{scoreDetails?.primeWindow ?? 'naechste Daemmerung'}</span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase font-bold block mb-1">Hotspot</span>
            <span className="text-slate-100 font-black">{scoreDetails?.hotspot ?? 'Krautkante'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rules.map(rule => (
          <div key={rule.title} className="card">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-white font-black">{rule.title}</h4>
              <span className="text-blue-400 text-xs font-bold">{rule.value}</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{rule.text}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm px-1">Koeder</h3>
        {koder.map(item => (
          <div key={`${item.priorität}-${item.name}`} className="card">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h4 className="text-white font-black">{item.name}</h4>
                <p className="text-slate-400 text-xs mt-1">{item.größe} / {item.gewicht}</p>
              </div>
              <span className="text-[10px] bg-slate-950/60 border border-slate-700 rounded-lg px-2 py-1 text-slate-300">
                #{item.priorität}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block uppercase font-bold">Farbe</span>
                <span className="text-slate-100 font-bold">{item.farbe}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold">Wann</span>
                <span className="text-slate-100 font-bold">{item.wann}</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">{item.technik}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HechtTaktikView;
