import React from 'react';
import type { DataSource, KnownFishSpecies, WaterBodyProfile } from '../types/waterData';

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
  hejfish: 'hejfish',
  unknown: 'Schaetzung',
};

const speciesLabels: Record<KnownFishSpecies, string> = {
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

function getSpeciesLabel(entry: WaterBodyProfile['species'][number]) {
  return entry.displayName || speciesLabels[entry.species as KnownFishSpecies] || entry.species;
}

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

  const species = [...profile.species].sort((a, b) => getSpeciesLabel(a).localeCompare(getSpeciesLabel(b)));
  const quality = qualityCopy[profile.dataQuality];
  const sources = profile.sources.map((source) => sourceLabels[source]).join(', ');
  const details = profile.areaDetails;
  const hasFacts = Boolean(details && (
    typeof details.waterSizeHa === 'number'
    || details.season
    || details.mobileTicket
    || details.printRequired
  ));
  const hasFishingInfo = Boolean(details && (
    (details.techniques && details.techniques.length > 0)
    || (details.properties && details.properties.length > 0)
    || details.rulesText
  ));
  const hasManagerInfo = Boolean(details?.manager && (
    details.manager.name
    || details.manager.phone
    || details.manager.email
    || details.manager.website
  ));

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
        {species.length === 0 && (
          <p className="text-xs font-semibold text-slate-500">Keine Hejfish-Fischdaten fuer diesen Punkt gefunden.</p>
        )}
        {species.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {species.map((entry) => (
              <span
                key={`${entry.species}-${entry.displayName || ''}`}
                className="rounded-md border border-blue-400/25 bg-blue-400/10 px-2.5 py-1 text-xs font-black text-blue-100"
              >
                {getSpeciesLabel(entry)}
              </span>
            ))}
          </div>
        )}
      </div>

      {(profile.description || details || profile.imageUrl) && (
        <div className="mt-4 space-y-3 rounded-lg border border-slate-800 bg-slate-950/35 p-3">
          {profile.imageUrl && (
            <img
              src={profile.imageUrl}
              alt=""
              className="max-h-40 w-full rounded-md object-cover"
              loading="lazy"
            />
          )}
          {profile.description && (
            <p className="text-xs font-semibold leading-relaxed text-slate-300">{profile.description}</p>
          )}

          {hasFacts && (
            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-300">
              {typeof details?.waterSizeHa === 'number' && (
                <div>
                  <span className="block text-[9px] uppercase tracking-widest text-slate-500">Flaeche</span>
                  {details?.waterSizeHa} ha
                </div>
              )}
              {details?.season && (
                <div>
                  <span className="block text-[9px] uppercase tracking-widest text-slate-500">Saison</span>
                  {details.season}
                </div>
              )}
              {details?.mobileTicket && (
                <div>
                  <span className="block text-[9px] uppercase tracking-widest text-slate-500">Ticket</span>
                  Mobile Karte verfuegbar
                </div>
              )}
              {details?.printRequired && (
                <div>
                  <span className="block text-[9px] uppercase tracking-widest text-slate-500">Ausdruck</span>
                  Erforderlich
                </div>
              )}
            </div>
          )}

          {hasFishingInfo && (
            <div className="space-y-2 border-t border-slate-800 pt-3">
              {details?.techniques && details.techniques.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Methoden</p>
                  <p className="text-[11px] font-semibold text-slate-300">{details.techniques.join(', ')}</p>
                </div>
              )}
              {details?.properties && details.properties.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Hinweise</p>
                  <p className="text-[11px] font-semibold text-slate-300">{details.properties.join(', ')}</p>
                </div>
              )}
              {details?.rulesText && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Regeln</p>
                  <p className="text-[11px] font-semibold leading-relaxed text-slate-400">{details.rulesText}</p>
                </div>
              )}
            </div>
          )}

          {details?.tickets && details.tickets.length > 0 && (
            <div className="grid gap-1 border-t border-slate-800 pt-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Tickets</p>
              {details.tickets.map((ticket) => (
                <div key={`${ticket.name}-${ticket.price}`} className="flex justify-between gap-3 text-xs font-bold text-slate-300">
                  <span>{ticket.name}</span>
                  {ticket.price && <span className="text-slate-100">{ticket.price}</span>}
                </div>
              ))}
            </div>
          )}

          {hasManagerInfo && (
            <div className="space-y-1 border-t border-slate-800 pt-3 text-[11px] font-semibold text-slate-400">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Betreiber</p>
              {details?.manager?.name && <p className="font-bold text-slate-300">{details.manager.name}</p>}
              {details?.manager?.phone && (
                <a className="block text-blue-200" href={`tel:${details.manager.phone}`}>
                  Telefon: {details.manager.phone}
                </a>
              )}
              {details?.manager?.email && (
                <a className="block break-all text-blue-200" href={`mailto:${details.manager.email}`}>
                  {details.manager.email}
                </a>
              )}
              {details?.manager?.website && (
                <a className="block break-all text-blue-200" href={details.manager.website} target="_blank" rel="noreferrer">
                  {details.manager.website}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {profile.depth && (
          <span>
            Tiefe {profile.depth.max ? `bis ${profile.depth.max} m` : `${profile.depth.average ?? '?'} m`}
          </span>
        )}
        {profile.regulations?.permit_required && <span className="text-yellow-300">Angelerlaubnis benoetigt</span>}
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
