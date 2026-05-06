import React from 'react';
import type { KoderEmpfehlung } from '../data/koderLogik';

interface CurrentFishingTipsProps {
  fishLabel: string;
  koder?: KoderEmpfehlung;
  tactic?: string;
  hotspot?: string;
}

function TipPanel({ label, value, detail }: { label: string; value?: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black leading-snug text-slate-100">{value || '--'}</p>
      {detail && (
        <p className="mt-1 text-xs font-semibold leading-snug text-slate-500">{detail}</p>
      )}
    </div>
  );
}

const CurrentFishingTips: React.FC<CurrentFishingTipsProps> = ({ fishLabel, koder, tactic, hotspot }) => {
  return (
    <section className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">Aktuelle Angeltipps</p>
          <h3 className="mt-1 text-base font-black leading-tight text-slate-100">{fishLabel} jetzt angehen</h3>
        </div>
        <span className="rounded border border-slate-700 bg-slate-950/50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-400">
          Live
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <TipPanel label="Koeder" value={koder?.name} detail={koder ? `${koder.farbe} - ${koder.gewicht}` : undefined} />
        <TipPanel label="Fuehrung" value={tactic} />
        <TipPanel label="Standplatz" value={hotspot} />
      </div>

      {koder?.warum && (
        <div className="rounded-lg border border-blue-400/20 bg-blue-400/10 px-3 py-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Warum dieser Tipp</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-blue-50">{koder.warum}</p>
        </div>
      )}
    </section>
  );
};

export default CurrentFishingTips;
