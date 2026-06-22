import React from 'react';
import { HOOPTE_ZOLLENSPIEKER_SPOT } from '../data/userSpotSeeds';
import { useHoopteZanderSourceAnalysis } from '../hooks/useHoopteZanderSourceAnalysis';
import type { HoopteSourceLink } from '../hooks/useHoopteZanderSourceAnalysis';

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
    <span className={`inline-flex min-w-8 justify-center rounded-md border px-1.5 py-0.5 text-[10px] font-black ${className}`}>
      {score}
    </span>
  );
}

function TableScore({ score }: { score: number }) {
  const className = score >= 75
    ? 'text-emerald-200'
    : score >= 55
      ? 'text-yellow-100'
      : 'text-red-200';

  return <span className={`font-black ${className}`}>{score}</span>;
}

function InfoLine({ label, value, source }: { label: string; value: React.ReactNode; source?: HoopteSourceLink }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/25 px-2 py-1.5">
      <span className="flex items-center justify-between gap-1 text-[8px] font-black uppercase tracking-wide text-slate-500">
        <span>{label}</span>
        {source && (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            title={`Quelle: ${source.label}`}
            aria-label={`Quelle fuer ${label} oeffnen: ${source.label}`}
            className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-[9px] font-black normal-case leading-none text-slate-400 hover:border-blue-400/60 hover:text-blue-200"
          >
            i
          </a>
        )}
      </span>
      <span className="mt-0.5 block text-[10px] font-black leading-snug text-slate-100">{value}</span>
    </div>
  );
}

const HoopteZanderAnalysisCard: React.FC<HoopteZanderAnalysisCardProps> = ({ enabled }) => {
  const { current, rows, loading, error } = useHoopteZanderSourceAnalysis(enabled);
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

  const pegelSource = current.sourceLinks.find((source) => source.label === 'PegelOnline');
  const oxygenSource = current.sourceLinks.find((source) => source.label === 'WGMN Bunthaus');
  const waterQualitySource = current.sourceLinks.find((source) => source.label === 'WGMN Service');

  return (
    <div className="space-y-2 border-t border-slate-800 pt-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-black text-slate-100">Hoopte/Zollenspieker Zanderfenster</h3>
          <p className="mt-0.5 text-[9px] font-semibold leading-snug text-slate-400">
            Pegel: {current.station}. Tide: {current.tideSource}.
          </p>
          <p className="mt-0.5 text-[9px] font-semibold leading-snug text-slate-500">{current.oxygenStation}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <ScorePill score={current.nowScore} />
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-md bg-blue-500 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white"
            aria-label="Navigation zu Hoopte/Zollenspieker in Google Maps öffnen"
          >
            Google Maps
          </a>
        </div>
      </div>

      {current.warning && (
        <p className="rounded-md border border-red-400/30 bg-red-400/10 px-2 py-1.5 text-[10px] font-black text-red-100">
          {current.warning}
        </p>
      )}

      <div className="grid grid-cols-2 gap-1.5">
        <InfoLine label="Wasserstand" value={`${current.waterLevel} (${current.dhdt})`} source={pegelSource} />
        <InfoLine label="Tidephase" value={current.tidePhase} />
        <InfoLine label="Sauerstoff" value={current.oxygen} source={oxygenSource} />
        <InfoLine label="Nächster Bestzeitpunkt" value={`${current.nextBestTime} (${current.nextBestScore})`} />
        <InfoLine label="Wasserqualität" value={current.waterQuality} source={waterQualitySource} />
      </div>

      <p className="rounded-md border border-slate-800 bg-slate-950/25 px-2 py-1.5 text-[9px] font-semibold leading-snug text-slate-300">
        {current.nowReason}
      </p>

      <div className="rounded-md border border-slate-800">
        <table className="w-full table-fixed divide-y divide-slate-800 text-left text-[8px] sm:text-[9px]">
          <colgroup>
            <col className="w-[13%]" />
            <col className="w-[6%]" />
            <col className="w-[9%]" />
            <col className="w-[10%]" />
            <col className="w-[16%]" />
            <col className="w-[13%]" />
            <col className="w-[8%]" />
            <col className="w-[25%]" />
          </colgroup>
          <thead className="bg-slate-950/60 text-slate-500">
            <tr>
              <th className="px-1 py-1.5 font-black uppercase tracking-wide">Datum</th>
              <th className="px-1 py-1.5 font-black uppercase tracking-wide">Tag</th>
              <th className="px-1 py-1.5 font-black uppercase tracking-wide">HW</th>
              <th className="px-1 py-1.5 font-black uppercase tracking-wide">Da sein</th>
              <th className="px-1 py-1.5 font-black uppercase tracking-wide">Wetter</th>
              <th className="px-1 py-1.5 font-black uppercase tracking-wide">Phase</th>
              <th className="px-1 py-1.5 font-black uppercase tracking-wide">Score</th>
              <th className="px-1 py-1.5 font-black uppercase tracking-wide">Begründung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950/20 text-slate-300">
            {rows.map((row) => (
              <tr key={`${row.date}-${row.highWater}`}>
                <td className="px-1 py-1.5 font-black leading-tight text-slate-100">{row.date}</td>
                <td className="px-1 py-1.5 font-bold leading-tight">{row.day}</td>
                <td className="px-1 py-1.5 font-bold leading-tight">{row.highWater}</td>
                <td className="px-1 py-1.5 font-bold leading-tight">{row.arrival}</td>
                <td className="px-1 py-1.5 leading-tight">{row.weather}</td>
                <td className="px-1 py-1.5 font-bold leading-tight text-blue-100">{row.bestPhase}</td>
                <td className="px-1 py-1.5"><TableScore score={row.score} /></td>
                <td className="px-1 py-1.5 leading-tight">
                  {row.warningText && <span className="font-black text-red-200">{row.warningText}. </span>}
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
