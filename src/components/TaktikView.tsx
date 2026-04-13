import React, { useState } from 'react';
import { KoderEmpfehlung } from '../data/koderLogik';

interface TaktikViewProps {
  conditions: any;
  weather: any;
  koder: KoderEmpfehlung[];
  score: number;
}

// ---- Dynamic helper functions ----

function getFührungsTipps(conditions: any): { title: string; text: string; icon: string }[] {
  const tipps: { title: string; text: string; icon: string }[] = [];

  // Strömungsbasierte Führung
  if (conditions?.stromPhase === 'ablauf') {
    tipps.push({
      title: 'Ablauf-Führung',
      text: 'Stromauf werfen und den Köder kontrolliert mit der Strömung über den Grund führen. Leichte Sprünge, 2-3 Sek. Grundkontakt. Die Strömung gibt dem Shad zusätzliche Aktion.',
      icon: '🌊'
    });
  } else if (conditions?.stromPhase === 'auflauf') {
    tipps.push({
      title: 'Auflauf-Führung',
      text: 'Gegen die aufkommende Strömung fischen. Schwerere Jigköpfe verwenden (+3-5g), damit der Köder am Grund bleibt. Langsam und bodenorientiert führen.',
      icon: '🌊'
    });
  } else if (conditions?.stromPhase === 'kenter') {
    tipps.push({
      title: 'Kenter-Technik',
      text: 'Bei Stillwasser vertikal oder Faulenzermethode einsetzen. Der Köder muss sich fast von alleine bewegen — oft reichen minimale Zupfer.',
      icon: '⚓'
    });
  }

  // Temperaturbasierte Führung
  if (conditions?.wasserTemp < 8) {
    tipps.push({
      title: 'Kaltwasser-Strategie',
      text: 'Zander sind jetzt extrem lethargisch. Ultra-langsame Führung! Absinkphasen auf 5-8 Sekunden verlängern. Köder fast tot am Grund liegen lassen und nur minimal zucken.',
      icon: '🥶'
    });
  } else if (conditions?.wasserTemp >= 8 && conditions?.wasserTemp < 12) {
    tipps.push({
      title: 'Übergangs-Führung',
      text: 'Moderate Speed, klassische Faulenzermethode: 2-3 Kurbelumdrehungen, dann fallen lassen. Absinkphase ca. 3-4 Sekunden.',
      icon: '🌡️'
    });
  } else if (conditions?.wasserTemp >= 12 && conditions?.wasserTemp <= 18) {
    tipps.push({
      title: 'Optimal-Temperatur',
      text: 'Zander sind in ihrer Komfortzone! Aktive Führung möglich — Jiggen, Faulenzen, Cranken. Auch aggressivere Twitch-Pausen funktionieren.',
      icon: '🔥'
    });
  } else if (conditions?.wasserTemp > 18) {
    tipps.push({
      title: 'Warmwasser-Taktik',
      text: 'Sauerstoffarme Phasen! Zander stehen an strömungsreichen Stellen mit mehr O₂. Morgens und abends fischen, tiefe Rinnen bevorzugen.',
      icon: '☀️'
    });
  }

  return tipps;
}

function getSpotTipps(conditions: any): { title: string; text: string; icon: string }[] {
  const tipps: { title: string; text: string; icon: string }[] = [];

  // Trübungsbasierte Spotempfehlung
  if (conditions?.trübung === 'getrübt') {
    tipps.push({
      title: 'Getrübtes Wasser',
      text: 'Zander jagen jetzt aggressiver und stehen auch am Rand an flacheren Kanten. Ufernahe Einläufe und Spundwände sind Top-Spots. Lautstärkere Köder (Rattle, Spinner) einsetzen.',
      icon: '🌫️'
    });
  } else if (conditions?.trübung === 'klar') {
    tipps.push({
      title: 'Klares Wasser',
      text: 'Zander sind scheu! Tiefere Bereiche (>4m) und Schattenstellen anwerfen. Feine Vorfächer (Fluorocarbon 0.30-0.35mm), natürliche Farben und weniger Aktion.',
      icon: '💎'
    });
  } else {
    tipps.push({
      title: 'Mittlere Sicht',
      text: 'Ideale Bedingungen. Sowohl Kanten als auch flachere Übergänge abfischen. Standard-Shads in Weiß oder Perl mit moderater Führung.',
      icon: '👁️'
    });
  }

  return tipps;
}

function getMontageEmpfehlung(conditions: any): { name: string; beschreibung: string; wann: string; icon: string }[] {
  const montagen: { name: string; beschreibung: string; wann: string; icon: string }[] = [];

  montagen.push({
    name: 'Jig-Kopf Klassik',
    beschreibung: 'Standardmontage. Jigkopf direkt auf Shad. Rundkopf für Strömung, Erie-Kopf für wenig Strömung. Hake nach oben ausrichten.',
    wann: 'Universell — immer die erste Wahl',
    icon: '🎣'
  });

  if (conditions?.stromPhase === 'kenter' || conditions?.stromPhase === 'stagnation') {
    montagen.push({
      name: 'Drop-Shot',
      beschreibung: 'Köder schwebt über Grund, Blei unten am System. Minimal bewegen, zittern lassen. Ideal an Kanten und Spundwänden.',
      wann: 'Bei Stillwasser / Kenterphasen',
      icon: '📐'
    });
  }

  if (conditions?.trübung === 'getrübt' || conditions?.niederschlag48h > 15) {
    montagen.push({
      name: 'Spinner-Rig',
      beschreibung: 'Kleines Spinnerblatt vor dem Shad für extra Vibration und Blitz. Zander orten über Seitenlinie, das Blatt erzeugt maximale Druckwellen.',
      wann: 'Bei trübem Wasser / nach Regen',
      icon: '💫'
    });
  }

  if (conditions?.tageszeit === 'nacht' || conditions?.tageszeit === 'dämmerung') {
    montagen.push({
      name: 'Fireball-Rig',
      beschreibung: 'Auftriebskörper hebt den Köder über die Steinpackung. Am Ufer per Pose treiben lassen oder langsam einkurbeln. Fängt passive Fische.',
      wann: 'Nachts an Steinpackungen',
      icon: '🔴'
    });
  }

  montagen.push({
    name: 'Texas-Rig',
    beschreibung: 'Hakenspitze im Köder verborgen, Bullet-Blei vorneweg. Perfekt für steinige/verhagte Stellen ohne Hänger.',
    wann: 'An hindernisreichen Spots',
    icon: '🤠'
  });

  return montagen;
}

function getTimingAdvice(conditions: any, weather: any): string {
  const parts: string[] = [];

  if (conditions?.tageszeit === 'dämmerung') {
    parts.push('🔥 Du bist in der Prime-Time! Dämmerung ist statistisch die beste Beißzeit für Zander.');
  } else if (conditions?.tageszeit === 'nacht') {
    parts.push('🌙 Nachtphase — Zander jagen jetzt in flacheren Bereichen. Ufernahe große Shads (12-14cm) ultra-langsam führen.');
  } else {
    parts.push('☀️ Tagphase — Zander stehen tiefer und sind passiver. Tiefe Rinnen und schattige Kanten fokussieren.');
  }

  if (conditions?.solunar === 'major') {
    parts.push('⭐ SOLUNAR MAJOR — Erhöhte Fressaktivität! Mond-Transit sorgt für bewegtere Beutefische.');
  } else if (conditions?.solunar === 'minor') {
    parts.push('☽ Solunar Minor — Ein kleineres Beißfenster, aber merkbar. Bleib am Wasser!');
  }

  if (weather?.windSpeed > 20) {
    parts.push('💨 Starker Wind — Köderkontrolle wird schwierig. Auf schwere Jigs wechseln (+5g) und kürzere Würfe machen.');
  } else if (weather?.windSpeed > 10) {
    parts.push('🍃 Leichter Wind raut die Oberfläche auf — das gibt Deckung für jagende Zander. Gut!');
  }

  return parts.join('\n');
}

function getGearChecklist(conditions: any): { item: string; detail: string; wichtig: boolean }[] {
  const items: { item: string; detail: string; wichtig: boolean }[] = [];

  // Vorfach
  items.push({
    item: 'Vorfach',
    detail: conditions?.trübung === 'klar'
      ? 'Fluorocarbon 0.30mm — unsichtbar im klaren Wasser'
      : 'Fluorocarbon 0.35-0.40mm oder dünnes Stahl',
    wichtig: true
  });

  // Schnur
  items.push({
    item: 'Geflochtene',
    detail: conditions?.wasserTemp < 10
      ? '0.08-0.10mm — maximale Bisserkennung in der kalten Phase'
      : '0.10-0.13mm — Standard',
    wichtig: false
  });

  // Jigkopf-Gewicht
  const baseWeight = conditions?.stromPhase === 'ablauf' || conditions?.stromPhase === 'auflauf' ? 14 : 10;
  const windExtra = (conditions?.windSpeed || 0) > 15 ? 5 : 0;
  const totalWeight = baseWeight + windExtra;
  items.push({
    item: 'Jigkopf',
    detail: `${totalWeight}-${totalWeight + 7}g — ${conditions?.stromPhase === 'ablauf' ? 'Strömung braucht Gewicht' : 'leicht reicht'}${windExtra > 0 ? ', +5g wegen Wind' : ''}`,
    wichtig: true
  });

  // Hakengröße
  items.push({
    item: 'Haken',
    detail: conditions?.wasserTemp < 8 ? 'Gr. 2-4 (kleiner Köder)' : 'Gr. 1-2/0 (Standard-Shad)',
    wichtig: false
  });

  return items;
}

function getProTipps(conditions: any): { text: string; icon: string }[] {
  const tipps: { text: string; icon: string }[] = [];

  tipps.push({
    text: 'Biss-Erkennung: Zander-Bisse fühlen sich oft wie ein weiches "Tock" an oder als würde der Köder am Grund hängenbleiben. Im Zweifelsfall — IMMER anschlagen!',
    icon: '🎯'
  });

  tipps.push({
    text: 'Grundkontakt halten! Der Jigkopf muss regelmäßig den Grund berühren ("ticken"). Kein Grundkontakt = kein Zander.',
    icon: '⬇️'
  });

  if (conditions?.wasserTemp < 10) {
    tipps.push({
      text: 'Bei kaltem Wasser: Weniger ist mehr. Manche Zander stehen stundenlang an einer Stelle. Bleib länger an guten Spots statt viel zu laufen.',
      icon: '⏳'
    });
  }

  if (conditions?.stromPhase === 'ablauf') {
    tipps.push({
      text: 'Beim Ablauf sammeln sich Beutefische an Strömungskanten und Buhnenköpfen. Da stehen die Zander in einer Reihe — systematisch abfischen!',
      icon: '🐟'
    });
  }

  if (conditions?.tageszeit === 'dämmerung' || conditions?.tageszeit === 'nacht') {
    tipps.push({
      text: 'Nachts/bei Dämmerung: Helle Köder (Weiß, UV) sind sichtbarer. Langsamer führen als am Tag, der Räuber braucht mehr Zeit zum Zupacken.',
      icon: '🌙'
    });
  }

  tipps.push({
    text: 'Spot-Rotation: Wenn nach 20 Würfen kein Kontakt kommt, Spot wechseln. Zander sind Standräuber — entweder sie sind da oder nicht.',
    icon: '🔄'
  });

  return tipps;
}


// ---- Component ----

const TaktikView: React.FC<TaktikViewProps> = ({ conditions, weather, koder, score }) => {
  const [openSection, setOpenSection] = useState<string | null>('führung');

  const führungsTipps = getFührungsTipps(conditions);
  const spotTipps = getSpotTipps(conditions);
  const montagen = getMontageEmpfehlung(conditions);
  const timingAdvice = getTimingAdvice(conditions, weather);
  const gear = getGearChecklist(conditions);
  const proTipps = getProTipps(conditions);

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  // Score-based urgency message
  const getUrgency = () => {
    if (score >= 75) return { text: 'Perfekte Bedingungen — raus ans Wasser!', color: 'text-angel-green', bg: 'bg-angel-green/10', border: 'border-angel-green/20' };
    if (score >= 55) return { text: 'Gute Chance heute — mit der richtigen Taktik klappt\'s!', color: 'text-angel-light', bg: 'bg-angel-light/10', border: 'border-angel-light/20' };
    if (score >= 40) return { text: 'Zäh, aber machbar — Geduld & Feintuning sind gefragt.', color: 'text-angel-yellow', bg: 'bg-angel-yellow/10', border: 'border-angel-yellow/20' };
    return { text: 'Schwierige Bedingungen — nur für die Hartgesottenen.', color: 'text-angel-red', bg: 'bg-angel-red/10', border: 'border-angel-red/20' };
  };

  const urgency = getUrgency();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">

      {/* Situation Summary */}
      <div className={`card ${urgency.border} border ${urgency.bg} space-y-2`}>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🎯</span>
          <div>
            <h3 className={`font-bold text-sm ${urgency.color}`}>Aktuelle Einschätzung</h3>
            <p className="text-xs text-slate-400">{urgency.text}</p>
          </div>
        </div>
        <div className="bg-slate-950/30 rounded-xl p-3 border border-slate-800/50">
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{timingAdvice}</p>
        </div>
      </div>

      {/* Köder-Empfehlungen (existing) */}
      <div className="space-y-4">
        <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm px-1">Köder-Empfehlungen</h3>
        {koder.map((k, i) => (
          <div key={i} className={`card border-l-4 ${i === 0 ? 'border-l-blue-500' : 'border-l-slate-600'}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-slate-100">{k.name}</h4>
                  <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold">Prio {k.priorität}</span>
                </div>
                <p className="text-xs text-blue-400 font-medium">{k.wann}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Größe & Farbe</span>
                <p className="text-xs text-slate-200">{k.größe} · {k.farbe}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Gewicht / Blei</span>
                <p className="text-xs text-slate-200">{k.gewicht}</p>
              </div>
            </div>
            <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/50">
              <div className="flex items-start space-x-2 text-xs leading-relaxed">
                <span className="text-lg">🎯</span>
                <div>
                  <span className="font-bold text-slate-300 block mb-0.5">Technik:</span>
                  <p className="text-slate-400">{k.technik}</p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-slate-500 italic">
              <strong>Warum:</strong> {k.warum}
            </p>
          </div>
        ))}
      </div>

      {/* Collapsible Sections */}

      {/* Führung & Technik */}
      <div className="card p-0 overflow-hidden">
        <button
          onClick={() => toggleSection('führung')}
          className="w-full flex justify-between items-center p-4 hover:bg-slate-700/20 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">🕹️</span>
            <h3 className="text-slate-300 font-bold text-sm uppercase tracking-wider">Führung & Technik</h3>
          </div>
          <span className={`text-slate-500 transition-transform duration-300 ${openSection === 'führung' ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {openSection === 'führung' && (
          <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {führungsTipps.map((t, i) => (
              <div key={i} className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                <div className="flex items-start space-x-2">
                  <span className="text-lg">{t.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">{t.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{t.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Montagen */}
      <div className="card p-0 overflow-hidden">
        <button
          onClick={() => toggleSection('montagen')}
          className="w-full flex justify-between items-center p-4 hover:bg-slate-700/20 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">🔧</span>
            <h3 className="text-slate-300 font-bold text-sm uppercase tracking-wider">Montagen</h3>
          </div>
          <span className={`text-slate-500 transition-transform duration-300 ${openSection === 'montagen' ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {openSection === 'montagen' && (
          <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {montagen.map((m, i) => (
              <div key={i} className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                <div className="flex items-start space-x-2">
                  <span className="text-lg">{m.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{m.name}</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-1">{m.beschreibung}</p>
                    <span className="text-[10px] text-blue-400 font-bold">{m.wann}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spot-Strategie */}
      <div className="card p-0 overflow-hidden">
        <button
          onClick={() => toggleSection('spots')}
          className="w-full flex justify-between items-center p-4 hover:bg-slate-700/20 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">📍</span>
            <h3 className="text-slate-300 font-bold text-sm uppercase tracking-wider">Spot-Strategie</h3>
          </div>
          <span className={`text-slate-500 transition-transform duration-300 ${openSection === 'spots' ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {openSection === 'spots' && (
          <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {spotTipps.map((t, i) => (
              <div key={i} className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                <div className="flex items-start space-x-2">
                  <span className="text-lg">{t.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">{t.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{t.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gear Checklist */}
      <div className="card p-0 overflow-hidden">
        <button
          onClick={() => toggleSection('gear')}
          className="w-full flex justify-between items-center p-4 hover:bg-slate-700/20 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">🎒</span>
            <h3 className="text-slate-300 font-bold text-sm uppercase tracking-wider">Tackle-Empfehlung</h3>
          </div>
          <span className={`text-slate-500 transition-transform duration-300 ${openSection === 'gear' ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {openSection === 'gear' && (
          <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
            {gear.map((g, i) => (
              <div key={i} className="flex items-center space-x-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${g.wichtig ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">{g.item}</span>
                  <p className="text-xs text-slate-300">{g.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pro-Tipps */}
      <div className="space-y-3">
        <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm px-1">Pro-Tipps</h3>
        {proTipps.map((t, i) => (
          <div key={i} className="card bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-slate-700/30">
            <div className="flex items-start space-x-3">
              <span className="text-xl">{t.icon}</span>
              <p className="text-xs text-slate-300 leading-relaxed">{t.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Reference */}
      <div className="card space-y-3">
        <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm">Schnell-Referenz</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Rute</span>
            <p className="text-xs text-slate-200 font-medium">2.40-2.70m, 10-40g WG</p>
          </div>
          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Rolle</span>
            <p className="text-xs text-slate-200 font-medium">2500-3000er Spinning</p>
          </div>
          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Schnur</span>
            <p className="text-xs text-slate-200 font-medium">Geflochten 0.10mm</p>
          </div>
          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Vorfach</span>
            <p className="text-xs text-slate-200 font-medium">FC 0.35mm, 80cm</p>
          </div>
        </div>
      </div>

      {/* Legal Info */}
      <div className="card bg-amber-950/20 border-amber-800/30">
        <div className="flex items-start space-x-2">
          <span className="text-lg">⚖️</span>
          <div>
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Rechtliches & Ethik</h4>
            <div className="space-y-1 text-[11px] text-slate-400 leading-relaxed">
              <p>• <strong>Schonzeit Zander HH:</strong> 01.02.–31.05.</p>
              <p>• <strong>Mindestmaß:</strong> 45 cm — alles darunter sofort zurücksetzen!</p>
              <p>• <strong>Fischereischein</strong> + Erlaubniskarte immer dabei haben</p>
              <p>• <strong>Catch & Release:</strong> Fisch schonend versorgen, nasses handtuch, Abhakmatte</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TaktikView;
