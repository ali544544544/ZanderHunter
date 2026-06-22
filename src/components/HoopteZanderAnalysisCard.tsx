import React from 'react';
import { HOOPTE_ZOLLENSPIEKER_SPOT } from '../data/userSpotSeeds';
import { useHoopteZanderAnalysis } from '../hooks/useHoopteZanderAnalysis';

interface HoopteZanderAnalysisCardProps {
  enabled: boolean;
}

function ScorePill({ score }: { score: number }) {
  const className = score >= 75
    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
    : score >= 55
      ? 'border-yellow-400/30 bg-yellow-400/10 text-yellow-100'
      : 'border-red-400/30 bg-red-400/10 text-red-200';

  return (
    <span className={`inline-flex min-w-12 justify-center rounded-md border px-2 py-1 text-xs font-black ${className}`}>
      {score}
    </span>
  );
}

function InfoLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/25 px-3 py-2">
      <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <span className="mt-0.5 block text-xs font-black leading-snug text-slate-100">{value}</span>
    </div>
  );
}

const HoopteZanderAnalysisCard: React.FC<HoopteZanderAnalysisCardProps> = ({ enabled }) => {
  const { current, rows, loading, error } = useHoopteZanderAnalysis(enabled);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${HOOPTE_ZOLLENSPIEKER_SPOT.lat},${HOOPTE_ZOLLENSPIEKER_SPOT.lng}`;

  if (!enabled) return null;

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-950/25 p-3 text-xs font-bold text-slate-400">
        Lade Hoopte/Zollenspieker-Analyse...
      </div>
    );
  }

  if (error || !current) {
    return (
      <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-xs font-bold text-red-200">
        {error || 'Hoopte/Zollenspieker-Analyse aktuell nicht verfügbar.'}
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-slate-800 pt-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-100">Hoopte/Zollenspieker Zanderfenster</h3>
          <p className="mt-1 text-[10px] font-semibold leading-relaxed text-slate-400">
            Quelle Pegel: {current.station}. O2: {current.oxygenStation}.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <ScorePill score={current.nowScore} />
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-md bg-blue-500 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-white"
            aria-label="Navigation zu Hoopte/Zollenspieker in Google Maps öffnen"
          >
            Google Maps
          </a>
        </div>
      </div>

      {current.warning && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-black text-red-100">
          {current.warning}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <InfoLine label="Wasserstand" value={`${current.waterLevel} (${current.dhdt})`} />
        <InfoLine label="Tidephase" value={current.tidePhase} />
        <InfoLine label="Sauerstoff" value={current.oxygen} />
        <InfoLine label="Nächster Bestzeitpunkt" value={`${current.nextBestTime} (${current.nextBestScore})`} />
      </div>

      <p className="rounded-lg border border-slate-800 bg-slate-950/25 px-3 py-2 text-[10px] font-semibold leading-relaxed text-slate-300">
        {current.nowReason}
      </p>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="min-w-[760px] divide-y divide-slate-800 text-left text-[10px]">
          <thead className="bg-slate-950/60 text-slate-500">
            <tr>
              <th className="px-2 py-2 font-black uppercase tracking-widest">Tag</th>
              <th className="px-2 py-2 font-black uppercase tracking-widest">Hochwasser</th>
              <th className="px-2 py-2 font-black uppercase tracking-widest">Anfahrtzeit</th>
              <th className="px-2 py-2 font-black uppercase tracking-widest">Wetter</th>
              <th className="px-2 py-2 font-black uppercase tracking-widest">Beste Phase</th>
              <th className="px-2 py-2 font-black uppercase tracking-widest">Zander-Score</th>
              <th className="px-2 py-2 font-black uppercase tracking-widest">Begründung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950/20 text-slate-300">
            {rows.map((row) => (
              <tr key={`${row.dateLabel}-${row.highWater}`} className={row.rank ? 'bg-blue-500/5' : undefined}>
                <td className="whitespace-nowrap px-2 py-2 font-black text-slate-100">
                  {row.rank ? `Top ${row.rank} ` : ''}{row.dateLabel}
                </td>
                <td className="whitespace-nowrap px-2 py-2 font-bold">{row.highWater}</td>
                <td className="whitespace-nowrap px-2 py-2 font-bold">{row.arrival}</td>
                <td className="min-w-32 px-2 py-2">{row.weather}</td>
                <td className="whitespace-nowrap px-2 py-2 font-bold text-blue-100">{row.bestPhase}</td>
                <td className="px-2 py-2"><ScorePill score={row.score} /></td>
                <td className="min-w-48 px-2 py-2">
                  {row.thunderstormRisk && <span className="font-black text-red-200">Gewitterrisiko. </span>}
                  {row.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HoopteZanderAnalysisCard;
