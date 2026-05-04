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
      name: kalt ? 'Suspending Jerkbait' : 'Grosser Swimbait',
      größe: kalt ? '10-13 cm' : '15-20 cm',
      farbe,
      gewicht: '20-45g',
      technik: kalt ? 'Lange Pausen, kurze Twitches, im Sichtfeld stehen lassen' : 'Langsam gleichmaessig ueber Krautkanten fuehren',
      wann: kalt ? 'Kaltwasser und hoher Druck' : 'Aktive Suchkoeder-Phase',
      warum: 'Hecht reagiert stark auf grosse Silhouette und Richtungswechsel'
    },
    {
      priorität: 2,
      name: 'Spinnerbait',
      größe: '14-18 cm Trailer',
      farbe: conditions?.cloudCover > 60 ? 'Chartreuse/Weiss' : 'Natural/Silber',
      gewicht: '18-28g',
      technik: 'An Krautkanten, Einlaeufen und windgedrueckten Ufern durchkurbeln',
      wann: 'Wind, Wolken und flacheres Wasser',
      warum: 'Vibration und Flash bleiben auch bei Truebung gut sichtbar'
    },
    {
      priorität: 3,
      name: 'Flach laufender Wobbler',
      größe: '12-16 cm',
      farbe,
      gewicht: 'schwebend / slow floating',
      technik: 'Stop-and-go in der Daemmerung, Pausen direkt an Struktur',
      wann: 'Prime Window und Ufernaehe',
      warum: 'Imitiert angeschlagenen Beutefisch in der Attackzone'
    }
  ];
}

export function generateBriefing(conditions: any, topSpot: any, koder: KoderEmpfehlung[], targetFish: TargetFish = 'zander', scoreDetails?: HechtScoreDetails | null): string {
  if (targetFish === 'hecht') {
    const parts: string[] = [];
    parts.push(`Hecht-Score ${scoreDetails?.total ?? '--'} mit ${scoreDetails?.rating ?? 'Live'}-Rating.`);
    if (scoreDetails?.legal.schonzeitAktiv) {
      parts.push(scoreDetails.legal.hinweis);
    }
    parts.push(`Prime Window: ${scoreDetails?.primeWindow ?? 'naechste Daemmerung'}.`);
    parts.push(`Taktik: ${scoreDetails?.topTactic ?? koder[0]?.technik}.`);
    parts.push(`Hotspot: ${scoreDetails?.hotspot ?? topSpot?.name ?? 'Krautkante oder Einlauf'}.`);
    if (conditions?.luftdruckTrend === 'fallend') parts.push('Fallender Druck wirkt als Aktivitaets-Trigger.');
    if (conditions?.cloudCover > 60 && conditions?.windSpeed > 10) parts.push('Wolken plus Wind geben Deckung im Flachwasser.');
    return parts.join(' ');
  }

  const parts: string[] = [];
  
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

  if (targetFish === 'hecht') {
    const hasStructure = spot.struktur.some((s: string) => /buhne|kraut|röhricht|einlauf|kante/i.test(s));
    return {
      taktik: hasStructure
        ? 'Struktur eng abwerfen: grosse Koeder parallel zur Kante fuehren, an Hindernissen lange Pausen setzen.'
        : 'Suchkoeder einsetzen und Strecke machen. Bei Kontakt sofort langsamer und groesser nachfischen.',
      koderTipp: conditions?.cloudCover > 60 ? 'Spinnerbait oder Firetiger-Jerkbait' : 'Natuerlicher Swimbait in Barsch/Rotauge',
      bestePhase: local.stromPhase === 'kenter' ? 'Kenter + 90 min' : 'Windkante / Daemmerung',
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
