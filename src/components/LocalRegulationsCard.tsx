import React from 'react';
import type { LocalFishRule } from '../data/fishRegulations';
import type { TargetFish } from '../utils/calculations';

interface LocalRegulationsCardProps {
  rules: LocalFishRule[];
  targetFish: TargetFish;
}

const fishOrder: TargetFish[] = ['zander', 'hecht', 'barsch'];

export function LocalRegulationsCard({ rules, targetFish }: LocalRegulationsCardProps) {
  if (rules.length === 0) return null;

  const sortedRules = [...rules].sort((a, b) => fishOrder.indexOf(a.fish) - fishOrder.indexOf(b.fish));
  const source = rules[0];
  const activeRule = rules.find((rule) => rule.fish === targetFish);

  return (
    <section className="card space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Lokale Bestimmungen</p>
          <h2 className="mt-1 text-lg font-black leading-tight text-slate-100">{source.sourceLabel}</h2>
        </div>
        <a
          href={source.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-md border border-slate-700 px-2 py-1 text-[9px] font-black uppercase text-blue-200 transition-colors hover:bg-blue-400/10"
        >
          Quelle
        </a>
      </div>

      {activeRule?.closedNow && (
        <div className="rounded-lg border border-red-500/35 bg-red-500/10 p-3 text-xs font-semibold leading-relaxed text-red-100">
          <strong>{activeRule.fishLabel}: Schonzeit aktiv.</strong> Nicht gezielt befischen; lokale Erlaubnisscheine koennen strenger sein.
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-800">
        <div className="grid grid-cols-[1fr_1fr_1fr] bg-slate-950/60 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
          <span>Fisch</span>
          <span>Schonzeit</span>
          <span>Mass</span>
        </div>
        <div className="divide-y divide-slate-800 bg-slate-950/20">
          {sortedRules.map((rule) => (
            <div
              key={rule.fish}
              className={`grid grid-cols-[1fr_1fr_1fr] px-3 py-2 text-xs font-bold ${
                rule.fish === targetFish ? 'bg-blue-500/10 text-slate-100' : 'text-slate-300'
              }`}
            >
              <span>{rule.fishLabel}</span>
              <span className={rule.closedNow ? 'text-red-300' : 'text-slate-300'}>{rule.closedSeasonText}</span>
              <span>{rule.sizeText}</span>
            </div>
          ))}
        </div>
      </div>

      {sortedRules.some((rule) => rule.bagLimit || rule.note) && (
        <div className="space-y-1 text-[10px] font-semibold leading-relaxed text-slate-400">
          {sortedRules.map((rule) => (
            (rule.bagLimit || rule.note) && (
              <p key={`${rule.fish}-note`}>
                <span className="font-black text-slate-300">{rule.fishLabel}:</span>
                {rule.bagLimit ? ` Tageslimit ${rule.bagLimit}.` : ''}
                {rule.note ? ` ${rule.note}` : ''}
              </p>
            )
          ))}
        </div>
      )}

      <p className="text-[10px] font-semibold leading-relaxed text-slate-500">
        Basis sind Landesregeln; Erlaubnisschein, Verein und Gewaesserordnung koennen strengere Vorgaben setzen.
      </p>
    </section>
  );
}
