import SunCalc from 'suncalc';

export interface AngelConditions {
  stromPhase: 'ablauf' | 'auflauf' | 'kenter' | 'stagnation';
  luftdruckTrend: 'fallend' | 'stabil' | 'steigend';
  wasserTemp: number;
  tageszeit: 'dämmerung' | 'nacht' | 'tag';
  solunar: 'major' | 'minor' | 'außerhalb';
  mondPhase: string;
  windSpeed: number;
  niederschlag48h: number;
  tideEvents?: { time: Date, type: 'HW' | 'NW' }[];
}

export function calculateAngelIndex(conditions: AngelConditions): number {
  let score = 0;

  // Strömungsphase
  if (conditions.stromPhase === 'ablauf' || conditions.stromPhase === 'kenter') score += 25;
  else if (conditions.stromPhase === 'auflauf') score += 10;
  else score += 5;

  // Luftdruck-Trend
  if (conditions.luftdruckTrend === 'fallend') score += 15;
  else if (conditions.luftdruckTrend === 'stabil') score += 5;
  else score -= 10;

  // Wassertemperatur
  if (conditions.wasserTemp >= 10 && conditions.wasserTemp <= 18) score += 15;
  else if (conditions.wasserTemp >= 6 && conditions.wasserTemp < 10) score += 8;
  else if (conditions.wasserTemp > 18 && conditions.wasserTemp <= 22) score += 5;
  else score -= 15;

  // Tageszeit
  if (conditions.tageszeit === 'dämmerung') score += 15;
  else if (conditions.tageszeit === 'nacht') score += 8;
  else score += 0;

  // Solunar
  if (conditions.solunar === 'major') score += 10;
  else if (conditions.solunar === 'minor') score += 5;

  // Mondphase
  const mp = conditions.mondPhase.toLowerCase();
  if (mp.includes('neumond') || mp.includes('abnehmend')) score += 8;
  else if (mp.includes('zunehmend')) score += 3;
  else if (mp.includes('vollmond')) score -= 10;

  // Wind
  if (conditions.windSpeed < 15) score += 8;
  else if (conditions.windSpeed <= 25) score += 3;
  else score -= 10;

  // Niederschlag
  if (conditions.niederschlag48h >= 5 && conditions.niederschlag48h <= 20) score += 5;
  else if (conditions.niederschlag48h > 30) score -= 5;

  return Math.min(100, Math.max(0, score));
}

export function getMoonPhase(date: Date) {
  const known = new Date(2000, 0, 6);
  const diffDays = (date.getTime() - known.getTime()) / 86400000;
  const cycle = ((diffDays % 29.53) + 29.53) % 29.53;
  const illumination = Math.round(50 * (1 - Math.cos(2 * Math.PI * cycle / 29.53)));
  
  if (cycle < 1.85) return { name: 'Neumond', icon: '🌑', illumination };
  if (cycle < 7.38) return { name: 'Zunehmend (Sichel)', icon: '🌒', illumination };
  if (cycle < 9.22) return { name: 'Zunehmend (Halbmond)', icon: '🌓', illumination };
  if (cycle < 14.77) return { name: 'Zunehmend (Dreiviertel)', icon: '🌔', illumination };
  if (cycle < 16.61) return { name: 'Vollmond', icon: '🌕', illumination };
  if (cycle < 22.15) return { name: 'Abnehmend (Dreiviertel)', icon: '🌖', illumination };
  if (cycle < 23.99) return { name: 'Abnehmend (Halbmond)', icon: '🌗', illumination };
  return { name: 'Abnehmend (Sichel)', icon: '🌘', illumination };
}

export function getTideOffset(lng: number): number {
  // Hamburg St. Pauli reference: ~9.96 Longitude
  // The tide wave travels upstream (west to east).
  // Difference between Blankenese and Geesthacht is about 2 hours for ~0.55 longitude degrees.
  // Approximation: ~300 minutes per degree of longitude.
  const referenceLng = 9.96;
  const degreesDiff = lng - referenceLng;
  return Math.round(degreesDiff * 300); // Minutes offset
}

export function getStromPhase(currentTime: Date, tideEvents: { time: Date, type: 'HW' | 'NW' }[], minuteOffset: number = 0): 'ablauf' | 'auflauf' | 'kenter' | 'stagnation' {
  if (tideEvents.length < 2) return 'stagnation';
  
  // Create virtual time shifted by the location's offset
  const localTime = new Date(currentTime.getTime() - (minuteOffset * 60000));
  
  const nextEvent = tideEvents.find(e => e.time > localTime);
  if (!nextEvent) return 'stagnation';
  
  const diffMinutes = (nextEvent.time.getTime() - localTime.getTime()) / 60000;
  
  // Kenterwasser: ±45 min um Ereignis
  if (diffMinutes < 45) return 'kenter';
  
  // Finde das letzte Ereignis
  const pastEvents = tideEvents.filter(e => e.time <= localTime);
  const lastEvent = pastEvents[pastEvents.length - 1];
  
  if (!lastEvent) return 'stagnation';
  
  const sinceMinutes = (localTime.getTime() - lastEvent.time.getTime()) / 60000;
  if (sinceMinutes < 45) return 'kenter';

  if (lastEvent.type === 'HW') return 'ablauf';
  return 'auflauf';
}

export function getSolunarStatus(date: Date, lat: number, lng: number): 'major' | 'minor' | 'außerhalb' {
  const times = SunCalc.getMoonTimes(date, lat, lng);
  if (!times.rise || !times.set) return 'außerhalb';

  const now = date.getTime();
  const hour = 3600000;

  // Major: Mondaufgang ± 1h, Monduntergang ± 1h
  if (Math.abs(now - times.rise.getTime()) < hour || Math.abs(now - times.set.getTime()) < hour) {
    return 'major';
  }

  // Minor: Mondmeridian (grob geschätzt als Mitte zwischen Rise und Set) ± 30 min
  const meridian = (times.rise.getTime() + times.set.getTime()) / 2;
  if (Math.abs(now - meridian) < hour / 2) {
    return 'minor';
  }

  return 'außerhalb';
}

export function getLocalConditions(spot: { lat: number, lng: number }, global: AngelConditions, date: Date = new Date()) {
  const offset = getTideOffset(spot.lng);
  const localPhase = getStromPhase(date, global.tideEvents || [], offset);
  const solunar = getSolunarStatus(date, spot.lat, spot.lng);
  
  // Calculate a distance-based solar shift (very subtle)
  const solarShift = (spot.lng - 9.96) * 4; // minutes
  
  return {
    ...global,
    stromPhase: localPhase,
    solunar,
    tideOffset: offset,
    solarShift
  };
}

export type TargetFish = 'zander' | 'hecht' | 'barsch';

export interface HechtScoreInput extends AngelConditions {
  pressure?: number;
  pressure3hAgo?: number;
  pressure6hAgo?: number;
  pressureHistory?: number[];
  cloudCover?: number;
  uvIndex?: number;
  windDirection?: number;
  sunrise?: string;
  sunset?: string;
  date?: Date;
  shoreDirection?: number;
  secchiCm?: number;
  oxygen?: number;
  structureType?: string;
  depth?: number;
}

export interface HechtScoreDetails {
  total: number;
  confidence: number;
  rating: string;
  subScores: {
    temperatur: number;
    barometer: number;
    hydrologie: number;
    lichtWind: number;
  };
  interactionBonus: number;
  legal: {
    schonzeitAktiv: boolean;
    entnahmefenster: string;
    baglimit: number | null;
    hinweis: string;
  };
  primeWindow: string;
  topTactic: string;
  hotspot: string;
  probability: string;
}

export type PredatorScoreDetails = HechtScoreDetails;

const clamp = (value: number, min: number = 0, max: number = 100) =>
  Math.max(min, Math.min(max, value));

const gaussian = (x: number, mean: number, sigma: number) =>
  Math.exp(-0.5 * Math.pow((x - mean) / sigma, 2));

const toRadians = (degrees: number) => degrees * Math.PI / 180;

function isInDateWindow(date: Date, startMonth: number, startDay: number, endMonth: number, endDay: number) {
  const year = date.getFullYear();
  const start = new Date(year, startMonth, startDay);
  const end = new Date(year, endMonth, endDay, 23, 59, 59);
  return date >= start && date <= end;
}

export function getHamburgPredatorRules(fish: TargetFish, date: Date = new Date()) {
  const isPredator = fish === 'zander' || fish === 'hecht';
  const schonzeitAktiv = isPredator && isInDateWindow(date, 1, 1, 4, 31);

  return {
    schonzeitAktiv,
    entnahmefenster: fish === 'barsch' ? '10-35 cm' : '45-75 cm',
    baglimit: fish === 'barsch' ? null : 2,
    hinweis: fish === 'barsch'
      ? 'Keine generelle Barsch-Schonzeit in ASV-Hamburg-Gewaessern. Lokale Kunstkoederverbote waehrend Raubfisch-Schonzeiten beachten.'
      : schonzeitAktiv ? 'SCHONZEIT AKTIV: gezieltes Angeln aussetzen.' : 'Fischerei frei nach Hamburger Regeln.'
  };
}

function getTideMetrics(date: Date, tideEvents: { time: Date, type: 'HW' | 'NW' }[] = []) {
  if (tideEvents.length === 0) {
    return {
      minutesSinceHW: 180,
      tideAngle: 174,
      currentSpeed: 0.15,
      minutesSinceLastEvent: 180,
      lastType: 'HW' as 'HW' | 'NW'
    };
  }

  const pastEvents = tideEvents.filter(event => event.time <= date);
  const lastEvent = pastEvents[pastEvents.length - 1] || tideEvents[0];
  const minutesSinceLastEvent = Math.max(0, (date.getTime() - lastEvent.time.getTime()) / 60000);
  const halfCycleMinutes = 12.42 * 60 / 2;
  const minutesSinceHW = lastEvent.type === 'HW'
    ? minutesSinceLastEvent
    : minutesSinceLastEvent + halfCycleMinutes;
  const normalizedSinceHW = ((minutesSinceHW % (halfCycleMinutes * 2)) + halfCycleMinutes * 2) % (halfCycleMinutes * 2);
  const tideAngle = (normalizedSinceHW / halfCycleMinutes) * 360;
  const currentSpeed = 0.08 + 0.52 * Math.abs(Math.sin(toRadians(tideAngle)));

  return {
    minutesSinceHW: normalizedSinceHW,
    tideAngle,
    currentSpeed,
    minutesSinceLastEvent,
    lastType: lastEvent.type
  };
}

function calculateHechtTemperatureScore(temp: number) {
  let extremeFactor = 1;
  if (temp < 4) extremeFactor = Math.exp(-0.3 * (4 - temp));
  else if (temp > 25) extremeFactor = clamp(0.2 + 0.03 * (30 - temp), 0.05, 0.35);

  return clamp(100 * (0.6 * gaussian(temp, 15, 3) + 0.4 * gaussian(temp, 10, 4)) * extremeFactor);
}

function calculateHechtBarometerScore(input: HechtScoreInput) {
  const pressure = input.pressure ?? input.pressure3hAgo ?? 1013;
  const pressure3hAgo = input.pressure3hAgo ?? pressure;
  const pressure6hAgo = input.pressure6hAgo ?? pressure3hAgo;
  const delta3h = (pressure - pressure3hAgo) / 3;
  const delta6h = (pressure - pressure6hAgo) / 6;
  const trend = 0.7 * delta3h + 0.3 * delta6h;

  let score = trend < 0
    ? 50 + 65 * Math.abs(trend) - 25 * Math.pow(Math.abs(trend), 2)
    : 50 - 18 * trend - 2.5 * Math.pow(trend, 2);

  if (Math.abs(trend) > 3) score -= 25;

  const history = input.pressureHistory || [];
  const rapidRise = history.some((value, index) => {
    if (index < 3) return false;
    return (value - history[index - 3]) / 3 > 2;
  });

  if (rapidRise || delta3h > 2) score -= 15;

  return {
    score: clamp(score),
    delta3h,
    trend
  };
}

function calculateHechtHydroScore(input: HechtScoreInput) {
  const tide = getTideMetrics(input.date || new Date(), input.tideEvents);
  const oxygenBoost = input.stromPhase === 'ablauf' || input.stromPhase === 'auflauf' ? 8 : 2;
  const base = 50 + 40 * Math.sin(toRadians(tide.tideAngle + 45));
  const flow = 30 * Math.tanh(tide.currentSpeed / 0.5);

  let windowBoost = 0;
  if (tide.minutesSinceHW > 60 && tide.minutesSinceHW < 150) windowBoost = 25;
  else if (tide.minutesSinceHW > 350 && tide.minutesSinceHW < 390) windowBoost = 20;

  const structureBoost = tide.currentSpeed > 0.3 && input.stromPhase !== 'stagnation' ? 15 : 0;

  return {
    score: clamp(base + flow + oxygenBoost + windowBoost + structureBoost),
    tide
  };
}

function isTwilightWindow(date: Date, sunrise?: string, sunset?: string) {
  const current = date.getTime();
  const limit = 2 * 60 * 60000;
  const sunriseTime = sunrise ? new Date(sunrise).getTime() : 0;
  const sunsetTime = sunset ? new Date(sunset).getTime() : 0;
  return Math.abs(current - sunriseTime) <= limit || Math.abs(current - sunsetTime) <= limit;
}

function calculateHechtLightWindScore(input: HechtScoreInput) {
  const date = input.date || new Date();
  const cloudCover = input.cloudCover ?? 50;
  const solarRadiation = 100 - cloudCover;
  const windSpeed = input.windSpeed || 0;
  const windDirection = input.windDirection ?? 270;
  const shoreDirection = input.shoreDirection ?? 90;
  const opposingShoreDirection = (shoreDirection + 180) % 360;
  const directDiff = Math.abs(windDirection - shoreDirection);
  const oppositeDiff = Math.abs(windDirection - opposingShoreDirection);
  const alpha = Math.min(directDiff, 360 - directDiff, oppositeDiff, 360 - oppositeDiff);
  const shoreFactor = Math.max(0.3, Math.cos(toRadians(alpha)));
  const windEffect = Math.min(1, windSpeed / 12);

  let timeFactor = 1;
  const month = date.getMonth();
  const hour = date.getHours();
  if (isTwilightWindow(date, input.sunrise, input.sunset)) timeFactor = 1.3;
  else if (month >= 5 && month <= 7 && hour >= 11 && hour <= 14) timeFactor = 0.7;

  return {
    score: clamp((100 - 0.6 * solarRadiation) * windEffect * shoreFactor * timeFactor),
    shoreFactor,
    solarRadiation,
    twilight: timeFactor > 1
  };
}

function getHechtRating(score: number) {
  if (score >= 85) return 'PERFEKT';
  if (score >= 70) return 'SEHR GUT';
  if (score >= 55) return 'GUT';
  if (score >= 35) return 'ZAEH';
  return 'SCHWACH';
}

function calculateZanderTemperatureScore(temp: number) {
  if (temp >= 10 && temp <= 18) return 95;
  if (temp >= 6 && temp < 10) return 70;
  if (temp > 18 && temp <= 22) return 55;
  if (temp < 4 || temp > 25) return 15;
  return 35;
}

function calculateZanderBarometerScore(input: HechtScoreInput) {
  const pressure = input.pressure ?? input.pressure3hAgo ?? 1013;
  const pressure3hAgo = input.pressure3hAgo ?? pressure;
  const delta3h = (pressure - pressure3hAgo) / 3;

  if (delta3h < -0.5 || input.luftdruckTrend === 'fallend') return { score: 88, delta3h };
  if (delta3h > 0.5 || input.luftdruckTrend === 'steigend') return { score: 30, delta3h };
  return { score: 62, delta3h };
}

function calculateZanderHydroScore(input: HechtScoreInput) {
  if (input.stromPhase === 'ablauf') return 92;
  if (input.stromPhase === 'kenter') return 82;
  if (input.stromPhase === 'auflauf') return 55;
  return 28;
}

function calculateZanderLightWindScore(input: HechtScoreInput) {
  let score = 42;
  if (input.tageszeit === 'dämmerung') score += 35;
  else if (input.tageszeit === 'nacht') score += 22;

  if (input.solunar === 'major') score += 10;
  else if (input.solunar === 'minor') score += 5;

  const moon = input.mondPhase.toLowerCase();
  if (moon.includes('neumond') || moon.includes('abnehmend')) score += 8;
  else if (moon.includes('vollmond')) score -= 10;

  if (input.windSpeed < 15) score += 8;
  else if (input.windSpeed <= 25) score += 3;
  else score -= 14;

  if (input.niederschlag48h >= 5 && input.niederschlag48h <= 20) score += 5;
  else if (input.niederschlag48h > 30) score -= 8;

  return clamp(score);
}

function getZanderPrimeWindow(input: HechtScoreInput) {
  if (input.tageszeit === 'dämmerung') return 'jetzt: Daemmerung nutzen';
  if (input.stromPhase === 'ablauf') return 'laufende Ablaufphase';
  if (input.stromPhase === 'kenter') return 'Kenterfenster sofort nutzen';
  return 'naechste Daemmerung oder Ablaufphase';
}

export function calculateZanderIndex(input: HechtScoreInput): PredatorScoreDetails {
  const date = input.date || new Date();
  const rules = getHamburgPredatorRules('zander', date);
  const temperatur = calculateZanderTemperatureScore(input.wasserTemp);
  const barometerResult = calculateZanderBarometerScore(input);
  const hydrologie = calculateZanderHydroScore(input);
  const lichtWind = calculateZanderLightWindScore(input);

  let multiplier = 1;
  if (barometerResult.delta3h < -0.5 && (input.stromPhase === 'ablauf' || input.stromPhase === 'kenter')) multiplier *= 1.12;
  if (input.wasserTemp >= 10 && input.wasserTemp <= 18 && input.tageszeit === 'dämmerung') multiplier *= 1.1;
  if (input.windSpeed > 28 && input.stromPhase !== 'stagnation') multiplier *= 0.92;
  if (input.wasserTemp < 6 && input.tageszeit === 'tag') multiplier *= 0.88;

  const raw = 0.25 * temperatur + 0.2 * barometerResult.score + 0.3 * hydrologie + 0.25 * lichtWind;
  const total = Math.round(clamp(raw * multiplier));
  const confidence = Math.round(clamp(9 - 0.05 * total, 5, 9));
  const biologicalProbability = Math.round(clamp(14 + total * 0.62, 5, 78));
  const probability = rules.schonzeitAktiv
    ? `${biologicalProbability}% biologisch, Schonzeit beachten`
    : `${biologicalProbability}% fuer Zanderkontakt`;

  return {
    total,
    confidence,
    rating: getHechtRating(total),
    subScores: {
      temperatur: Math.round(temperatur),
      barometer: Math.round(barometerResult.score),
      hydrologie: Math.round(hydrologie),
      lichtWind: Math.round(lichtWind)
    },
    interactionBonus: Math.round((multiplier - 1) * 100),
    legal: rules,
    primeWindow: getZanderPrimeWindow(input),
    topTactic: input.wasserTemp < 8
      ? 'Langsame Grundnaehe mit kleinen Shads'
      : input.tageszeit === 'dämmerung'
        ? 'Ufernahe Kanten mit Shad oder Wobbler'
        : 'Tiefere Kanten und Stroemungsschatten jiggen',
    hotspot: input.stromPhase === 'ablauf' || input.stromPhase === 'kenter'
      ? 'Stroemungskante, Buhnenkopf oder Spundwand'
      : 'Tiefe Kante, Hafenbecken oder Schattenbereich',
    probability
  };
}

export function calculateBarschIndex(input: HechtScoreInput): PredatorScoreDetails {
  const date = input.date || new Date();
  const rules = getHamburgPredatorRules('barsch', date);
  const pressureResult = calculateBarschPressureScore(input);
  const temperature = calculateBarschTemperatureScore(input.wasserTemp, date);
  const lightResult = calculateBarschLightScore(input);
  const hydroResult = calculateBarschHydroScore(input);

  const raw = 0.4 * pressureResult.score
    + 0.3 * temperature
    + 0.15 * lightResult.score
    + 0.15 * hydroResult.score;

  let multiplier = 1;
  if (pressureResult.sigma < 1.5 && (input.pressure ?? 0) > 1015 && (input.cloudCover ?? 100) < 40 && lightResult.secchi > 60) multiplier *= 1.2;
  if (pressureResult.trend > -1 && pressureResult.trend < -0.2 && hydroResult.minutesSinceNW > 30 && hydroResult.minutesSinceNW < 180) multiplier *= 1.12;
  if (lightResult.twilight && input.wasserTemp > 15 && input.wasserTemp < 22) multiplier *= 1.15;
  if (hydroResult.structureScore >= 20 && hydroResult.currentSpeed > 0.25) multiplier *= 1.08;
  if (pressureResult.sigma > 3 && lightResult.secchi < 30) multiplier *= 0.75;
  if (input.wasserTemp < 6 && (input.cloudCover ?? 0) > 70) multiplier *= 0.8;
  if (input.wasserTemp > 24 && hydroResult.currentSpeed < 0.1 && (input.oxygen ?? 7) < 6) multiplier *= 0.7;
  if (input.wasserTemp > 20 && date.getHours() > 11 && date.getHours() < 15 && (input.cloudCover ?? 100) < 30) multiplier *= 0.85;

  const total = Math.round(clamp(raw * multiplier));
  const confidence = Math.round(clamp(7 - 0.04 * total, 3, 7));
  const probability = `${Math.round(clamp(10 + total * 0.75, 5, 85))}% fuer Barschkontakt`;
  const activity = getBarschActivity(total);

  return {
    total,
    confidence,
    rating: total >= 95 ? 'PERFEKT' : getHechtRating(total),
    legal: rules,
    primeWindow: getBarschPrimeWindow(input, hydroResult),
    topTactic: getBarschTactic(input, total, lightResult.secchi),
    hotspot: hydroResult.hotspot,
    probability: `${probability} | ${activity}`,
    interactionBonus: Math.round((multiplier - 1) * 100),
    subScores: {
      temperatur: Math.round(temperature),
      barometer: Math.round(pressureResult.score),
      hydrologie: Math.round(hydroResult.score),
      lichtWind: Math.round(lightResult.score)
    },
  };
}

function pressureAt(history: number[], hoursAgo: number, fallback: number) {
  const value = history[history.length - 1 - hoursAgo];
  return typeof value === 'number' ? value : fallback;
}

function calculateBarschPressureScore(input: HechtScoreInput) {
  const pressure = input.pressure ?? input.pressure3hAgo ?? 1013;
  const history = input.pressureHistory || [];
  const p24 = pressureAt(history, 24, input.pressure6hAgo ?? pressure);
  const p48 = pressureAt(history, 48, p24);
  const p72 = pressureAt(history, 72, p48);
  const sigma = Math.sqrt((Math.pow(pressure - p24, 2) + Math.pow(p24 - p48, 2) + Math.pow(p48 - p72, 2)) / 3);
  const stability = Math.exp(-0.15 * sigma);
  const pNorm = (pressure - 1000) / 30;
  const pBonus = pressure > 1015 ? Math.min(1, pNorm) * 100 : pNorm * 60;
  const delta3h = (pressure - (input.pressure3hAgo ?? pressure)) / 3;
  const delta6h = (pressure - (input.pressure6hAgo ?? pressure)) / 6;
  const trend = 0.6 * delta3h + 0.4 * delta6h;
  let trendFactor = 1;
  if (trend > -1 && trend < -0.2) trendFactor = 1.15;
  else if (trend > 2) trendFactor = 0.25;

  return {
    score: clamp((40 * stability + 60 * clamp(pBonus, 0, 100) / 100) * trendFactor),
    sigma,
    trend
  };
}

function calculateBarschTemperatureScore(temp: number, date: Date) {
  const primary = gaussian(temp, 18, 3.5);
  const winter = gaussian(temp, 6, 2.5);
  const base = Math.max(96 * Math.pow(primary, 0.25), 55 * Math.pow(winter, 0.25));
  let cold = 1;
  if (temp < 2) cold = 0.05;
  else if (temp < 4) cold = 0.3;

  const hot = temp > 26 ? clamp(0.4 + 0.02 * (32 - temp), 0.2, 0.55) : 1;
  let winterTime = 1;
  if (temp < 8) winterTime = date.getHours() > 11 && date.getHours() < 15 ? 1.3 : 0.7;

  return clamp(base * cold * hot * winterTime);
}

function calculateBarschLightScore(input: HechtScoreInput) {
  const cloudCover = input.cloudCover ?? 50;
  const solarRadiation = 100 - cloudCover;
  const secchi = input.secchiCm ?? 60;
  let lightScore = 60;
  if (solarRadiation > 10 && solarRadiation < 60) lightScore = 100;
  else if (solarRadiation > 80) lightScore = 85;

  const uvBonus = (input.uvIndex ?? 0) > 5 && secchi > 50 ? 10 : 0;
  const date = input.date || new Date();
  const twilight = isTwilightWindow(date, input.sunrise, input.sunset);
  const hour = date.getHours();
  const twilightFactor = twilight ? 1.35 : hour >= 8 && hour <= 18 ? 1 : 0.95;
  let sightFactor = 0.4;
  if (secchi > 80) sightFactor = 1;
  else if (secchi > 40) sightFactor = 0.85;
  else if (secchi > 20) sightFactor = 0.6;

  return {
    score: clamp((lightScore + uvBonus) * twilightFactor * sightFactor),
    secchi,
    twilight
  };
}

function calculateBarschHydroScore(input: HechtScoreInput) {
  const tide = getTideMetrics(input.date || new Date(), input.tideEvents);
  const halfCycle = 12.42 * 60 / 2;
  const minutesSinceNW = tide.lastType === 'NW' ? tide.minutesSinceLastEvent : tide.minutesSinceLastEvent + halfCycle;
  const normalizedNW = ((minutesSinceNW % (halfCycle * 2)) + halfCycle * 2) % (halfCycle * 2);
  const tideAngle = (normalizedNW / halfCycle) * 360;
  const currentSpeed = tide.currentSpeed;
  const tideScore = 50 + 40 * Math.sin(toRadians(tideAngle + 30));
  const flowScore = 30 * Math.tanh(currentSpeed / 0.4);
  const structure = (input.structureType || 'Spundwand').toLowerCase();
  let structureScore = 0;
  if (/spundwand|brueckenpfeiler|brückenpfeiler|poller/.test(structure)) structureScore = 20;
  else if (/buhne|hafeneinfahrt/.test(structure)) structureScore = 15;

  let windowBonus = 0;
  if (normalizedNW > 30 && normalizedNW < 180) windowBonus = 25;
  else if (normalizedNW > 210 && normalizedNW < 330) windowBonus = 15;

  return {
    score: clamp(tideScore + flowScore + structureScore + windowBonus),
    minutesSinceNW: normalizedNW,
    currentSpeed,
    structureScore,
    hotspot: structureScore >= 20 ? 'Spundwand, Poller oder Brueckenpfeiler' : 'Kaimauer, Hafeneinfahrt oder Steinpackung'
  };
}

function getBarschActivity(score: number) {
  if (score > 85) return 'HOCHAKTIV - Futterneid nutzen';
  if (score > 70) return 'AKTIV - systematisch absuchen';
  if (score > 50) return 'MODERAT - Finesse-Methoden';
  if (score > 30) return 'TRAEGE - ultra-slow';
  return 'INAKTIV - Alternative erwaegen';
}

function getBarschPrimeWindow(input: HechtScoreInput, hydro: ReturnType<typeof calculateBarschHydroScore>) {
  if (hydro.minutesSinceNW > 30 && hydro.minutesSinceNW < 180) return 'erste 3h auflaufend';
  if (isTwilightWindow(input.date || new Date(), input.sunrise, input.sunset)) return 'Daemmerung - Topwater-Zeit';
  if (hydro.minutesSinceNW > 210 && hydro.minutesSinceNW < 330) return 'Ablaufend: Kehrwasser-Spots';
  return 'Struktur-Hopping bis zum naechsten Fenster';
}

function getBarschTactic(input: HechtScoreInput, score: number, secchi: number) {
  if (input.wasserTemp < 8) return 'Dropshot oder Vertikalangeln ultra-slow';
  if (secchi < 30) return 'Spinmad, Chatterbait oder UV-Shad mit Druckwelle';
  if (isTwilightWindow(input.date || new Date(), input.sunrise, input.sunset)) return 'Topwater oder kleiner Twitchbait';
  if (score > 70) return 'Vertikales Jiggen, danach Futterneid ausnutzen';
  return 'Dropshot/Finesse und Struktur-Hopping';
}

function getPrimeWindow(input: HechtScoreInput) {
  if (isTwilightWindow(input.date || new Date(), input.sunrise, input.sunset)) return 'jetzt bis Ende Daemmerung';
  if (input.stromPhase === 'ablauf') return 'erste 90 min der Ablaufphase';
  if (input.stromPhase === 'kenter') return 'Kenterpunkt plus 90 min';
  return 'naechste Daemmerung';
}

export function calculateHechtIndex(input: HechtScoreInput): HechtScoreDetails {
  const date = input.date || new Date();
  const rules = getHamburgPredatorRules('hecht', date);
  const temperatur = calculateHechtTemperatureScore(input.wasserTemp);
  const barometerResult = calculateHechtBarometerScore(input);
  const hydrologyResult = calculateHechtHydroScore(input);
  const lightWindResult = calculateHechtLightWindScore(input);

  const raw = 0.35 * temperatur
    + 0.25 * barometerResult.score
    + 0.25 * hydrologyResult.score
    + 0.15 * lightWindResult.score;

  let multiplier = 1;
  if (barometerResult.delta3h < -0.5 && hydrologyResult.tide.minutesSinceHW > 60 && hydrologyResult.tide.minutesSinceHW < 150) multiplier *= 1.15;
  if ((input.cloudCover ?? 0) > 60 && lightWindResult.shoreFactor > 0.7 && input.windSpeed > 10) multiplier *= 1.1;
  if (input.wasserTemp > 12 && input.wasserTemp < 16 && lightWindResult.twilight) multiplier *= 1.12;
  if (input.wasserTemp < 8 && lightWindResult.solarRadiation > 70) multiplier *= 0.85;
  if (hydrologyResult.tide.currentSpeed < 0.1 && (input.cloudCover ?? 100) < 30) multiplier *= 0.9;

  const uncappedTotal = raw * multiplier;
  const total = Math.round(clamp(uncappedTotal));
  const confidence = Math.round(clamp(8 - 0.05 * total, 4, 8));
  const biologicalProbability = Math.round(clamp(18 + total * 0.67, 5, 85));
  const probability = rules.schonzeitAktiv
    ? `${biologicalProbability}% biologisch, Schonzeit beachten`
    : `${biologicalProbability}% fuer Hecht >60cm`;

  return {
    total,
    confidence,
    rating: getHechtRating(total),
    subScores: {
      temperatur: Math.round(temperatur),
      barometer: Math.round(barometerResult.score),
      hydrologie: Math.round(hydrologyResult.score),
      lichtWind: Math.round(lightWindResult.score)
    },
    interactionBonus: Math.round((multiplier - 1) * 100),
    legal: rules,
    primeWindow: getPrimeWindow(input),
    topTactic: input.wasserTemp < 8
      ? 'Langsam gefuehrter Jerkbait oder grosser Softbait'
      : lightWindResult.twilight
        ? 'Jerken oder flach laufender Wobbler am Ufer'
        : 'Spinnerbait/Swimbait an Krautkante und Struktur',
    hotspot: hydrologyResult.tide.currentSpeed > 0.3
      ? 'Buhnenkopf, Einlauf oder windgedrueckte Uferkante'
      : 'Krautkante, Hafenbecken oder ruhige Nebenzone',
    probability
  };
}
