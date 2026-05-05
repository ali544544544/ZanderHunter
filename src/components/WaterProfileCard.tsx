import React from 'react';
import type { DataSource, FishSpecies, WaterBodyProfile } from '../types/waterData';

interface WaterProfileCardProps {
  profile: WaterBodyProfile | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const qualityCopy = {
  high: { label: 'Gute Daten', className: 'text-emerald-300' },
  medium: { label: 'Mittlere Daten', className: 'text-yellow-300' },
  low: { label: 'Wenig Daten', className: 'text-orange-300' },
  unknown: { label: 'Fallback', className: 'text-slate-400' },
};

const typeLabels: Record<WaterBodyProfile['type'], string> = {
  river: 'Fluss',
  lake: 'See',
  canal: 'Kanal',
  pond: 'Teich',
  sea: 'Meer',
};

const sourceLabels: Record<DataSource, string> = {
  waterapi: 'WaterAPI',
  fischinfo_nrw: 'FischInfo NRW',
  anglermap: 'Anglermap',
  user_report: 'Lokales Gewaesserprofil',
  unknown: 'Schaetzung',
};

const speciesLabels: Record<FishSpecies, string> = {
  zander: 'Zander',
  hecht: 'Hecht',
  barsch: 'Barsch',
  karpfen: 'Karpfen',
  aal: 'Aal',
  brasse: 'Brasse',
  rotauge: 'Rotauge',
  forelle: 'Forelle',
  wels: 'Wels',
};

const linkStyles: Record<NonNullable<WaterBodyProfile['links']>[number]['kind'], string> = {
  permit: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200',
  info: 'border-slate-600 bg-slate-800/70 text-slate-200',
  community: 'border-blue-500/40 bg-blue-500/10 text-blue-200',
};

export function WaterProfileCard({ profile, loading = false, error = null, onRefresh }: WaterProfileCardProps) {
  if (loading && !profile) {
    return (
      <section className="card p-4">
        <div className="h-4 w-28 rounded bg-slate-800" />
        <div className="mt-3 h-3 w-full rounded bg-slate-800/70" />
        <div className="mt-2 h-3 w-2/3 rounded bg-slate-800/70" />
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gewaesser</p>
            <p className="text-sm font-bold text-slate-300">{error || 'Keine Gewaesserdaten'}</p>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-[10px] font-black uppercase text-slate-200"
            >
              Neu
            </button>
          )}
        </div>
      </section>
    );
  }

  const species = [...profile.species].sort((a, b) => b.confidence - a.confidence);
  const quality = qualityCopy[profile.dataQuality];
  const sources = profile.sources.map((source) => sourceLabels[source]).join(', ');

  return (
    <section className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gewaesser</p>
          <h2 className="truncate text-lg font-black text-slate-100">{profile.name}</h2>
          <p className="text-xs font-semibold text-slate-500">
            {typeLabels[profile.type]} - {profile.region}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`text-[10px] font-black uppercase tracking-wide ${quality.className}`}>
            {quality.label}
          </span>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-md border border-slate-700 px-2 py-1 text-[9px] font-black uppercase text-slate-300 transition-colors hover:bg-slate-800"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Vorhandene Fischarten</p>
        {species.map((entry) => (
          <div key={entry.species} className="grid grid-cols-[82px_1fr_36px] items-center gap-2 text-xs">
            <span className="font-bold text-slate-300">{speciesLabels[entry.species]}</span>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-400"
                style={{ width: `${Math.round(entry.confidence * 100)}%` }}
              />
            </div>
            <span className="text-right font-black text-slate-400">{Math.round(entry.confidence * 100)}%</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {profile.depth && (
          <span>
            Tiefe {profile.depth.max ? `bis ${profile.depth.max} m` : `${profile.depth.average ?? '?'} m`}
          </span>
        )}
        {profile.regulations?.permit_required && <span className="text-yellow-300">Angelerlaubnis pruefen</span>}
        <span>Daten: {sources}</span>
        {loading && <span className="text-blue-300">Aktualisiert...</span>}
      </div>

      {profile.links && profile.links.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.links.map((link) => (
            <a
              key={`${link.label}-${link.url}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className={`rounded-md border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide transition-colors ${linkStyles[link.kind]}`}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
