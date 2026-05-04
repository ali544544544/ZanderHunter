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
      'Hechte stehen gern an Krautkanten, Einlaeufen, Schilf, Buhnenkoepfen und windgedrueckten Ufern. Sie lauern oft an klaren Kanten zwischen Deckung und offenem Wasser.',
    warning:
      'In Hamburg ist waehrend der Schonzeit gezieltes Angeln auf Hecht zu vermeiden. Der Score zeigt nur die biologischen Bedingungen.',
    entnahmeInfo:
      'Kuechenfenster Hamburg fuer Hecht. Groessere und kleinere Fische muessen zurueckgesetzt werden.',
    limitInfo: 'Maximale Entnahme pro Tag und Angler in Hamburger Gewaessern.',
    legalTooltip:
      'Rechtlicher Status fuer Hamburg. Der Score bleibt sichtbar, aber waehrend Schonzeit bitte nicht gezielt auf Hecht angeln.'
  },
  zander: {
    habitatTitle: 'Habitat-Tipp',
    habitat:
      'Zander lieben harte Boeden, Steinpackungen und Stroemungskanten. Tagsueber stehen sie oft tiefer und dunkler, in der Daemmerung ziehen sie flacher zum Jagen.',
    warning:
      'In Hamburg ist waehrend der Schonzeit das gezielte Angeln auf Zander zu vermeiden. Der Score zeigt nur die biologischen Bedingungen.',
    entnahmeInfo:
      'Kuechenfenster Hamburg fuer Zander. Groessere und kleinere Fische muessen zurueckgesetzt werden.',
    limitInfo: 'Maximale Entnahme pro Tag und Angler in Hamburger Gewaessern.',
    legalTooltip:
      'Rechtlicher Status fuer Hamburg. Der Score bleibt sichtbar, aber waehrend Schonzeit bitte nicht gezielt auf Zander angeln.'
  },
  barsch: {
    habitatTitle: 'Habitat-Tipp',
    habitat:
      'Barsche sammeln sich gern an Spundwaenden, Pollern, Steinpackungen, Hafeneinfahrten und Kleinfisch-Schwaermen. Nach dem ersten Kontakt unbedingt weiterwerfen: Futterneid nutzen.',
    warning:
      'Flussbarsch hat in ASV-Hamburg-Gewaessern keine generelle Schonzeit. Lokale Kunstkoederverbote waehrend Raubfisch-Schonzeiten bitte beachten.',
    entnahmeInfo:
      'Entnahmefenster Hamburg/ASV fuer Flussbarsch: 10-35 cm. Barsche ueber 35 cm moeglichst schonen.',
    limitInfo: 'Kein Tageslimit hinterlegt. Lokale Vereinsregeln bitte beachten.',
    legalTooltip:
      'Flussbarsch: keine generelle Schonzeit im hinterlegten Hamburger/ASV-Regelwerk. Kunstkoederverbote waehrend Raubfisch-Schonzeiten lokal pruefen.'
  }
};

const HechtInfo: React.FC<HechtInfoProps> = ({ scoreDetails, fishLabel = 'Hecht', targetFish = 'hecht' }) => {
  const copy = fishCopy[targetFish];
  const isBarsch = targetFish === 'barsch';
  const isSchonzeit = Boolean(scoreDetails?.legal.schonzeitAktiv);
  const entnahmefenster = scoreDetails?.legal.entnahmefenster || '45-75 cm';
  const [minSize, maxSize] = entnahmefenster.replace(' cm', '').split('-');
  const sizeDisplay = maxSize ? `${minSize}-${maxSize}` : entnahmefenster;
  const unitDisplay = maxSize ? 'cm' : '';

  return (
    <div className="space-y-4 pt-4">
      <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm px-1">{fishLabel}-Info Hamburg</h3>

      <div className={`card border-l-4 ${isSchonzeit ? 'border-l-red-500 bg-red-500/5' : 'border-l-green-500 bg-green-500/5'}`}>
        <div className="flex justify-between items-start gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              Status Schonzeit
              <InfoTooltip text={copy.legalTooltip} align="left" />
            </span>
            <h4 className={`text-lg font-black ${isSchonzeit ? 'text-red-400' : 'text-green-400'}`}>
              {isBarsch ? 'KEINE SCHONZEIT' : isSchonzeit ? 'AKTUELL SCHONZEIT' : 'FISCHEREI FREI'}
            </h4>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase block">Zeitraum</span>
            <span className="text-xs font-bold text-slate-300">{targetFish === 'barsch' ? 'keine' : '01.02. - 31.05.'}</span>
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
            <span className="text-2xl font-black text-slate-100">{targetFish === 'barsch' ? '-' : scoreDetails?.legal.baglimit || 2}</span>
            {targetFish !== 'barsch' && <span className="text-xs text-slate-500 font-bold uppercase">Stueck</span>}
          </div>
          <p className="text-[9px] text-slate-500 mt-1">{copy.limitInfo}</p>
        </div>
      </div>

      <div className="card bg-slate-800/30 border-slate-700/30">
        <h5 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
          {copy.habitatTitle}
          <InfoTooltip text={`Typische Standplaetze und Suchbereiche fuer ${fishLabel}.`} align="left" />
        </h5>
        <p className="text-xs text-slate-500 leading-relaxed">{copy.habitat}</p>
      </div>
    </div>
  );
};

export default HechtInfo;
