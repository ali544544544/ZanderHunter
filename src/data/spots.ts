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
    jahreszeitBonus: { frühling: 10, sommer: 5, herbst: 15, winter: 5 }
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
    jahreszeitBonus: { frühling: 15, sommer: 10, herbst: 10, winter: 5 }
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
    jahreszeitBonus: { frühling: 8, sommer: 5, herbst: 12, winter: 10 }
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
    jahreszeitBonus: { frühling: 12, sommer: 15, herbst: 8, winter: 0 }
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
    jahreszeitBonus: { frühling: 5, sommer: 8, herbst: 12, winter: 3 }
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
    jahreszeitBonus: { frühling: 15, sommer: 8, herbst: 20, winter: 10 }
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
    jahreszeitBonus: { frühling: 8, sommer: 12, herbst: 8, winter: 8 }
  }
];

export function getSeason(date: Date): 'frühling' | 'sommer' | 'herbst' | 'winter' {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'frühling';
  if (month >= 5 && month <= 7) return 'sommer';
  if (month >= 8 && month <= 10) return 'herbst';
  return 'winter';
}

export function calculateSpotScore(spot: Spot, conditions: any) {
  let score = 50;
  if (spot.bestePhase === 'alle') score += 10;
  else if (spot.bestePhase === conditions.stromPhase) score += 25;
  else score -= 10;
  
  if (conditions.windSpeed > spot.windtoleranz) score -= 30;
  else if (conditions.windSpeed < spot.windtoleranz * 0.5) score += 5;
  
  if (spot.trübungsPräferenz === 'alle') score += 5;
  else if (spot.trübungsPräferenz === conditions.trübung) score += 15;
  else score -= 5;
  
  if (conditions.wasserTemp < spot.temperaturMin) score -= 20;
  
  const season = getSeason(new Date());
  score += spot.jahreszeitBonus[season];
  
  return Math.max(0, Math.min(100, score));
}
