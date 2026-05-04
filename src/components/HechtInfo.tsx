import React from 'react';
import InfoTooltip from './InfoTooltip';
import type { HechtScoreDetails } from '../utils/calculations';

interface HechtInfoProps {
  scoreDetails?: HechtScoreDetails | null;
}

const HechtInfo: React.FC<HechtInfoProps> = ({ scoreDetails }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm px-1">Hecht-Info Hamburg</h3>

      <div className={`card ${scoreDetails?.legal.schonzeitAktiv ? 'border-red-500/30 bg-red-500/10' : 'border-green-500/30 bg-green-500/10'}`}>
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className={`text-xs font-black uppercase tracking-widest flex items-center gap-1 ${scoreDetails?.legal.schonzeitAktiv ? 'text-red-400' : 'text-green-400'}`}>
              {scoreDetails?.legal.schonzeitAktiv ? 'Schonzeit aktiv' : 'Fischerei frei'}
              <InfoTooltip text="Rechtlicher Status fuer Hamburg. Der Score zeigt trotzdem die biologischen Bedingungen; waehrend Schonzeit bitte nicht gezielt auf Hecht angeln." align="left" />
            </p>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {scoreDetails?.legal.hinweis || 'Hamburger Regelwerk wird im Score beruecksichtigt.'}
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div className="font-black text-slate-100">{scoreDetails?.legal.entnahmefenster || '45-75 cm'}</div>
            <div className="flex items-center justify-end gap-1">
              Entnahmefenster
              <InfoTooltip text="Groessenbereich, in dem ein Hecht nach Hamburger Regelwerk entnommen werden darf. Kleinere oder groessere Fische muessen zurueckgesetzt werden." />
            </div>
          </div>
        </div>
      </div>

      {scoreDetails && (
        <div className="card">
          <h4 className="text-white font-black mb-3">Actionable Output</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 flex items-center gap-1">
                Prime Window
                <InfoTooltip text="Das beste Zeitfenster aus Tide, Licht, Druck und Wind. Kenterpunkt plus 90 min bedeutet: nach dem Wechsel der Stroemungsrichtung bis etwa 90 Minuten danach." align="left" />
              </span>
              <span className="text-slate-100 font-bold text-right">{scoreDetails.primeWindow}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 flex items-center gap-1">
                Top-Taktik
                <InfoTooltip text="Die Fuehrungsart, die am besten zu Temperatur, Licht, Wind und Aktivitaetsfenster passt." align="left" />
              </span>
              <span className="text-slate-100 font-bold text-right">{scoreDetails.topTactic}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 flex items-center gap-1">
                Hotspot
                <InfoTooltip text="Empfohlener Spot-Typ, nicht zwingend ein einzelner Ort. Gemeint sind Bereiche wie Buhnenkopf, Einlauf, Krautkante oder windgedrueckte Uferseite." align="left" />
              </span>
              <span className="text-slate-100 font-bold text-right">{scoreDetails.hotspot}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 flex items-center gap-1">
                Wahrscheinlichkeit
                <InfoTooltip text="Eine grobe biologische Aktivitaets-Schaetzung aus dem Hecht-Score. Sie sagt nicht sicher voraus, ob ein Fisch beisst." align="left" />
              </span>
              <span className="text-blue-400 font-bold text-right">{scoreDetails.probability}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HechtInfo;
