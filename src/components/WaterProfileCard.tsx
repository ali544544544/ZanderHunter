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
  hejfish: 'Angelkarten-Daten',
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

const speciesOrder: KnownFishSpecies[] = ['zander', 'hecht', 'barsch', 'aal', 'forelle', 'karpfen', 'wels', 'brasse', 'rotauge'];

function getSpeciesLabel(entry: WaterBodyProfile['species'][number]) {
  return entry.displayName || speciesLabels[entry.species as KnownFishSpecies] || entry.species;
}

function getSpeciesRank(entry: WaterBodyProfile['species'][number]) {
  const rank = speciesOrder.indexOf(entry.species as KnownFishSpecies);
  return rank >= 0 ? rank : speciesOrder.length;
}

function formatArea(value: number) {
  return new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value);
}

function formatDate(value: Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
      {children}
    </p>
  );
}

function InfoTile({ label, value, tone = 'default' }: { label: string; value: React.ReactNode; tone?: 'default' | 'good' | 'warn' }) {
  const toneClass = tone === 'good'
    ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
    : tone === 'warn'
      ? 'border-yellow-400/25 bg-yellow-400/10 text-yellow-100'
      : 'border-slate-700/80 bg-slate-950/25 text-slate-200';

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
      <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <span className="mt-0.5 block text-xs font-black leading-snug">{value}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;

  return (
    <div className="grid grid-cols-[92px_1fr] gap-3 border-t border-slate-800 py-2 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <span className="text-xs font-semibold leading-relaxed text-slate-300">{value}</span>
    </div>
  );
}

function TagList({ items, tone = 'blue' }: { items: string[]; tone?: 'blue' | 'slate' | 'green' }) {
  if (items.length === 0) return null;

  const toneClass = tone === 'green'
    ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
    : tone === 'slate'
      ? 'border-slate-700 bg-slate-900/60 text-slate-200'
      : 'border-blue-400/25 bg-blue-400/10 text-blue-100';

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`rounded-md border px-2.5 py-1 text-xs font-black leading-none ${toneClass}`}>
          {item}
        </span>
      ))}
    </div>
  );
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

  const species = [...profile.species].sort((a, b) => {
    const rankDiff = getSpeciesRank(a) - getSpeciesRank(b);
    return rankDiff || getSpeciesLabel(a).localeCompare(getSpeciesLabel(b), 'de');
  });
  const speciesLabelsForDisplay = species.map(getSpeciesLabel);
  const quality = qualityCopy[profile.dataQuality];
  const sources = profile.sources.map((source) => sourceLabels[source]).join(', ');
  const details = profile.areaDetails;
  const formattedUpdatedAt = formatDate(profile.lastUpdated);
  const ticketTone = details?.mobileTicket ? 'good' : profile.regulations?.permit_required ? 'warn' : 'default';
  const hasDetailRows = Boolean(
    details?.season
    || details?.rulesText
    || (details?.properties && details.properties.length > 0)
  );
  const hasManagerInfo = Boolean(details?.manager && (
    details.manager.name
    || details.manager.phone
    || details.manager.email
    || details.manager.website
  ));

  return (
    <section className="card space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gewaesser</p>
            {profile.sources.includes('hejfish') && (
              <span className="rounded border border-blue-400/20 bg-blue-400/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-blue-200">
                Gewaesserdaten
              </span>
            )}
          </div>
          <h2 className="mt-1 text-lg font-black leading-tight text-slate-100">{profile.name}</h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-400">
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
              Neu laden
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <InfoTile label="Fischdaten" value={species.length > 0 ? `${species.length} Arten` : 'Keine Angabe'} tone={species.length > 0 ? 'good' : 'default'} />
        <InfoTile label="Erlaubnis" value={profile.regulations?.permit_required ? 'Noetig' : 'Keine Angabe'} tone={profile.regulations?.permit_required ? 'warn' : 'default'} />
        <InfoTile label="Ticket" value={details?.mobileTicket ? 'Online' : 'Vor Ort / extern'} tone={ticketTone} />
        <InfoTile label="Stand" value={formattedUpdatedAt || 'Unbekannt'} />
      </div>

      {profile.imageUrl && (
        <img
          src={profile.imageUrl}
          alt=""
          className="max-h-44 w-full rounded-lg border border-slate-800 object-cover"
          loading="lazy"
        />
      )}

      {profile.description && (
        <p className="rounded-lg border border-slate-800 bg-slate-950/25 p-3 text-xs font-semibold leading-relaxed text-slate-300">
          {profile.description}
        </p>
      )}

      <div className="space-y-2">
        <SectionHeading>Fischarten</SectionHeading>
        {speciesLabelsForDisplay.length > 0 ? (
          <TagList items={speciesLabelsForDisplay} />
        ) : (
          <p className="rounded-lg border border-slate-800 bg-slate-950/25 p-3 text-xs font-semibold text-slate-500">
            Fuer diesen Punkt liegen keine Fischarten in den Gewaesserdaten vor.
          </p>
        )}
      </div>

      {details?.techniques && details.techniques.length > 0 && (
        <div className="space-y-2">
          <SectionHeading>Angelmethoden</SectionHeading>
          <TagList items={details.techniques} tone="green" />
        </div>
      )}

      {hasDetailRows && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/25 p-3">
          <DetailRow label="Saison" value={details?.season} />
          <DetailRow label="Hinweise" value={details?.properties && details.properties.length > 0 ? details.properties.join(', ') : undefined} />
          <DetailRow label="Regeln" value={details?.rulesText} />
        </div>
      )}

      {(typeof details?.waterSizeHa === 'number' || details?.locationInfo?.length || details?.printRequired !== undefined) && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/25 p-3">
          <DetailRow
            label="Flaeche"
            value={typeof details?.waterSizeHa === 'number' ? `${formatArea(details.waterSizeHa)} ha` : undefined}
          />
          <DetailRow
            label="Region"
            value={details?.locationInfo && details.locationInfo.length > 0 ? details.locationInfo.join(', ') : undefined}
          />
          <DetailRow
            label="Ausdruck"
            value={details?.printRequired === undefined ? undefined : details.printRequired
              ? 'Erforderlich - Karte vor dem Angeln ausdrucken.'
              : 'Nicht erforderlich - laut Gewaesserdaten ist keine Druckpflicht hinterlegt.'}
          />
        </div>
      )}

      {details?.tickets && details.tickets.length > 0 && (
        <div className="space-y-2">
          <SectionHeading>Tickets</SectionHeading>
          <div className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950/25">
            {details.tickets.map((ticket) => (
              <div key={`${ticket.name}-${ticket.price}`} className="flex items-start justify-between gap-3 px-3 py-2 text-xs">
                <span className="font-bold leading-relaxed text-slate-200">{ticket.name}</span>
                {ticket.price && <span className="shrink-0 font-black text-slate-100">{ticket.price}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasManagerInfo && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/25 p-3">
          <SectionHeading>Betreiber</SectionHeading>
          <div className="mt-2 space-y-1 text-xs font-semibold leading-relaxed text-slate-300">
            {details?.manager?.name && <p className="font-black text-slate-100">{details.manager.name}</p>}
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
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {profile.depth && (
          <span>
            Tiefe {profile.depth.max ? `bis ${profile.depth.max} m` : `${profile.depth.average ?? '?'} m`}
          </span>
        )}
        <span>Daten: {sources}</span>
        {loading && <span className="text-blue-300">Aktualisiert...</span>}
      </div>

      {profile.links && profile.links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {profile.links.map((link) => (
            <a
              key={`${link.label}-${link.url}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className={`rounded-md border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide transition-colors ${linkStyles[link.kind]}`}
            >
              <span aria-hidden="true">↗ </span>
              {link.label}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
