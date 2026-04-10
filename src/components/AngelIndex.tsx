import React from 'react';

interface AngelIndexProps {
  score: number;
  loading: boolean;
}

const AngelIndex: React.FC<AngelIndexProps> = ({ score, loading }) => {
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
    <div className="card flex flex-col items-center justify-center py-8 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 ${status.bg.replace('/20', '')}`}></div>
      
      <h3 className="text-slate-400 font-medium mb-2 uppercase tracking-wider text-sm">Zander-Index Hamburg</h3>
      
      <div className={`relative flex items-center justify-center w-40 h-40 rounded-full border-8 border-slate-700/50 ${status.color}`}>
        <div className="text-6xl font-black">{score}</div>
        <div className="absolute inset-0 rounded-full border-8 border-current border-t-transparent animate-score opacity-30"></div>
      </div>
      
      <div className={`mt-6 px-4 py-2 rounded-full font-bold text-lg ${status.color} ${status.bg}`}>
        {status.text}
      </div>
      
      <p className="mt-4 text-slate-400 text-sm italic text-center px-4">
        Basierend auf Tide, Luftdruck, Temperatur, Wind und Mond.
      </p>
    </div>
  );
};

export default AngelIndex;
