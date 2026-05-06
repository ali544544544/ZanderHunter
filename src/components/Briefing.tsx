import React from 'react';

interface BriefingProps {
  text: string;
  fishLabel?: string;
}

interface BriefingItem {
  label: string;
  value: string;
  tone?: 'blue' | 'green' | 'yellow' | 'red';
}

const toneClasses: Record<NonNullable<BriefingItem['tone']>, string> = {
  blue: 'border-blue-400/25 bg-blue-400/10 text-blue-50',
  green: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-50',
  yellow: 'border-yellow-400/25 bg-yellow-400/10 text-yellow-50',
  red: 'border-red-400/25 bg-red-400/10 text-red-50',
};

function splitBriefing(text: string) {
  return text
    .split(/(?<=\.)\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseBriefing(text: string, fishLabel: string) {
  const sentences = splitBriefing(text);
  const items: BriefingItem[] = [];
  const notes: string[] = [];

  for (const sentence of sentences) {
    const cleanSentence = sentence.replace(/\.$/, '');
    const scoreMatch = cleanSentence.match(new RegExp(`^${fishLabel}-Score\\s+(.+)$`, 'i'));

    if (scoreMatch) {
      items.push({ label: 'Score', value: scoreMatch[1], tone: 'green' });
      continue;
    }

    if (/^Prime Window:/i.test(cleanSentence)) {
      items.push({ label: 'Prime Window', value: cleanSentence.replace(/^Prime Window:\s*/i, ''), tone: 'blue' });
      continue;
    }

    if (/^Taktik:/i.test(cleanSentence)) {
      items.push({ label: 'Taktik', value: cleanSentence.replace(/^Taktik:\s*/i, ''), tone: 'yellow' });
      continue;
    }

    if (/^Hotspot:/i.test(cleanSentence)) {
      items.push({ label: 'Hotspot', value: cleanSentence.replace(/^Hotspot:\s*/i, ''), tone: 'blue' });
      continue;
    }

    if (/SCHONZEIT|Schonzeit/i.test(cleanSentence)) {
      items.push({ label: 'Rechtliches', value: cleanSentence, tone: 'red' });
      continue;
    }

    notes.push(cleanSentence);
  }

  return { items, notes };
}

const Briefing: React.FC<BriefingProps> = ({ text, fishLabel = 'Zander' }) => {
  const { items, notes } = parseBriefing(text, fishLabel);

  return (
    <section className="card border-blue-500/30 bg-blue-600/10">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">Lagebild</p>
          <h3 className="mt-1 text-base font-black leading-tight text-slate-100">{fishLabel}-Briefing</h3>
        </div>
        <span className="rounded border border-blue-400/25 bg-blue-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-blue-100">
          Live
        </span>
      </div>

      {items.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <div key={`${item.label}-${item.value}`} className={`rounded-lg border p-3 ${toneClasses[item.tone || 'blue']}`}>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{item.label}</p>
              <p className="mt-1 text-sm font-black leading-snug">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {notes.length > 0 && (
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/35 p-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Worauf achten</p>
          <ul className="mt-2 space-y-2">
            {notes.map((note) => (
              <li key={note} className="flex gap-2 text-xs font-semibold leading-relaxed text-slate-200">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-300" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-slate-700/50 pt-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        <span>Aktuelle Bedingungen</span>
        <span>Automatisch bewertet</span>
      </div>
    </section>
  );
};

export default Briefing;
