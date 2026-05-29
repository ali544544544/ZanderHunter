import React from 'react';
import InfoTooltip from './InfoTooltip';
import type { HechtScoreDetails, TargetFish } from '../utils/calculations';

interface HechtInfoProps {
  scoreDetails?: HechtScoreDetails | null;
  fishLabel?: string;
  targetFish?: TargetFish;
}

const fishCopy = {
  hecht: {
    habitatTitle: 'Habitat-Tipp',
    habitat:
      'Hechte stehen gern an Krautkanten, Einläufen, Schilf, Buhnenköpfen und windgedrückten Ufern. Sie lauern oft an klaren Kanten zwischen Deckung und offenem Wasser.',
    warning:
      'Während der lokalen Schonzeit ist gezieltes Angeln auf Hecht zu vermeiden. Der Score zeigt nur die biologischen Bedingungen.',
    entnahmeInfo:
      'Lokales Mindestmaß oder Entnahmefenster aus den hinterlegten Bestimmungen.',
    limitInfo: 'Maximale Entnahme pro Tag und Angler, sofern lokal hinterlegt.',
    legalTooltip:
      'Rechtlicher Status für den ausgewählten Ort. Der Score bleibt sichtbar, aber während Schonzeit bitte nicht gezielt auf Hecht angeln.'
  },
  zander: {
    habitatTitle: 'Habitat-Tipp',
    habitat:
      'Zander lieben harte Böden, Steinpackungen und Strömungskanten. Tagsüber stehen sie oft tiefer und dunkler, in der Dämmerung ziehen sie flacher zum Jagen.',
    warning:
      'Während der lokalen Schonzeit ist gezieltes Angeln auf Zander zu vermeiden. Der Score zeigt nur die biologischen Bedingungen.',
    entnahmeInfo:
      'Lokales Mindestmaß oder Entnahmefenster aus den hinterlegten Bestimmungen.',
    limitInfo: 'Maximale Entnahme pro Tag und Angler, sofern lokal hinterlegt.',
    legalTooltip:
      'Rechtlicher Status für den ausgewählten Ort. Der Score bleibt sichtbar, aber während Schonzeit bitte nicht gezielt auf Zander angeln.'
  },
  barsch: {
    habitatTitle: 'Habitat-Tipp',
    habitat:
      'Barsche sammeln sich gern an Spundwänden, Pollern, Steinpackungen, Hafeneinfahrten und Kleinfisch-Schwärmen. Nach dem ersten Kontakt unbedingt weiterwerfen: Futterneid nutzen.',
    warning:
      'Flussbarsch hat je nach Bundesland unterschiedliche Vorgaben. Lokale Kunstköderverbote während Raubfisch-Schonzeiten bitte beachten.',
    entnahmeInfo:
      'Lokales Mindestmaß oder Entnahmefenster aus den hinterlegten Bestimmungen.',
    limitInfo: 'Tageslimit wird angezeigt, sofern lokal hinterlegt. Vereinsregeln bitte beachten.',
    legalTooltip:
      'Rechtlicher Status für den ausgewählten Ort. Kunstköderverbote während Raubfisch-Schonzeiten lokal prüfen.'
  }
};

const HechtInfo: React.FC<HechtInfoProps> = ({ scoreDetails, fishLabel = 'Hecht', targetFish = 'hecht' }) => {
  const copy = fishCopy[targetFish];
  const isSchonzeit = Boolean(scoreDetails?.legal.schonzeitAktiv);
  const entnahmefenster = scoreDetails?.legal.entnahmefenster || '45-75 cm';
  const [minSize, maxSize] = entnahmefenster.replace(' cm', '').split('-');
  const sizeDisplay = maxSize ? `${minSize}-${maxSize}` : entnahmefenster;
  const unitDisplay = maxSize ? 'cm' : '';
  const localLabel = scoreDetails?.legal.bundesland || 'lokal';
  const closedSeason = scoreDetails?.legal.schonzeit || 'keine';

  return (
    <div className="space-y-4 pt-4">
      <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm px-1">{fishLabel}-Info {localLabel}</h3>

      <div className={`card border-l-4 ${isSchonzeit ? 'border-l-red-500 bg-red-500/5' : 'border-l-green-500 bg-green-500/5'}`}>
        <div className="flex justify-between items-start gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              Status Schonzeit
              <InfoTooltip text={copy.legalTooltip} align="left" />
            </span>
            <h4 className={`text-lg font-black ${isSchonzeit ? 'text-red-400' : 'text-green-400'}`}>
              {isSchonzeit ? 'AKTUELL SCHONZEIT' : 'FISCHEREI FREI'}
            </h4>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase block">Zeitraum</span>
            <span className="text-xs font-bold text-slate-300">{closedSeason}</span>
          </div>
        </div>

        {isSchonzeit && (
          <div className="mt-3 p-2 bg-red-900/20 rounded-lg border border-red-500/20 text-[11px] text-red-200/80 leading-relaxed">
            <strong>Hinweis:</strong> {copy.warning}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
            Entnahmefenster
            <InfoTooltip text={copy.entnahmeInfo} align="left" />
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-slate-100">{sizeDisplay}</span>
            {unitDisplay && <span className="text-xs text-slate-500 font-bold uppercase">{unitDisplay}</span>}
          </div>
          <p className="text-[9px] text-slate-500 mt-1">{copy.entnahmeInfo}</p>
        </div>

        <div className="card p-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
            Fanglimit
            <InfoTooltip text={copy.limitInfo} />
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-slate-100">{scoreDetails?.legal.baglimit ?? '-'}</span>
            {scoreDetails?.legal.baglimit && <span className="text-xs text-slate-500 font-bold uppercase">Stück</span>}
          </div>
          <p className="text-[9px] text-slate-500 mt-1">{copy.limitInfo}</p>
        </div>
      </div>

      <div className="card bg-slate-800/30 border-slate-700/30">
        <h5 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
          {copy.habitatTitle}
          <InfoTooltip text={`Typische Standplätze und Suchbereiche für ${fishLabel}.`} align="left" />
        </h5>
        <p className="text-xs text-slate-500 leading-relaxed">{copy.habitat}</p>
      </div>
    </div>
  );
};

export default HechtInfo;
