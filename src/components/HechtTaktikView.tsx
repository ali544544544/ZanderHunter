import React from 'react';
import InfoTooltip from './InfoTooltip';
import type { KoderEmpfehlung } from '../data/koderLogik';
import type { HechtScoreDetails, TargetFish } from '../utils/calculations';

interface HechtTaktikViewProps {
  conditions: any;
  weather: any;
  koder: KoderEmpfehlung[];
  scoreDetails?: HechtScoreDetails | null;
  fishLabel?: string;
  targetFish?: TargetFish;
}

const HechtTaktikView: React.FC<HechtTaktikViewProps> = ({ conditions, weather, koder, scoreDetails, fishLabel = 'Hecht', targetFish = 'hecht' }) => {
  const legalClosed = scoreDetails?.legal.schonzeitAktiv;
  const isHecht = targetFish === 'hecht';
  const isBarsch = targetFish === 'barsch';

  const rules = [
    {
      title: 'Temperatur',
      value: `${conditions?.wasserTemp ?? '--'}C`,
      text: isBarsch
        ? conditions?.wasserTemp < 8
          ? 'Winterlager: Dropshot oder Vertikalangeln ultra-slow in tiefen Becken.'
          : conditions?.wasserTemp <= 22
            ? 'Aktivphase: Jiggen, Spinmad und Struktur-Hopping funktionieren gut.'
            : 'Warmwasser: Sauerstoff, Strömung und Schatten suchen.'
        : isHecht
        ? conditions?.wasserTemp < 8
          ? 'Kaltwasser: langsam, lange Pausen, Köder im Sichtfeld halten.'
          : conditions?.wasserTemp <= 16
            ? 'Aktivfenster: große Silhouette, Jerks und Swimbaits funktionieren gut.'
            : 'Warmwasser: früh/spät fischen, Sauerstoff und Schatten suchen.'
        : conditions?.wasserTemp < 8
          ? 'Kaltwasser: kleine Shads langsam und grundnah führen.'
          : conditions?.wasserTemp <= 18
            ? 'Komfortzone: Kanten aktiv abjiggen, auch Wobbler in der Dämmerung.'
            : 'Warmwasser: Sauerstoff, Strömung und Schatten priorisieren.',
      info: isBarsch
        ? 'Barsche sind wärmeliebend: Peak um 18C, Winter-Mittagsbonus unter 8C.'
        : isHecht
        ? 'Temperatur bewertet den Stoffwechsel. Beim Hecht sind etwa 15C sehr stark, um 10C gibt es einen zweiten Aktivitäts-Peak.'
        : 'Temperatur bewertet die Zander-Komfortzone. 10-18C ist stark, darunter und darüber wird vorsichtiger gefischt.'
    },
    {
      title: 'Drucktrend',
      value: conditions?.luftdruckTrend || '--',
      text: isBarsch
        ? 'Stabiler Hochdruck ist stark. Bei Druckchaos feiner und langsamer fischen.'
        : conditions?.luftdruckTrend === 'fallend'
        ? 'Sanft fallender Druck triggert Such- und Fressphasen.'
        : 'Bei stabilem oder steigendem Druck langsamer führen und Struktur enger abfischen.',
      info: isBarsch ? 'Barsch Modul A nutzt 72h-Druckstabilität, absoluten Druck und kurzfristigen Trend. Schneller Druckanstieg ist kritisch.' : 'Drucktrend vergleicht aktuellen Luftdruck mit der Historie. Sanft fallender Druck ist gut, schnelle Anstiege oder extreme Wechsel sind schlechter.'
    },
    {
      title: 'Licht & Wind',
      value: `${weather?.cloudCover ?? '--'}% Wolken`,
      text: isBarsch
        ? 'Sichtjäger: klare bis leicht trübe Bedingungen und gutes Licht aktiv befischen.'
        : isHecht
        ? weather?.cloudCover > 60 && weather?.windSpeed > 10
          ? 'Wolken plus Wind auf Ufer: flache Kanten, Kraut und Einläufe priorisieren.'
          : 'Bei Sonne und wenig Wind tiefer, schattiger und natürlicher fischen.'
        : conditions?.tageszeit === 'dämmerung' || conditions?.tageszeit === 'nacht'
          ? 'Restlicht nutzen: Uferkanten, Spundwände und flachere Jagdzonen abwerfen.'
          : 'Tagsüber tiefer, schattiger und langsamer am Grund arbeiten.',
      info: isBarsch
        ? 'Barsch Modul C kombiniert Lichtqualität, UV, Sichttiefe und Dämmerung. Klares, diffuses Licht ist ideal.'
        : isHecht
        ? 'Licht und Wind werden kombiniert. Wolken und Wind auf die Uferkante geben Hechten Deckung und drücken Beutefische in Reichweite.'
        : 'Beim Zander zählen Restlicht, Nachtfenster, Mond/Solunar und kontrollierbarer Wind besonders stark.'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {legalClosed && (
        <div className="card bg-red-500/10 border-red-500/30">
          <h3 className="text-red-400 text-sm font-black uppercase tracking-widest mb-2">Schonzeit aktiv</h3>
          <p className="text-slate-200 text-sm leading-relaxed">
            Der biologische Score bleibt sichtbar. Nutze die Ansicht während Schonzeit nur zur Analyse, nicht zur gezielten Angelei.
          </p>
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div>
            <h3 className="text-white font-black text-xl">{fishLabel}-Taktik</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
              Score {scoreDetails?.total ?? '--'} / Rating {scoreDetails?.rating ?? '--'}
              <InfoTooltip text="Score ist die Gesamtbewertung von 0 bis 100. Rating ist die kurze Einordnung des Scores, zum Beispiel Gut oder Sehr Gut." align="left" />
            </p>
          </div>
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-lg text-[10px] font-bold uppercase inline-flex items-center gap-1">
            +/-{scoreDetails?.confidence ?? 8}
            <InfoTooltip text="Konfidenzbereich. +/-8 bedeutet, dass der echte Zustand grob acht Scorepunkte nach oben oder unten abweichen kann." />
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase font-bold flex items-center gap-1 mb-1">
              Prime Window
              <InfoTooltip text="Bestes Zeitfenster laut Score. Kenterpunkt plus 90 min bedeutet: vom Strömungswechsel bis ungefähr 90 Minuten danach." align="left" />
            </span>
            <span className="text-slate-100 font-black">{scoreDetails?.primeWindow ?? 'nächste Dämmerung'}</span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase font-bold flex items-center gap-1 mb-1">
              Hotspot
              <InfoTooltip text="Empfohlener Bereichstyp für die aktuellen Bedingungen, zum Beispiel Krautkante, Einlauf, Buhnenkopf oder windgedrücktes Ufer." />
            </span>
            <span className="text-slate-100 font-black">{scoreDetails?.hotspot ?? (isHecht ? 'Krautkante' : 'Strömungskante')}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rules.map(rule => (
          <div key={rule.title} className="card">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-white font-black flex items-center gap-1">
                {rule.title}
                <InfoTooltip text={rule.info} align="left" />
              </h4>
              <span className="text-blue-400 text-xs font-bold">{rule.value}</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{rule.text}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm px-1">Köder</h3>
        {koder.map(item => (
          <div key={`${item.priorität}-${item.name}`} className="card">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h4 className="text-white font-black flex items-center gap-1">
                  {item.name}
                  <InfoTooltip text={item.warum} align="left" />
                </h4>
                <p className="text-slate-400 text-xs mt-1">{item.größe} / {item.gewicht}</p>
              </div>
              <span className="text-[10px] bg-slate-950/60 border border-slate-700 rounded-lg px-2 py-1 text-slate-300">
                #{item.priorität}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-bold flex items-center gap-1">
                  Farbe
                  <InfoTooltip text="Farbempfehlung nach Licht, Trübung und Sichtbarkeit. Auffällig bei Wolken/Trübung, natürlicher bei klarem Wasser." align="left" />
                </span>
                <span className="text-slate-100 font-bold">{item.farbe}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-bold flex items-center gap-1">
                  Wann
                  <InfoTooltip text="Situation, in der der Köder am besten zum aktuellen Score-Modul passt." />
                </span>
                <span className="text-slate-100 font-bold">{item.wann}</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">{item.technik}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HechtTaktikView;
