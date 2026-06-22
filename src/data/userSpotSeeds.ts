import type { Spot } from './spots';

export const HOOPTE_ZOLLENSPIEKER_SPOT_ID = 'user-hoopte-zollenspieker';

export const HOOPTE_ZOLLENSPIEKER_SPOT: Spot = {
  id: HOOPTE_ZOLLENSPIEKER_SPOT_ID,
  name: 'Elbe Hoopte / Zollenspieker',
  beschreibung: '',
  lat: 53.396611,
  lng: 10.221192,
  tiefe: '4-8 m',
  bestePhase: 'kenter',
  windtoleranz: 35,
  bootNötig: false,
  uferAngling: true,
  struktur: ['Tidekante', 'Steinpackung', 'Hauptstrom', 'Ablaufkante'],
  trübungsPräferenz: 'getrübt',
  temperaturMin: 5,
  jahreszeitBonus: { frühling: 10, sommer: 6, herbst: 16, winter: 7 },
  taktik: '30 min vor Hochwasser am Platz sein. Topfenster: Hochwasser bis 2 Stunden danach, vor allem bei klar fallendem Wasser.',
  koderTipp: 'Schlanke Shads 10-14 cm in Motoroil, UV-Chartreuse oder dunklem Gruen; Jiggewicht an Stroemung anpassen.',
  type: 'elbe',
  isWindExposed: true,
};
