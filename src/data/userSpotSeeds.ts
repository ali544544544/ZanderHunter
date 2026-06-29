import type { Spot } from './spots';

export const HOOPTE_ZOLLENSPIEKER_SPOT_ID = 'user-hoopte-zollenspieker';

export const HOOPTE_ZOLLENSPIEKER_COORDINATES = {
  lat: 53.398046,
  lng: 10.17513,
} as const;

export const HOOPTE_ZOLLENSPIEKER_SPOT: Spot = {
  id: HOOPTE_ZOLLENSPIEKER_SPOT_ID,
  name: 'Elbe Hoopte / Zollenspieker',
  beschreibung: 'Elbufer am Zollenspieker Anleger auf Hoehe des Hauptstroms. Ufernaher Spot mit Steinpackung, Krauswasser und kurzer Distanz zur Stromkante.',
  lat: HOOPTE_ZOLLENSPIEKER_COORDINATES.lat,
  lng: HOOPTE_ZOLLENSPIEKER_COORDINATES.lng,
  tiefe: '4-8 m',
  bestePhase: 'kenter',
  windtoleranz: 35,
  bootNötig: false,
  uferAngling: true,
  struktur: ['Tidekante', 'Steinpackung', 'Hauptstrom', 'Faehranleger', 'Kehrwasser'],
  trübungsPräferenz: 'getrübt',
  temperaturMin: 5,
  jahreszeitBonus: { frühling: 10, sommer: 6, herbst: 16, winter: 7 },
  taktik: '30 min vor Kenterwasser am Platz sein und die Steinpackung parallel sowie die Kante zum Hauptstrom abfischen. Topfenster: Hochwasser bis 2 Stunden danach, besonders bei fallendem Wasser.',
  koderTipp: 'Schlanke Shads 10-14 cm in Motoroil, UV-Chartreuse oder dunklem Gruen; Jiggewicht so waehlen, dass der Koeder trotz Tide sauber Grundkontakt haelt.',
  type: 'elbe',
  isWindExposed: true,
};
