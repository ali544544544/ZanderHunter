import { getLocalConditions } from '../utils/calculations';
import type { TargetFish } from '../utils/calculations';

export interface Spot {
  id: string;
  name: string;
  beschreibung: string;
  lat: number;
  lng: number;
  tiefe: string;
  bestePhase: 'ablauf' | 'auflauf' | 'kenter' | 'alle';
  windtoleranz: number;
  bootNötig: boolean;
  uferAngling: boolean;
  struktur: string[];
  trübungsPräferenz: 'getrübt' | 'mittel' | 'klar' | 'alle';
  temperaturMin: number;
  jahreszeitBonus: { frühling: number; sommer: number; herbst: number; winter: number };
  taktik: string;
  koderTipp: string;
  type?: 'elbe' | 'hafen' | 'kanal';
  isWindExposed?: boolean;
}

export const SPOTS: Spot[] = [
  {
    id: 'sueedelbe',
    name: 'Süderelbe / Containerterminal',
    beschreibung: 'Starke Tideströmung, Zander hinter Dalben im Strömungsschatten. Bei Ablauf und Kenter sehr aktiv.',
    lat: 53.521, lng: 9.924,
    tiefe: '4–8 m', bestePhase: 'ablauf', windtoleranz: 30,
    bootNötig: true, uferAngling: false,
    struktur: ['Spundwand', 'Dalben', 'Kante'],
    trübungsPräferenz: 'getrübt', temperaturMin: 5,
    jahreszeitBonus: { frühling: 10, sommer: 5, herbst: 15, winter: 5 },
    taktik: 'Köder schräg stromauf werfen und am gestrafften Seil in die Strömungsschatten der Dalben treiben lassen. Vorsicht vor Hängern!',
    koderTipp: 'Große Shads (12-14cm) in UV-Farben oder dunklem Grün.'
  },
  {
    id: 'dove-elbe',
    name: 'Dove-Elbe / Tatenberger Schleuse',
    beschreibung: 'Ruhigeres Nebengewässer, Zander an Böschungskanten. Gut bei Wind auf der Hauptelbe.',
    lat: 53.511, lng: 10.121,
    tiefe: '3–6 m', bestePhase: 'alle', windtoleranz: 50,
    bootNötig: false, uferAngling: true,
    struktur: ['Böschungskante', 'Buhnen', 'Tiefloch'],
    trübungsPräferenz: 'mittel', temperaturMin: 4,
    jahreszeitBonus: { frühling: 15, sommer: 10, herbst: 10, winter: 5 },
    taktik: 'Kanten konsequent abfischen. Besonders an den Übergängen von flach zu tief konzentrieren. Faulenzen mit kurzen Sprüngen.',
    koderTipp: 'Schlanke No-Action Shads in natürlichen Dekoren.'
  },
  {
    id: 'harburger-hafen',
    name: 'Harburger Hafenbecken',
    beschreibung: 'Windgeschütztes Hafenbecken, wenig Strömung. Gut bei schlechtem Wetter. Zander an Kaimauern.',
    lat: 53.457, lng: 9.986,
    tiefe: '3–5 m', bestePhase: 'alle', windtoleranz: 999,
    bootNötig: false, uferAngling: true,
    struktur: ['Kaimauer', 'Spundwand', 'Einlaufrinne'],
    trübungsPräferenz: 'getrübt', temperaturMin: 3,
    jahreszeitBonus: { frühling: 8, sommer: 5, herbst: 12, winter: 10 },
    taktik: 'Vertikalangeln entlang der Kaimauern oder klassisches Jiggen. Köderkontakt zum Boden ist hier entscheidend.',
    koderTipp: 'Leichtere Jigs (7-10g) mit Action-Shads in grellen Farben.'
  },
  {
    id: 'billwerder-bucht',
    name: 'Billwerder Bucht',
    beschreibung: 'Nach Regen trübt dieses Ruhiggewässer ideal ein. Zander jagen Weißfische an Einlaufrinnen.',
    lat: 53.499, lng: 10.078,
    tiefe: '2–4 m', bestePhase: 'alle', windtoleranz: 999,
    bootNötig: false, uferAngling: true,
    struktur: ['Einlaufrinne', 'Flachwasserkante', 'Röhricht-Kante'],
    trübungsPräferenz: 'getrübt', temperaturMin: 8,
    jahreszeitBonus: { frühling: 12, sommer: 15, herbst: 8, winter: 0 },
    taktik: 'An den Einläufen fischen. Bei Trübung stehen die Fische oft flach. Aggressive Führung kann Bisse provozieren.',
    koderTipp: 'Chatterbaits oder Krebshappen am Offset-Haken.'
  },
  {
    id: 'aussenalster',
    name: 'Außenalster — Langer Zug',
    beschreibung: 'Stadtgewässer, gut bei bedecktem Himmel. Zander tief im Mittelbereich, abends an Uferkanten.',
    lat: 53.567, lng: 10.003,
    tiefe: '2–5 m', bestePhase: 'alle', windtoleranz: 20,
    bootNötig: false, uferAngling: true,
    struktur: ['Tiefrinne', 'Uferkante', 'Brücken-Schatten'],
    trübungsPräferenz: 'mittel', temperaturMin: 10,
    jahreszeitBonus: { frühling: 5, sommer: 8, herbst: 12, winter: 3 },
    taktik: 'In der Dämmerung Uferzonen abwerfen. Tagsüber langsame Führung am Grund im tieferen Bereich.',
    koderTipp: 'Wobbler für den Abend, tagsüber Pintails (10cm).'
  },
  {
    id: 'elbe-blankenese',
    name: 'Elbe — Blankenese / Schulau',
    beschreibung: 'Hauptstrom mit starker Tide. Zander hinter Buhnen und in Nebenrinnen. Boot unbedingt nötig.',
    lat: 53.561, lng: 9.789,
    tiefe: '5–12 m', bestePhase: 'kenter', windtoleranz: 25,
    bootNötig: true, uferAngling: false,
    struktur: ['Buhnen', 'Nebenrinne', 'Tiefrinne'],
    trübungsPräferenz: 'alle', temperaturMin: 6,
    jahreszeitBonus: { frühling: 15, sommer: 8, herbst: 20, winter: 10 },
    taktik: 'In den Kehrwässern der Buhnenköpfe fischen. Bei Kenterwasser auf den Kanten zum Hauptstrom suchen.',
    koderTipp: 'Schwere Jigs (20-30g) mit stabilen Gummifischen.'
  },
  {
    id: 'mittelkanal',
    name: 'Mittelkanal / Billbrook',
    beschreibung: 'Industriekanal, wenig Freizeitdruck, guter Zanderbestand. Kein Tide-Einfluss, stabile Bedingungen.',
    lat: 53.519, lng: 10.065,
    tiefe: '3–5 m', bestePhase: 'alle', windtoleranz: 999,
    bootNötig: false, uferAngling: true,
    struktur: ['Kaimauer', 'Einleitungsrohre', 'Unterstand'],
    trübungsPräferenz: 'klar', temperaturMin: 5,
    jahreszeitBonus: { frühling: 8, sommer: 12, herbst: 8, winter: 8 },
    taktik: 'Präzises Werfen unter Brücken und an Rohrauslässe. Viel Strecke machen, da die Fische oft punktuell stehen.',
    koderTipp: 'Natürliche Köderfarben, Schlanke 10cm Gummis.',
    type: 'kanal',
    isWindExposed: false
  }
];

export function getSeason(date: Date): 'frühling' | 'sommer' | 'herbst' | 'winter' {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'frühling';
  if (month >= 5 && month <= 7) return 'sommer';
  if (month >= 8 && month <= 10) return 'herbst';
  return 'winter';
}

export function calculateSpotScore(spot: Spot, conditions: any, date: Date = new Date()) {
  const local = getLocalConditions(spot, conditions, date);
  let score = 50;
  
  // 1. Geographical Tide Logic
  if (spot.bestePhase === 'alle') score += 10;
  else if (spot.bestePhase === local.stromPhase) score += 25;
  else score -= 10;
  
  // 2. Wind Logic (Harbor spots are protected)
  const isProtected = spot.type === 'hafen' || spot.type === 'kanal' || !spot.isWindExposed;
  const windLimit = isProtected ? spot.windtoleranz * 1.5 : spot.windtoleranz;
  
  if (conditions.windSpeed > windLimit) score -= 30;
  else if (conditions.windSpeed < windLimit * 0.5) score += 5;
  
  // 3. Environment & Solunar
  if (spot.trübungsPräferenz === 'alle') score += 5;
  else if (spot.trübungsPräferenz === conditions.trübung) score += 15;
  else score -= 5;
  
  if (local.solunar === 'major') score += 10;
  else if (local.solunar === 'minor') score += 5;

  if (conditions.wasserTemp < spot.temperaturMin) score -= 20;
  
  const season = getSeason(date);
  score += spot.jahreszeitBonus[season];

  // Extra individual variance based on lat/lng (micro-adjustments)
  const variance = (spot.lat * 100 + spot.lng * 100) % 3;
  score += (variance - 1.5); 
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function calculateHechtSpotScore(spot: Spot, conditions: any, date: Date = new Date()) {
  const local = getLocalConditions(spot, conditions, date);
  let score = 45;
  const structures = spot.struktur.join(' ').toLowerCase();

  if (structures.includes('buhnen') || structures.includes('kraut') || structures.includes('röhricht') || structures.includes('einlauf')) score += 18;
  if (structures.includes('kante') || structures.includes('tiefloch') || structures.includes('brücken')) score += 10;
  if (spot.type === 'hafen' || spot.type === 'kanal') score += 8;

  if (local.stromPhase === 'kenter') score += 14;
  else if (local.stromPhase === 'ablauf' || local.stromPhase === 'auflauf') score += 10;

  if (conditions.wasserTemp >= 10 && conditions.wasserTemp <= 16) score += 16;
  else if (conditions.wasserTemp < 4 || conditions.wasserTemp > 25) score -= 18;

  if (conditions.windSpeed > 8 && conditions.windSpeed < 28) score += 10;
  if (conditions.cloudCover > 60) score += 8;
  if (spot.temperaturMin > 8 && conditions.wasserTemp < spot.temperaturMin) score -= 8;

  const isProtected = spot.type === 'hafen' || spot.type === 'kanal' || !spot.isWindExposed;
  if (!isProtected && conditions.windSpeed > spot.windtoleranz) score -= 20;

  const season = getSeason(date);
  score += Math.round(spot.jahreszeitBonus[season] * 0.6);

  return Math.round(Math.max(0, Math.min(100, score)));
}

export function calculateBarschSpotScore(spot: Spot, conditions: any, date: Date = new Date()) {
  const local = getLocalConditions(spot, conditions, date);
  let score = 42;
  const structures = spot.struktur.join(' ').toLowerCase();

  if (structures.includes('spundwand') || structures.includes('kaimauer') || structures.includes('brücke')) score += 22;
  if (structures.includes('stein') || structures.includes('buhne') || structures.includes('kante')) score += 16;
  if (structures.includes('einlauf') || structures.includes('poller') || structures.includes('dalben')) score += 14;
  if (spot.type === 'hafen' || spot.type === 'kanal') score += 10;

  if (local.stromPhase === 'auflauf') score += 18;
  else if (local.stromPhase === 'ablauf') score += 10;
  else if (local.stromPhase === 'kenter') score += 4;

  if (conditions.wasserTemp >= 15 && conditions.wasserTemp <= 22) score += 18;
  else if (conditions.wasserTemp >= 8 && conditions.wasserTemp < 15) score += 8;
  else if (conditions.wasserTemp < 4 || conditions.wasserTemp > 26) score -= 18;

  if (conditions.cloudCover < 40) score += 8;
  if (conditions.trübung === 'klar' || conditions.trübung === 'mittel') score += 8;

  const season = getSeason(date);
  if (season === 'sommer' || season === 'herbst') score += 8;
  if (season === 'winter' && conditions.wasserTemp < 8) score -= 6;

  return Math.round(Math.max(0, Math.min(100, score)));
}

export function calculateSpotScoreForFish(spot: Spot, conditions: any, targetFish: TargetFish, date: Date = new Date()) {
  if (targetFish === 'hecht') return calculateHechtSpotScore(spot, conditions, date);
  if (targetFish === 'barsch') return calculateBarschSpotScore(spot, conditions, date);
  return calculateSpotScore(spot, conditions, date);
}
