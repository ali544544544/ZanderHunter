import type { WaterBodyProfile } from '../types/waterData';
import type { TargetFish } from '../utils/calculations';

export type GermanStateId =
  | 'baden-wuerttemberg'
  | 'bayern'
  | 'berlin'
  | 'brandenburg'
  | 'bremen'
  | 'hamburg'
  | 'hessen'
  | 'mecklenburg-vorpommern'
  | 'niedersachsen'
  | 'nordrhein-westfalen'
  | 'rheinland-pfalz'
  | 'saarland'
  | 'sachsen'
  | 'sachsen-anhalt'
  | 'schleswig-holstein'
  | 'thueringen';

export type WaterRuleScope = 'inland' | 'coastal';

export interface FishRegulationRule {
  minimumCm: number | null;
  maximumCm?: number | null;
  closedSeason?: {
    start: string;
    end: string;
  } | null;
  bagLimit?: number | null;
  note?: string;
}

export interface LocalFishRule extends FishRegulationRule {
  fish: TargetFish;
  fishLabel: string;
  stateId: GermanStateId;
  stateName: string;
  scope: WaterRuleScope;
  sourceLabel: string;
  sourceUrl: string;
  closedNow: boolean;
  closedSeasonText: string;
  sizeText: string;
}

type StateRegulation = {
  id: GermanStateId;
  name: string;
  sourceUrl: string;
  inland: Record<TargetFish, FishRegulationRule>;
  coastal?: Partial<Record<TargetFish, FishRegulationRule>>;
};

const noRule: FishRegulationRule = {
  minimumCm: null,
  closedSeason: null,
};

const fishLabels: Record<TargetFish, string> = {
  zander: 'Zander',
  hecht: 'Hecht',
  barsch: 'Barsch',
};

export const fishRegulations: Record<GermanStateId, StateRegulation> = {
  'baden-wuerttemberg': {
    id: 'baden-wuerttemberg',
    name: 'Baden-Wuerttemberg',
    sourceUrl: 'https://angelmagazin.de/schonzeiten/baden-wuerttemberg/',
    inland: {
      hecht: { minimumCm: 50, closedSeason: { start: '02-15', end: '05-15' } },
      zander: { minimumCm: 45, closedSeason: { start: '04-01', end: '05-15' }, note: 'Im Main gelten abweichend 01.02.-30.04. und 50 cm.' },
      barsch: noRule,
    },
  },
  bayern: {
    id: 'bayern',
    name: 'Bayern',
    sourceUrl: 'https://angelmagazin.de/schonzeiten/bayern/',
    inland: {
      hecht: { minimumCm: 50, closedSeason: { start: '02-15', end: '04-30' } },
      zander: { minimumCm: 50, closedSeason: { start: '02-15', end: '04-30' } },
      barsch: noRule,
    },
  },
  berlin: {
    id: 'berlin',
    name: 'Berlin',
    sourceUrl: 'https://angelmagazin.de/schonzeiten/berlin/',
    inland: {
      hecht: { minimumCm: 45, closedSeason: { start: '01-01', end: '04-30' } },
      zander: { minimumCm: 45, closedSeason: { start: '01-01', end: '05-31' } },
      barsch: noRule,
    },
  },
  brandenburg: {
    id: 'brandenburg',
    name: 'Brandenburg',
    sourceUrl: 'https://angelmagazin.de/schonzeiten/brandenburg/',
    inland: {
      hecht: { minimumCm: 45, closedSeason: { start: '02-01', end: '03-31' } },
      zander: { minimumCm: 45, closedSeason: { start: '04-01', end: '05-31' } },
      barsch: noRule,
    },
  },
  bremen: {
    id: 'bremen',
    name: 'Bremen',
    sourceUrl: 'https://angelmagazin.de/schonzeiten/bremen/',
    inland: {
      hecht: { minimumCm: 60, closedSeason: { start: '02-01', end: '05-15' }, note: 'Waehrend der Raubfisch-Schonzeit sind Spinnfischen, Kunstkoeder, Koederfisch und Fischfetzen untersagt.' },
      zander: { minimumCm: 40, closedSeason: { start: '02-01', end: '05-15' }, note: 'Waehrend der Raubfisch-Schonzeit sind Spinnfischen, Kunstkoeder, Koederfisch und Fischfetzen untersagt.' },
      barsch: { minimumCm: null, closedSeason: { start: '02-01', end: '05-15' }, note: 'Waehrend der Raubfisch-Schonzeit sind Spinnfischen, Kunstkoeder, Koederfisch und Fischfetzen untersagt.' },
    },
  },
  hamburg: {
    id: 'hamburg',
    name: 'Hamburg',
    sourceUrl: 'https://angelmagazin.de/schonzeiten/hamburg/',
    inland: {
      hecht: { minimumCm: 45, maximumCm: 75, closedSeason: { start: '02-01', end: '05-31' }, bagLimit: 2 },
      zander: { minimumCm: 45, maximumCm: 75, closedSeason: { start: '02-01', end: '05-31' }, bagLimit: 2, note: 'In der Zanderschonzeit gelten Kunstkoeder-/Koederfischverbote ausserhalb des Hauptstroms der Elbe.' },
      barsch: { minimumCm: 10, maximumCm: 35, closedSeason: null },
    },
  },
  hessen: {
    id: 'hessen',
    name: 'Hessen',
    sourceUrl: 'https://angelmagazin.de/schonzeiten/hessen/',
    inland: {
      hecht: { minimumCm: 50, maximumCm: 90, closedSeason: { start: '02-01', end: '04-15' } },
      zander: { minimumCm: 50, closedSeason: null },
      barsch: noRule,
    },
  },
  'mecklenburg-vorpommern': {
    id: 'mecklenburg-vorpommern',
    name: 'Mecklenburg-Vorpommern',
    sourceUrl: 'https://angelmagazin.de/schonzeiten/mecklenburg-vorpommern/',
    inland: {
      hecht: { minimumCm: 45, closedSeason: null, note: 'In Binnengewaessern legen Fischereiberechtigte haeufig eigene Schonzeiten fest.' },
      zander: { minimumCm: 45, closedSeason: null, note: 'In Binnengewaessern legen Fischereiberechtigte haeufig eigene Schonzeiten fest.' },
      barsch: { minimumCm: 17, closedSeason: null },
    },
    coastal: {
      hecht: { minimumCm: 50, closedSeason: { start: '03-01', end: '04-30' } },
      zander: { minimumCm: 45, closedSeason: { start: '04-23', end: '05-22' }, note: 'In Darss-Zingster Boddenkette, Peenestrom und Stettiner Haff gilt 40 cm.' },
      barsch: { minimumCm: 20, closedSeason: null },
    },
  },
  niedersachsen: {
    id: 'niedersachsen',
    name: 'Niedersachsen',
    sourceUrl: 'https://angelmagazin.de/schonzeiten/niedersachsen/',
    inland: {
      hecht: { minimumCm: 45, closedSeason: { start: '02-01', end: '04-15' } },
      zander: { minimumCm: 40, closedSeason: { start: '03-15', end: '04-30' } },
      barsch: noRule,
    },
    coastal: {
      hecht: { minimumCm: 45, closedSeason: null },
      zander: { minimumCm: 40, closedSeason: { start: '03-15', end: '05-15' } },
      barsch: noRule,
    },
  },
  'nordrhein-westfalen': {
    id: 'nordrhein-westfalen',
    name: 'Nordrhein-Westfalen',
    sourceUrl: 'https://angelmagazin.de/schonzeiten/nordrhein-westfalen/',
    inland: {
      hecht: { minimumCm: 45, closedSeason: { start: '02-15', end: '04-30' } },
      zander: { minimumCm: 40, closedSeason: { start: '04-01', end: '05-31' } },
      barsch: noRule,
    },
  },
  'rheinland-pfalz': {
    id: 'rheinland-pfalz',
    name: 'Rheinland-Pfalz',
    sourceUrl: 'https://angelmagazin.de/schonzeiten/rheinland-pfalz/',
    inland: {
      hecht: { minimumCm: 50, closedSeason: { start: '02-01', end: '05-31' } },
      zander: { minimumCm: 45, closedSeason: { start: '03-15', end: '05-15' }, note: 'In der Lahn gilt abweichend 01.04.-31.05.; zusaetzliche Fruehjahrs-/Winterschonzeiten koennen Gewaesser betreffen.' },
      barsch: noRule,
    },
  },
  saarland: {
    id: 'saarland',
    name: 'Saarland',
    sourceUrl: 'https://angelmagazin.de/schonzeiten/saarland/',
    inland: {
      hecht: { minimumCm: 50, closedSeason: { start: '02-15', end: '05-31' } },
      zander: { minimumCm: 45, closedSeason: { start: '02-15', end: '05-31' } },
      barsch: noRule,
    },
  },
  sachsen: {
    id: 'sachsen',
    name: 'Sachsen',
    sourceUrl: 'https://angelmagazin.de/schonzeiten/sachsen/',
    inland: {
      hecht: { minimumCm: 50, closedSeason: { start: '02-01', end: '04-30' } },
      zander: { minimumCm: 50, closedSeason: { start: '02-01', end: '05-31' } },
      barsch: noRule,
    },
  },
  'sachsen-anhalt': {
    id: 'sachsen-anhalt',
    name: 'Sachsen-Anhalt',
    sourceUrl: 'https://angelmagazin.de/schonzeiten/sachsen-anhalt/',
    inland: {
      hecht: { minimumCm: 50, closedSeason: { start: '02-15', end: '04-30' } },
      zander: { minimumCm: 50, closedSeason: { start: '02-15', end: '05-31' } },
      barsch: noRule,
    },
  },
  'schleswig-holstein': {
    id: 'schleswig-holstein',
    name: 'Schleswig-Holstein',
    sourceUrl: 'https://angelmagazin.de/schonzeiten/schleswig-holstein/',
    inland: {
      hecht: { minimumCm: 45, closedSeason: { start: '02-15', end: '04-15' } },
      zander: { minimumCm: 45, closedSeason: { start: '03-15', end: '05-15' } },
      barsch: noRule,
    },
    coastal: {
      hecht: { minimumCm: 45, closedSeason: { start: '02-15', end: '04-30' } },
      zander: { minimumCm: 45, closedSeason: { start: '02-15', end: '05-15' } },
      barsch: noRule,
    },
  },
  thueringen: {
    id: 'thueringen',
    name: 'Thueringen',
    sourceUrl: 'https://angelmagazin.de/schonzeiten/thueringen/',
    inland: {
      hecht: { minimumCm: 50, closedSeason: { start: '02-15', end: '04-30' } },
      zander: { minimumCm: 45, closedSeason: { start: '04-01', end: '05-31' } },
      barsch: { minimumCm: 20, closedSeason: null },
    },
  },
};

const stateAliases: Array<[GermanStateId, string[]]> = [
  ['baden-wuerttemberg', ['badenwuerttemberg', 'badenwurttemberg', 'badenwrttemberg']],
  ['bayern', ['bayern', 'bavaria']],
  ['berlin', ['berlin']],
  ['brandenburg', ['brandenburg']],
  ['bremen', ['bremen', 'bremerhaven']],
  ['hamburg', ['hamburg']],
  ['hessen', ['hessen', 'hesse']],
  ['mecklenburg-vorpommern', ['mecklenburgvorpommern', 'mecklenburg', 'vorpommern']],
  ['niedersachsen', ['niedersachsen', 'lower saxony']],
  ['nordrhein-westfalen', ['nordrheinwestfalen', 'nrw', 'north rhinewestphalia']],
  ['rheinland-pfalz', ['rheinlandpfalz', 'rlp', 'rhinelandpalatinate']],
  ['saarland', ['saarland']],
  ['sachsen-anhalt', ['sachsenanhalt', 'saxonyanhalt']],
  ['sachsen', ['sachsen', 'saxony']],
  ['schleswig-holstein', ['schleswigholstein']],
  ['thueringen', ['thueringen', 'thuringen', 'thuringia']],
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

export function detectStateFromText(value?: string | null): GermanStateId | null {
  if (!value) return null;
  const normalized = normalize(value);

  for (const [state, aliases] of stateAliases) {
    if (aliases.some((alias) => normalized.includes(normalize(alias)))) return state;
  }

  return null;
}

export function detectStateFromCoordinates(lat: number, lng: number): GermanStateId | null {
  if (lat >= 53.35 && lat <= 53.75 && lng >= 9.65 && lng <= 10.35) return 'hamburg';
  if (lat >= 52.34 && lat <= 52.68 && lng >= 13.08 && lng <= 13.78) return 'berlin';
  if (lat >= 47.45 && lat <= 49.85 && lng >= 7.45 && lng <= 10.55) return 'baden-wuerttemberg';
  if ((lat >= 53.0 && lat <= 53.7 && lng >= 8.45 && lng <= 8.98) || (lat >= 53.45 && lat <= 53.7 && lng >= 8.45 && lng <= 8.75)) return 'bremen';
  if (lat >= 47.25 && lat <= 50.6 && lng >= 9.6 && lng <= 13.85) return 'bayern';
  if (lat >= 49.35 && lat <= 51.75 && lng >= 7.7 && lng <= 10.25) return 'hessen';
  if (lat >= 50.3 && lat <= 52.55 && lng >= 5.85 && lng <= 9.55) return 'nordrhein-westfalen';
  if (lat >= 49.05 && lat <= 49.65 && lng >= 6.3 && lng <= 7.4) return 'saarland';
  if (lat >= 49.05 && lat <= 50.95 && lng >= 6.05 && lng <= 8.55) return 'rheinland-pfalz';
  if (lat >= 53.35 && lat <= 55.15 && lng >= 7.85 && lng <= 11.35) return 'schleswig-holstein';
  if (lat >= 51.25 && lat <= 54.05 && lng >= 6.65 && lng <= 11.75) return 'niedersachsen';
  if (lat >= 53.05 && lat <= 54.75 && lng >= 10.55 && lng <= 14.45) return 'mecklenburg-vorpommern';
  if (lat >= 51.35 && lat <= 53.6 && lng >= 11.15 && lng <= 14.8) return 'brandenburg';
  if (lat >= 50.9 && lat <= 53.1 && lng >= 10.55 && lng <= 13.25) return 'sachsen-anhalt';
  if (lat >= 50.15 && lat <= 51.65 && lng >= 9.85 && lng <= 12.75) return 'thueringen';
  if (lat >= 50.15 && lat <= 51.75 && lng >= 11.85 && lng <= 15.1) return 'sachsen';

  return null;
}

export function getStateForProfile(profile: WaterBodyProfile | null | undefined, lat: number, lng: number) {
  const profileText = [
    profile?.region,
    profile?.areaDetails?.locationInfo?.join(' '),
    profile?.name,
  ].filter(Boolean).join(' ');

  return detectStateFromText(profileText) || detectStateFromCoordinates(lat, lng) || 'hamburg';
}

export function getWaterRuleScope(profile: WaterBodyProfile | null | undefined): WaterRuleScope {
  const haystack = normalize(`${profile?.name || ''} ${profile?.region || ''} ${profile?.type || ''}`);
  if (
    profile?.type === 'sea'
    || /kueste|kuste|ostsee|nordsee|bodden|haff|foerde|forde|watt|meer|bucht/.test(haystack)
  ) {
    return 'coastal';
  }

  return 'inland';
}

function isMonthDayInWindow(date: Date, start: string, end: string) {
  const [startMonth, startDay] = start.split('-').map(Number);
  const [endMonth, endDay] = end.split('-').map(Number);
  const currentValue = (date.getMonth() + 1) * 100 + date.getDate();
  const startValue = startMonth * 100 + startDay;
  const endValue = endMonth * 100 + endDay;

  if (startValue <= endValue) {
    return currentValue >= startValue && currentValue <= endValue;
  }

  return currentValue >= startValue || currentValue <= endValue;
}

function formatMonthDay(value: string) {
  const [month, day] = value.split('-');
  return `${day}.${month}.`;
}

function formatClosedSeason(rule: FishRegulationRule) {
  if (!rule.closedSeason) return 'keine';
  return `${formatMonthDay(rule.closedSeason.start)}-${formatMonthDay(rule.closedSeason.end)}`;
}

function formatSize(rule: FishRegulationRule) {
  if (rule.minimumCm === null) return 'kein Mindestmass';
  if (rule.maximumCm) return `${rule.minimumCm}-${rule.maximumCm} cm`;
  return `ab ${rule.minimumCm} cm`;
}

export function getLocalFishRules(
  profile: WaterBodyProfile | null | undefined,
  lat: number,
  lng: number,
  date: Date = new Date()
): LocalFishRule[] {
  const stateId = getStateForProfile(profile, lat, lng);
  const state = fishRegulations[stateId];
  const scope = getWaterRuleScope(profile);
  const scopedRules = scope === 'coastal' && state.coastal
    ? { ...state.inland, ...state.coastal }
    : state.inland;

  return (Object.keys(fishLabels) as TargetFish[]).map((fish) => {
    const rule = scopedRules[fish] || noRule;
    const closedNow = Boolean(rule.closedSeason && isMonthDayInWindow(date, rule.closedSeason.start, rule.closedSeason.end));

    return {
      ...rule,
      fish,
      fishLabel: fishLabels[fish],
      stateId,
      stateName: state.name,
      scope,
      sourceLabel: `${state.name}${scope === 'coastal' && state.coastal ? ' (Kuestengewaesser)' : ''}`,
      sourceUrl: state.sourceUrl,
      closedNow,
      closedSeasonText: formatClosedSeason(rule),
      sizeText: formatSize(rule),
    };
  });
}

export function getLocalFishRule(
  fish: TargetFish,
  profile: WaterBodyProfile | null | undefined,
  lat: number,
  lng: number,
  date: Date = new Date()
) {
  return getLocalFishRules(profile, lat, lng, date).find((rule) => rule.fish === fish)!;
}
