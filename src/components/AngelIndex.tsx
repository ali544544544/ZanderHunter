import React from 'react';
import InfoTooltip from './InfoTooltip';
import type { HechtScoreDetails } from '../utils/calculations';

interface AngelIndexProps {
  score: number;
  loading: boolean;
  fishLabel?: string;
  scoreDetails?: HechtScoreDetails | null;
}

const AngelIndex: React.FC<AngelIndexProps> = ({ score, loading, fishLabel = 'Zander', scoreDetails }) => {
  const getStatus = (s: number) => {
    if (s >= 75) return { color: 'text-angel-green', bg: 'bg-angel-green/20', text: 'Sehr gut — raus gehen!' };
    if (s >= 55) return { color: 'text-angel-light', bg: 'bg-angel-light/20', text: 'Gut — lohnender Ausflug' };
    if (s >= 40) return { color: 'text-angel-yellow', bg: 'bg-angel-yellow/20', text: 'Mittel — möglich, aber zäh' };
    return { color: 'text-angel-red', bg: 'bg-angel-red/20', text: 'Schlecht — besser morgen' };
  };

  const status = getStatus(score);

  if (loading) {
    return (
      <div className="card flex flex-col items-center justify-center min-h-[250px] animate-pulse">
        <div className="w-32 h-32 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin"></div>
        <p className="mt-4 text-slate-400">Berechne Angel-Index...</p>
      </div>
    );
  }

  return (
    <div className="card flex flex-col items-center justify-center py-8 relative overflow-visible">
      <div className={`absolute top-0 left-0 w-full h-1 ${status.bg.replace('/20', '')}`}></div>
      
      <h3 className="text-slate-400 font-medium mb-2 uppercase tracking-wider text-sm">{fishLabel}-Index Hamburg</h3>
      
      <div className={`relative flex items-center justify-center w-40 h-40 rounded-full border-8 border-slate-700/50 ${status.color}`}>
        <div className="text-6xl font-black">{score}</div>
        <div className="absolute inset-0 rounded-full border-8 border-current border-t-transparent animate-score opacity-30"></div>
      </div>
      
      <div className={`mt-6 px-4 py-2 rounded-full font-bold text-lg ${status.color} ${status.bg}`}>
        {scoreDetails?.legal.schonzeitAktiv ? 'Schonzeit aktiv' : status.text}
      </div>

      {scoreDetails && (
        <div className="mt-5 w-full grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-2">
            <span className="flex items-center gap-1 text-[9px] text-slate-500 uppercase font-bold">
              Konfidenz
              <InfoTooltip text="Der Unsicherheitsbereich des Scores. +/-6 bedeutet: Die realistische Spanne liegt ungefaehr 6 Punkte ueber oder unter dem angezeigten Wert." />
            </span>
            <span className="font-black text-slate-100">+/-{scoreDetails.confidence}</span>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-2">
            <span className="flex items-center gap-1 text-[9px] text-slate-500 uppercase font-bold">
              Prime Window
              <InfoTooltip text="Das beste Zeitfenster laut Score. Bei Kenterfenstern ist die Phase um den Stroemungswechsel gemeint, weil Beutefische und Raeuber neu positionieren." />
            </span>
            <span className="font-black text-slate-100">{scoreDetails.primeWindow}</span>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-2">
            <span className="flex items-center gap-1 text-[9px] text-slate-500 uppercase font-bold">
              Chance
              <InfoTooltip text={`Eine grobe, aus dem ${fishLabel}-Score abgeleitete biologische Aktivitaets-Schaetzung. Das ist kein Fangversprechen und ersetzt keine lokale Erfahrung.`} />
            </span>
            <span className="font-black text-slate-100">{scoreDetails.probability}</span>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-2">
            <span className="flex items-center gap-1 text-[9px] text-slate-500 uppercase font-bold">
              Bonus
              <InfoTooltip text="Multiplikativer Synergie-Faktor. Positive Kombinationen wie fallender Druck plus passendes Zeit- oder Tidefenster erhoehen den Gesamtscore." />
            </span>
            <span className="font-black text-slate-100">{scoreDetails.interactionBonus > 0 ? '+' : ''}{scoreDetails.interactionBonus}%</span>
          </div>
        </div>
      )}
      
      <p className="mt-4 text-slate-400 text-sm italic text-center px-4">
        {scoreDetails ? `${fishLabel}-Scoring aus Temperatur, Drucktrend, Tide, Licht, Wind und Synergien.` : 'Basierend auf Tide, Luftdruck, Temperatur, Wind und Mond.'}
      </p>
    </div>
  );
};

export default AngelIndex;
