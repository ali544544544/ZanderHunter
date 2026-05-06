import { getLocalConditions } from '../utils/calculations';
import type { TargetFish, HechtScoreDetails } from '../utils/calculations';

export interface KoderEmpfehlung {
  priorität: number;
  name: string;
  größe: string;
  farbe: string;
  gewicht: string;
  technik: string;
  wann: string;
  warum: string;
}

export function getKoderEmpfehlung(conditions: any, targetFish: TargetFish = 'zander'): KoderEmpfehlung[] {
  if (targetFish === 'hecht') {
    return getHechtKoderEmpfehlung(conditions);
  }
  if (targetFish === 'barsch') {
    return getBarschKoderEmpfehlung();
  }

  const empfehlungen: KoderEmpfehlung[] = [];
  
  let shadFarbe = 'Weiß/Pearl';
  if (conditions.trübung === 'getrübt') shadFarbe = 'Chartreuse oder Orange';
  if (conditions.trübung === 'klar') shadFarbe = 'Naturfarben (Silber, Blau)';
  
  const shadGewicht = conditions.tiefe && conditions.tiefe > 6 ? '21–28g' : (conditions.tiefe && conditions.tiefe > 4 ? '14–21g' : '10–14g');

  empfehlungen.push({
    priorität: 1,
    name: 'Gummifisch Shad',
    größe: conditions.wasserTemp < 8 ? '6–8 cm' : '10–14 cm',
    farbe: shadFarbe,
    gewicht: shadGewicht,
    technik: 'Langsam am Grund, Lift-and-Drop, 3–5 Sek. Pause',
    wann: 'Immer als Erstköder',
    warum: 'Universell, imitiert Weißfisch-Silhouette'
  });

  if (conditions.stromStärke < 2) {
    empfehlungen.push({
      priorität: 2,
      name: 'Drop-Shot-Rig',
      größe: '7–9 cm Kunstwurm',
      farbe: conditions.trübung === 'klar' ? 'Natural/Smoke' : 'Weiß/Gelb',
      gewicht: '10–15g Blei unten',
      technik: 'Kaum bewegen, an Kante halten',
      wann: 'Kenter-/Stillwasser, Spundwände',
      warum: 'Ideal wenn Fisch träge'
    });
  }

  if (conditions.trübung === 'getrübt') {
    empfehlungen.push({
      priorität: 2,
      name: 'Twister mit Rattle',
      größe: '10–12 cm',
      farbe: 'Orange, Pink oder Gelb',
      gewicht: '14–21g Jigkopf',
      technik: 'Unregelmäßige Führung, Rattle als Lockreiz',
      wann: '> 20mm Regen letzte 48h',
      warum: 'Zander orten über Seitenlinie'
    });
  }

  if (conditions.isDämmerung || conditions.isNacht) {
    empfehlungen.push({
      priorität: 3,
      name: 'Wobbler (Tief, 3–5m)',
      größe: '9–12 cm, schlankes Profil',
      farbe: 'Silber/Blau oder Firetiger',
      gewicht: '15–25g (Eigengewicht)',
      technik: 'Am Stromstrich, langsame Kurbelung mit Stopp',
      wann: 'Dämmerung und erste Nachtstunden',
      warum: 'Deckt Fläche ab bei wenig Licht'
    });
  }

  return empfehlungen.sort((a, b) => a.priorität - b.priorität);
}

function getHechtKoderEmpfehlung(conditions: any): KoderEmpfehlung[] {
  const farbe = conditions?.cloudCover > 60 || conditions?.trübung === 'getrübt'
    ? 'Firetiger / UV-Chartreuse'
    : 'Barsch, Rotauge oder Hechtdekor';
  const kalt = conditions?.wasserTemp < 8;

  return [
    {
      priorität: 1,
      name: kalt ? 'Suspending Jerkbait' : 'Großer Swimbait',
      größe: kalt ? '10-13 cm' : '15-20 cm',
      farbe,
      gewicht: '20-45g',
      technik: kalt ? 'Lange Pausen, kurze Twitches, im Sichtfeld stehen lassen' : 'Langsam gleichmäßig über Krautkanten führen',
      wann: kalt ? 'Kaltwasser und hoher Druck' : 'Aktive Suchköder-Phase',
      warum: 'Hecht reagiert stark auf große Silhouette und Richtungswechsel'
    },
    {
      priorität: 2,
      name: 'Spinnerbait',
      größe: '14-18 cm Trailer',
      farbe: conditions?.cloudCover > 60 ? 'Chartreuse/Weiß' : 'Natural/Silber',
      gewicht: '18-28g',
      technik: 'An Krautkanten, Einläufen und windgedrückten Ufern durchkurbeln',
      wann: 'Wind, Wolken und flacheres Wasser',
      warum: 'Vibration und Flash bleiben auch bei Trübung gut sichtbar'
    },
    {
      priorität: 3,
      name: 'Flach laufender Wobbler',
      größe: '12-16 cm',
      farbe,
      gewicht: 'schwebend / slow floating',
      technik: 'Stop-and-go in der Dämmerung, Pausen direkt an Struktur',
      wann: 'Prime Window und Ufernähe',
      warum: 'Imitiert angeschlagenen Beutefisch in der Attackzone'
    }
  ];
}

function getBarschKoderEmpfehlung(): KoderEmpfehlung[] {
  return [
    {
      priorität: 1,
      name: 'Twister / Gummifisch',
      größe: '6-8 cm',
      farbe: 'Motoroil, Firetiger oder UV-Chartreuse',
      gewicht: '7-10g Jigkopf',
      technik: 'Faulenzen: 5 Sprünge, 2 Sek. Pause, Grundkontakt halten',
      wann: 'Sommer aktiv, Hafen/Spundwand, Score >70',
      warum: 'Sucht aktive Trupps schnell ab und triggert Futterneid'
    },
    {
      priorität: 2,
      name: 'Dropshot-Wurm',
      größe: '5-6 cm',
      farbe: 'UV-Chartreuse, Braun/Rot oder Watermelon',
      gewicht: '5-10g Blei',
      technik: 'Minimal zittern lassen, 5-10 Sek. auf der Stelle halten',
      wann: 'Wenn Jiggen nicht läuft, Winter oder klare Kanäle',
      warum: 'Finesse-Option für träge oder vorsichtige Barsche'
    },
    {
      priorität: 3,
      name: 'Spinmad / Jigspinner',
      größe: '5-7g',
      farbe: 'Silber/Firetiger',
      gewicht: '5-7g',
      technik: 'Zügig kurbeln, kurze Stopps an Struktur',
      wann: 'Trübe Elbe oder wenn Druckwellen gefragt sind',
      warum: 'Kompakter Suchköder mit Flash und Vibration'
    }
  ];
}

export function generateBriefing(conditions: any, topSpot: any, koder: KoderEmpfehlung[], targetFish: TargetFish = 'zander', scoreDetails?: HechtScoreDetails | null): string {
  if (targetFish === 'barsch') {
    const parts: string[] = [];
    parts.push(`Barsch-Score ${scoreDetails?.total ?? '--'} mit ${scoreDetails?.rating ?? 'Live'}-Rating.`);
    parts.push(`Prime Window: ${scoreDetails?.primeWindow ?? 'Struktur-Hopping'}.`);
    parts.push(`Taktik: ${scoreDetails?.topTactic ?? koder[0]?.technik}.`);
    parts.push(`Hotspot: ${scoreDetails?.hotspot ?? topSpot?.name ?? 'Spundwand oder Steinpackung'}.`);
    parts.push('Nach dem ersten Barsch sofort gleiche Stelle weiterbefischen: Futterneid nutzen.');
    return parts.join(' ');
  }

  if (targetFish === 'hecht') {
    const parts: string[] = [];
    parts.push(`Hecht-Score ${scoreDetails?.total ?? '--'} mit ${scoreDetails?.rating ?? 'Live'}-Rating.`);
    if (scoreDetails?.legal.schonzeitAktiv) {
      parts.push(scoreDetails.legal.hinweis);
    }
    parts.push(`Prime Window: ${scoreDetails?.primeWindow ?? 'nächste Dämmerung'}.`);
    parts.push(`Taktik: ${scoreDetails?.topTactic ?? koder[0]?.technik}.`);
    parts.push(`Hotspot: ${scoreDetails?.hotspot ?? topSpot?.name ?? 'Krautkante oder Einlauf'}.`);
    if (conditions?.luftdruckTrend === 'fallend') parts.push('Fallender Druck wirkt als Aktivitäts-Trigger.');
    if (conditions?.cloudCover > 60 && conditions?.windSpeed > 10) parts.push('Wolken plus Wind geben Deckung im Flachwasser.');
    return parts.join(' ');
  }

  const parts: string[] = [];
  if (scoreDetails) {
    parts.push(`Zander-Score ${scoreDetails.total} mit ${scoreDetails.rating}-Rating.`);
    if (scoreDetails.legal.schonzeitAktiv) parts.push(scoreDetails.legal.hinweis);
    parts.push(`Prime Window: ${scoreDetails.primeWindow}.`);
    parts.push(`Taktik: ${scoreDetails.topTactic}.`);
    parts.push(`Hotspot: ${scoreDetails.hotspot}.`);
  }
  
  if (conditions.stromPhase === 'ablauf')
    parts.push('Ablaufwasser läuft — Zander stehen aktiv im Strömungsschatten.');
  else if (conditions.stromPhase === 'kenter')
    parts.push('Kenterwasser: kurzes, starkes Fenster — sofort losfahren.');
  
  if (conditions.luftdruckTrend === 'fallend')
    parts.push('Fallender Luftdruck aktiviert die Fische.');
  
  if (conditions.solunarStatus === 'major')
    parts.push('Solunar-Hauptfenster — Beißzeit.');
    
  if (topSpot) {
    parts.push(`Bester Spot: ${topSpot.name}.`);
  }
  
  if (koder && koder.length > 0) {
    parts.push(`Greif zu ${koder[0].name} in ${koder[0].farbe} — ${koder[0].technik}.`);
  }
  
  return parts.join(' ');
}

export function generateDynamicSpotAdvice(spot: any, conditions: any, targetFish: TargetFish = 'zander') {
  const local = getLocalConditions(spot, conditions);
  const isUserSpot = spot.id.startsWith('user-');

  if (targetFish === 'barsch') {
    return {
      taktik: 'Struktur-Hopping: Spundwand, Poller und Kanten alle 5-10m abwerfen. Nach Kontakt sofort nachlegen.',
      koderTipp: conditions?.trübung === 'getrübt' ? 'Spinmad/Firetiger oder UV-Shad' : 'Motoroil-Twister oder Dropshot-Wurm',
      bestePhase: local.stromPhase === 'auflauf' ? 'Auflaufend früh' : 'Struktur + Dämmerung',
      tideOffset: local.tideOffset
    };
  }

  if (targetFish === 'hecht') {
    const hasStructure = spot.struktur.some((s: string) => /buhne|kraut|röhricht|einlauf|kante/i.test(s));
    return {
      taktik: hasStructure
        ? 'Struktur eng abwerfen: große Köder parallel zur Kante führen, an Hindernissen lange Pausen setzen.'
        : 'Suchköder einsetzen und Strecke machen. Bei Kontakt sofort langsamer und größer nachfischen.',
      koderTipp: conditions?.cloudCover > 60 ? 'Spinnerbait oder Firetiger-Jerkbait' : 'Natürlicher Swimbait in Barsch/Rotauge',
      bestePhase: local.stromPhase === 'kenter' ? 'Kenter + 90 min' : 'Windkante / Dämmerung',
      tideOffset: local.tideOffset
    };
  }
  
  // Logic for dynamic advice
  let taktik = '';
  let koderTipp = '';
  const bestePhase = spot.type === 'hafen' || spot.type === 'kanal' ? 'Alle Phasen' : 'Ablauf / Kenter';

  if (!isUserSpot) return { 
    taktik: spot.taktik, 
    koderTipp: spot.koderTipp, 
    bestePhase: spot.bestePhase,
    tideOffset: local.tideOffset 
  };

  // Taktik based on Tide & Type & Solunar
  if (spot.type === 'hafen') {
    taktik = `Vertikalangeln an Spundwänden. ${local.solunar === 'major' ? 'Beißzeit-Peak!' : 'Geduld haben.'}`;
  } else if (local.stromPhase === 'ablauf') {
    taktik = 'Stromauf werfen und den Köder mit der Strömung in die Buhne führen. Die Bisse kommen oft hart.';
  } else if (local.stromPhase === 'auflauf') {
    taktik = 'In den Strömungskanten fischen. Nutze schwerere Jigs für stabilen Grundkontakt.';
  } else {
    taktik = 'Kenterwasser-Fokus! Zander ziehen jetzt oft flacher zum Jagen. Konzentriere dich auf die Kanten.';
  }

  // Lure based on Turbidity & Temp & Type
  if (conditions.trübung === 'getrübt') {
    koderTipp = 'Schockfarben (UV-Chartreuse/Pink)';
  } else if (spot.type === 'hafen') {
    koderTipp = 'Dunkle Farben (Braun/Schwarz) oder Natur-Dekore';
  } else {
    koderTipp = conditions.wasserTemp < 10 ? 'Zander-Peitsche & Naturfarben' : 'Action-Shads (10-12cm)';
  }

  return { taktik, koderTipp, bestePhase, tideOffset: local.tideOffset };
}
