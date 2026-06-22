import { useEffect, useState } from 'react';
import SunCalc from 'suncalc';
import { getTideOffset } from '../utils/calculations';

const SPOT_LAT = 53.396611;
const SPOT_LNG = 10.221192;
const HALF_TIDE_MS = 6.21 * 60 * 60 * 1000;
const FULL_TIDE_MS = 12.42 * 60 * 60 * 1000;

const PEGEL_STATION_UUID = '3de8ea26-ab29-4e46-adad-06198ba2e0b7';
const PEGEL_HTML_URL = 'https://www.pegelonline.wsv.de/webservices/zeitreihe/visualisierung?pegelnummer=5930090';
const PEGEL_CURRENT_URL = `https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/${PEGEL_STATION_UUID}/W/currentmeasurement.json`;
const PEGEL_MEASUREMENTS_URL = `https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/${PEGEL_STATION_UUID}/W/measurements.json?start=P7D`;
const BSH_WATERLEVEL_URL = 'https://wasserstand.bsh.de/hamburg_zollenspieker';
const BSH_TIDES_URL = 'https://gezeiten.bsh.de/';
const BRIGHT_SKY_CURRENT_URL = `https://api.brightsky.dev/current_weather?lat=${SPOT_LAT}&lon=${SPOT_LNG}`;
const WGMN_BUNTHAUS_URL = 'https://www.wgmn-hamburg.de/daten-2/ReportAktuelleMesswerte-BU-2.html';
const WGMN_DATA_SERVICE_URL = 'https://www.hamburg.de/politik-und-verwaltung/behoerden/bukea/hu/umweltuntersuchungen/wasseruntersuchungen/wasserguetemessnetz/service-gewaesserdaten';
const UNDINE_BUNTHAUS_URL = 'https://undine.bafg.de/elbe/guetemessstellen/elbe_mst_bunthaus.html';
const UNDINE_WTO2_URL = 'https://undine.bafg.de/elbe/zustand-aktuell/elbe_akt_WTO2.html';

interface PegelMeasurement {
  timestamp: string;
  value: number;
}

interface BrightSkyWeatherRecord {
  timestamp: string;
  temperature?: number | null;
  pressure_msl?: number | null;
  wind_speed?: number | null;
  wind_gust_speed?: number | null;
  wind_direction?: number | null;
  cloud_cover?: number | null;
  precipitation?: number | null;
  condition?: string | null;
  icon?: string | null;
}

interface BrightSkyWeatherResponse {
  weather?: BrightSkyWeatherRecord[];
}

interface BrightSkyCurrentResponse {
  weather?: BrightSkyWeatherRecord;
}

interface BrightSkyBundle {
  current?: BrightSkyWeatherRecord;
  hourly: BrightSkyWeatherRecord[];
}

interface BshTideSnapshot {
  sourceUrl?: string;
  station?: string;
  bshnr?: string;
  fetchedAt?: string;
  events?: Array<{
    timestamp: string;
    height: number;
    type: 'HW' | 'NW';
    phase?: string | null;
  }>;
}

interface WaterQualityValue {
  value: number;
  unit: string;
  timestamp?: string;
}

interface WaterQualitySnapshot {
  station?: string;
  sourceUrl?: string;
  fetchedAt?: string;
  proxyNote?: string;
  measurements?: {
    oxygenMgL?: WaterQualityValue;
    oxygenSaturationPercent?: WaterQualityValue;
    waterTemperatureC?: WaterQualityValue;
    turbidityFnu?: WaterQualityValue;
  };
}

interface TideEvent {
  time: Date;
  type: 'HW' | 'NW';
  height: number;
  phase?: string | null;
  source: 'BSH' | 'Fallback';
}

interface WeatherScore {
  score: number;
  label: string;
  thunderstormRisk: boolean;
  stormRisk: boolean;
  pressureFalling: boolean;
  cloudCover: number;
  warningText?: string;
}

interface WaterScore {
  score: number;
  label: string;
  warning?: string;
}

interface SessionScore {
  total: number;
  tideScore: number;
  flowScore: number;
  weatherScore: number;
  lightScore: number;
  waterScore: number;
  reason: string;
  thunderstormRisk: boolean;
  stormRisk: boolean;
  warningText?: string;
}

export interface HoopteForecastRow {
  date: string;
  day: string;
  highWater: string;
  arrival: string;
  weather: string;
  bestPhase: string;
  score: number;
  reason: string;
  isDaytimeWindow: boolean;
  thunderstormRisk: boolean;
  stormRisk: boolean;
  warningText?: string;
}

export interface HoopteSourceLink {
  label: string;
  url: string;
}

export interface HoopteCurrentAnalysis {
  waterLevel: string;
  tidePhase: string;
  oxygen: string;
  waterQuality: string;
  nextBestTime: string;
  nowReason: string;
  nowScore: number;
  nextBestScore: number;
  dhdt: string;
  station: string;
  oxygenStation: string;
  tideSource: string;
  warning?: string;
  sourceLinks: HoopteSourceLink[];
}

export interface HoopteZanderAnalysis {
  current: HoopteCurrentAnalysis | null;
  rows: HoopteForecastRow[];
  loading: boolean;
  error: string | null;
}

function assetUrl(path: string) {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${path.replace(/^\/+/, '')}`;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function buildBrightSkyPeriodUrl(now: Date) {
  return `https://api.brightsky.dev/weather?lat=${SPOT_LAT}&lon=${SPOT_LNG}&date=${localDateKey(now)}&last_date=${localDateKey(addDays(now, 7))}&tz=Europe/Berlin`;
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDayLabel(date: Date) {
  const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  return `${weekdays[date.getDay()]} ${formatDate(date)}`;
}

function formatWeekday(date: Date) {
  const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  return weekdays[date.getDay()];
}

function formatDecimal(value: number, digits = 1) {
  return new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function parseDate(value?: string) {
  if (!value) return null;
  const germanDate = value.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
  if (germanDate) {
    const [, day, month, year, hour, minute] = germanDate;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  }
  const normalized = value.includes(' ') ? value.replace(' ', 'T') : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}`);
  if (!response.ok) throw new Error(`Datenquelle nicht erreichbar: ${url}`);
  return response.json() as Promise<T>;
}

function weatherConditionShortLabel(record?: BrightSkyWeatherRecord) {
  const condition = record?.condition ?? 'dry';
  const cloud = record?.cloud_cover ?? 50;

  if (condition === 'thunderstorm') return 'Gewitter';
  if (condition === 'rain') return 'Regen';
  if (condition === 'sleet') return 'Schnee/R.';
  if (condition === 'snow') return 'Schnee';
  if (condition === 'hail') return 'Hagel';
  if (condition === 'fog') return 'Nebel';
  if (cloud >= 80) return 'bew.';
  if (cloud >= 35) return 'wolkig';
  return 'klar';
}

function getNearestWeatherRecord(records: BrightSkyWeatherRecord[], date: Date) {
  if (records.length === 0) return { record: undefined, index: -1 };
  const target = date.getTime();
  const index = records.reduce((bestIndex, record, currentIndex) => {
    const time = parseDate(record.timestamp)?.getTime();
    const bestTime = parseDate(records[bestIndex].timestamp)?.getTime();
    if (!time) return bestIndex;
    if (!bestTime) return currentIndex;
    return Math.abs(time - target) < Math.abs(bestTime - target) ? currentIndex : bestIndex;
  }, 0);

  return { record: records[index], index };
}

function generateFallbackTides() {
  const now = new Date();
  const offset = getTideOffset(SPOT_LNG);
  const referenceHighWater = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0);
  const firstHighWater = referenceHighWater.getTime() + offset * 60000 - FULL_TIDE_MS * 3;
  const events: TideEvent[] = [];

  for (let index = 0; index < 24; index += 1) {
    const highWaterTime = firstHighWater + FULL_TIDE_MS * index;
    events.push({
      time: new Date(highWaterTime),
      type: 'HW',
      height: 730,
      source: 'Fallback',
    });
    events.push({
      time: new Date(highWaterTime + HALF_TIDE_MS),
      type: 'NW',
      height: 190,
      source: 'Fallback',
    });
  }

  return events.sort((a, b) => a.time.getTime() - b.time.getTime());
}

function parseBshTides(snapshot: BshTideSnapshot | null) {
  const events: TideEvent[] = [];

  for (const event of snapshot?.events ?? []) {
    const time = parseDate(event.timestamp);
    if (!time) continue;
    events.push({
      time,
      type: event.type,
      height: event.height,
      phase: event.phase,
      source: 'BSH',
    });
  }

  events.sort((a, b) => a.time.getTime() - b.time.getTime());

  return events.length > 0 ? events : generateFallbackTides();
}

function calculateDhdt(measurements: PegelMeasurement[]) {
  const sorted = [...measurements]
    .filter((entry) => typeof entry.value === 'number' && parseDate(entry.timestamp))
    .sort((a, b) => (parseDate(a.timestamp)?.getTime() ?? 0) - (parseDate(b.timestamp)?.getTime() ?? 0));
  const latest = sorted[sorted.length - 1];
  if (!latest) return null;

  const latestTime = parseDate(latest.timestamp)?.getTime();
  if (!latestTime) return null;
  const oneHourBefore = sorted
    .slice(0, -1)
    .reverse()
    .find((entry) => latestTime - (parseDate(entry.timestamp)?.getTime() ?? latestTime) >= 45 * 60 * 1000);

  if (!oneHourBefore) return null;

  const oneHourBeforeTime = parseDate(oneHourBefore.timestamp)?.getTime();
  if (!oneHourBeforeTime) return null;
  const hours = (latestTime - oneHourBeforeTime) / 3600000;
  if (hours <= 0) return null;

  return (latest.value - oneHourBefore.value) / hours;
}

function getTidePhase(now: Date, tides: TideEvent[], dhdt: number | null) {
  const nearEvent = tides.find((event) => Math.abs(event.time.getTime() - now.getTime()) <= 25 * 60 * 1000);
  if (nearEvent?.type === 'HW') return 'Hochwasser-Stillstand';
  if (nearEvent?.type === 'NW') return 'Niedrigwasser-Stillstand';

  if (typeof dhdt === 'number') {
    if (dhdt > 5) return 'steigend';
    if (dhdt < -5) return 'fallend';
  }

  const previous = [...tides].reverse().find((event) => event.time <= now);
  const next = tides.find((event) => event.time > now);
  if (previous?.type === 'NW' && next?.type === 'HW') return 'steigend';
  if (previous?.type === 'HW' && next?.type === 'NW') return 'fallend';

  return 'Tidephase offen';
}

function intervalOverlaps(start: number, end: number, rangeStart: number, rangeEnd: number) {
  return start <= rangeEnd && end >= rangeStart;
}

function scoreLightWindow(highWater: Date, cloudCover: number) {
  const times = SunCalc.getTimes(highWater, SPOT_LAT, SPOT_LNG);
  const start = highWater.getTime();
  const end = highWater.getTime() + 2 * 60 * 60 * 1000;
  const mid = highWater.getTime() + 60 * 60 * 1000;
  const midDate = new Date(mid);
  const sunrise = times.sunrise.getTime();
  const sunset = times.sunset.getTime();
  const twilightLimit = 75 * 60 * 1000;
  const eveningStart = sunset - 3 * 60 * 60 * 1000;
  const twilight = intervalOverlaps(start, end, sunrise - twilightLimit, sunrise + twilightLimit)
    || intervalOverlaps(start, end, sunset - twilightLimit, sunset + twilightLimit);
  const night = mid < sunrise || mid > sunset;
  const evening = intervalOverlaps(start, end, eveningStart, sunset + twilightLimit);
  const brightMidday = midDate.getHours() >= 11 && midDate.getHours() <= 15 && cloudCover < 35;

  if (twilight) return { score: 10, label: 'Dämm.' };
  if (night) return { score: 10, label: 'Nacht' };
  if (evening) return { score: 8, label: 'Abend' };
  if (brightMidday) return { score: 1, label: 'Mittagssonne' };
  if (cloudCover >= 60) return { score: 5, label: 'Wolkenlicht' };
  return { score: 3, label: null };
}

function scoreWeather(weather: BrightSkyBundle, date: Date): WeatherScore {
  const nearest = getNearestWeatherRecord(weather.hourly, date);
  const record = nearest.record ?? weather.current;
  const before = nearest.index >= 3 ? weather.hourly[nearest.index - 3] : weather.current;

  if (!record) {
    return {
      score: 7,
      label: 'Wetter offen',
      thunderstormRisk: false,
      stormRisk: false,
      pressureFalling: false,
      cloudCover: 50,
    };
  }

  const cloud = record.cloud_cover ?? 50;
  const precipitation = record.precipitation ?? 0;
  const wind = record.wind_speed ?? 0;
  const gust = record.wind_gust_speed ?? wind;
  const pressure = record.pressure_msl ?? 1013;
  const pressureBefore = before?.pressure_msl ?? pressure;
  const pressureFalling = pressure - pressureBefore < -1;
  const condition = record.condition ?? '';
  const icon = record.icon ?? '';
  const thunderstormRisk = condition === 'thunderstorm' || icon.includes('thunderstorm');
  const stormRisk = wind >= 45 || gust >= 55;

  let score = 4;
  if (cloud >= 60) score += 5;
  else if (cloud < 20) score -= 2;
  if (precipitation > 0 && precipitation <= 2) score += 4;
  else if (precipitation > 8) score -= 2;
  if (wind >= 6 && wind <= 25) score += 2;
  if (pressureFalling) score += 2;
  if (thunderstormRisk) score -= 8;
  if (stormRisk) score -= 8;
  else if (wind > 35 || gust > 45) score -= 4;

  return {
    score: Math.round(clamp(score, 0, 15)),
    label: `${weatherConditionShortLabel(record)}, ${Math.round(cloud)}%, ${wind.toFixed(0)} km/h`,
    thunderstormRisk,
    stormRisk,
    pressureFalling,
    cloudCover: cloud,
    warningText: thunderstormRisk
      ? 'Gewitter'
      : stormRisk
        ? 'Sturm'
        : undefined,
  };
}

function scoreWaterQuality(waterQuality: WaterQualitySnapshot | null): WaterScore {
  const oxygen = waterQuality?.measurements?.oxygenMgL?.value;
  if (typeof oxygen !== 'number') {
    return {
      score: 3,
      label: 'O2 offen',
    };
  }

  if (oxygen <= 3) {
    return {
      score: 0,
      label: 'O2 kritisch',
      warning: 'Sauerstoff <=3 mg/l: Angelaktivität kritisch bewerten.',
    };
  }

  if (oxygen < 5) {
    return {
      score: 1,
      label: 'O2 niedrig',
      warning: 'Sauerstoff <5 mg/l: deutlich abwerten.',
    };
  }

  if (oxygen < 6) {
    return {
      score: 3,
      label: 'O2 knapp',
    };
  }

  return {
    score: 5,
    label: 'O2 ok',
  };
}

function isBetweenEightAndTwenty(date: Date) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= 8 * 60 && minutes <= 20 * 60;
}

function scoreSession(
  highWaterEvent: TideEvent,
  weather: BrightSkyBundle,
  tides: TideEvent[],
  dhdt: number | null,
  waterQuality: WaterQualitySnapshot | null,
  currentTime: Date = highWaterEvent.time
): SessionScore {
  const highWater = highWaterEvent.time;
  const minutesFromHighWater = (currentTime.getTime() - highWater.getTime()) / 60000;
  const inTopWindow = minutesFromHighWater >= 0 && minutesFromHighWater <= 120;
  const inStartWindow = minutesFromHighWater >= -30 && minutesFromHighWater < 0;
  const nearWindow = minutesFromHighWater >= -90 && minutesFromHighWater <= 180;

  const tideScore = inTopWindow || inStartWindow
    ? 45
    : nearWindow
      ? 32
      : minutesFromHighWater > 120 && minutesFromHighWater <= 240
        ? 18
        : 8;

  const nextLowWater = tides.find((event) => event.type === 'NW' && event.time > highWater);
  const previousLowWater = [...tides].reverse().find((event) => event.type === 'NW' && event.time < highWater);
  const tideHub = nextLowWater && previousLowWater ? Math.abs(highWaterEvent.height - nextLowWater.height) : null;
  const fallingAfterHighWater = minutesFromHighWater >= 0 || currentTime.getTime() >= highWater.getTime();
  let flowScore = fallingAfterHighWater ? 20 : 12;
  if (typeof dhdt === 'number' && dhdt < -8) flowScore += 5;
  else if (typeof dhdt === 'number' && dhdt < -3) flowScore += 3;
  if (typeof tideHub === 'number' && tideHub >= 180) flowScore += 1;

  const weatherScore = scoreWeather(weather, highWater);
  const light = scoreLightWindow(highWater, weatherScore.cloudCover);
  const waterScore = scoreWaterQuality(waterQuality);
  const total = Math.round(clamp(tideScore + clamp(flowScore, 0, 25) + weatherScore.score + light.score + waterScore.score));

  const reasonParts = [
    inTopWindow || inStartWindow ? 'HW-Fenster' : 'Randfenster',
    fallingAfterHighWater ? 'Ablauf' : 'vor HW',
    weatherScore.pressureFalling ? 'Druck fallend' : null,
    light.label,
    weatherScore.thunderstormRisk ? 'Gewitter' : null,
    weatherScore.stormRisk ? 'Sturm' : null,
    waterScore.label,
  ].filter(Boolean);
  const warningText = [
    weatherScore.warningText,
    waterScore.warning,
  ].filter(Boolean).join(', ') || undefined;

  return {
    total,
    tideScore,
    flowScore: Math.round(clamp(flowScore, 0, 25)),
    weatherScore: weatherScore.score,
    lightScore: light.score,
    waterScore: waterScore.score,
    reason: reasonParts.join(', '),
    thunderstormRisk: weatherScore.thunderstormRisk,
    stormRisk: weatherScore.stormRisk,
    warningText,
  };
}

function buildRows(
  weather: BrightSkyBundle,
  tides: TideEvent[],
  dhdt: number | null,
  waterQuality: WaterQualitySnapshot | null
) {
  const now = new Date();
  const endDate = addDays(now, 7);
  const rows: HoopteForecastRow[] = [];
  const highWaters = tides
    .filter((event) => (
      event.type === 'HW'
      && event.time > now
      && event.time <= endDate
    ))
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  for (const highWater of highWaters) {
    const score = scoreSession(highWater, weather, tides, dhdt, waterQuality);
    const arrival = new Date(highWater.time.getTime() - 30 * 60000);
    const end = new Date(highWater.time.getTime() + 2 * 60 * 60000);
    const weatherInfo = scoreWeather(weather, highWater.time);
    const phase = `${formatTime(highWater.time)}-${formatTime(end)}`;

    rows.push({
      date: formatDate(highWater.time),
      day: formatWeekday(highWater.time),
      highWater: formatTime(highWater.time),
      arrival: `ab ${formatTime(arrival)}`,
      weather: weatherInfo.label,
      bestPhase: phase,
      score: score.total,
      reason: score.reason,
      isDaytimeWindow: isBetweenEightAndTwenty(highWater.time),
      thunderstormRisk: score.thunderstormRisk,
      stormRisk: score.stormRisk,
      warningText: score.warningText,
    });
  }

  return rows;
}

function formatOxygen(waterQuality: WaterQualitySnapshot | null) {
  const oxygen = waterQuality?.measurements?.oxygenMgL;
  if (!oxygen) return 'keine aktuellen O2-Daten gefunden';
  return `${formatDecimal(oxygen.value)} ${oxygen.unit} Proxy`;
}

function formatWaterQuality(waterQuality: WaterQualitySnapshot | null) {
  const temperature = waterQuality?.measurements?.waterTemperatureC;
  const turbidity = waterQuality?.measurements?.turbidityFnu;
  const oxygenSaturation = waterQuality?.measurements?.oxygenSaturationPercent;
  const parts = [
    temperature ? `${formatDecimal(temperature.value)}°C` : null,
    turbidity ? `Trübung ${formatDecimal(turbidity.value)} ${turbidity.unit}` : null,
    oxygenSaturation ? `O2 ${formatDecimal(oxygenSaturation.value)}%` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'keine aktuellen Wasserqualitätsdaten';
}

function formatOxygenStation(waterQuality: WaterQualitySnapshot | null) {
  const station = waterQuality?.station ?? 'WGMN Bunthaus';
  const timestamp = waterQuality?.measurements?.oxygenMgL?.timestamp
    ? parseDate(waterQuality.measurements.oxygenMgL.timestamp)
    : null;
  const stand = timestamp ? `, Stand ${formatDateTime(timestamp)}` : '';
  return waterQuality?.measurements?.oxygenMgL
    ? `Proxy-Wert: ${station}${stand}, nicht exakt am Spot`
    : 'keine aktuellen O2-Daten gefunden';
}

function getSourceLinks(brightSkyPeriodUrl: string): HoopteSourceLink[] {
  return [
    { label: 'PegelOnline', url: PEGEL_HTML_URL },
    { label: 'Pegel API', url: PEGEL_CURRENT_URL },
    { label: 'Pegel Verlauf', url: PEGEL_MEASUREMENTS_URL },
    { label: 'BSH Wasserstand', url: BSH_WATERLEVEL_URL },
    { label: 'BSH Gezeiten', url: BSH_TIDES_URL },
    { label: 'Bright Sky jetzt', url: BRIGHT_SKY_CURRENT_URL },
    { label: 'Bright Sky 7 Tage', url: brightSkyPeriodUrl },
    { label: 'WGMN Bunthaus', url: WGMN_BUNTHAUS_URL },
    { label: 'WGMN Service', url: WGMN_DATA_SERVICE_URL },
    { label: 'Undine Bunthaus', url: UNDINE_BUNTHAUS_URL },
    { label: 'Undine O2', url: UNDINE_WTO2_URL },
  ];
}

export function useHoopteZanderSourceAnalysis(enabled: boolean): HoopteZanderAnalysis {
  const [current, setCurrent] = useState<HoopteCurrentAnalysis | null>(null);
  const [rows, setRows] = useState<HoopteForecastRow[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    async function fetchAnalysis() {
      setLoading(true);
      setError(null);

      try {
        const now = new Date();
        const brightSkyPeriodUrl = buildBrightSkyPeriodUrl(now);
        const [
          weatherPeriod,
          currentWeather,
          tideSnapshot,
          level,
          measurements,
          waterQuality,
        ] = await Promise.all([
          fetchJson<BrightSkyWeatherResponse>(brightSkyPeriodUrl),
          fetchJson<BrightSkyCurrentResponse>(BRIGHT_SKY_CURRENT_URL),
          fetchJson<BshTideSnapshot>(assetUrl('data/hoopte-bsh-tides.json')).catch(() => null),
          fetchJson<PegelMeasurement>(PEGEL_CURRENT_URL).catch(() => null),
          fetchJson<PegelMeasurement[]>(PEGEL_MEASUREMENTS_URL).catch(() => []),
          fetchJson<WaterQualitySnapshot>(assetUrl('data/hoopte-water-quality.json')).catch(() => null),
        ]);

        if (!weatherPeriod.weather || weatherPeriod.weather.length === 0) {
          throw new Error('Bright-Sky-Wetterdaten konnten nicht geladen werden.');
        }

        const weather: BrightSkyBundle = {
          current: currentWeather.weather,
          hourly: weatherPeriod.weather,
        };
        const tides = parseBshTides(tideSnapshot);
        const tideSource = tides.some((event) => event.source === 'BSH')
          ? 'BSH Gezeiten Hamburg-Zollenspieker (731P)'
          : 'Fallback-Tide, BSH-Snapshot nicht verfügbar';
        const dhdt = calculateDhdt(measurements);
        const tidePhase = getTidePhase(now, tides, dhdt);
        const allFutureHighWaters = tides
          .filter((event) => event.type === 'HW' && event.time > now)
          .map((event) => ({
            event,
            score: scoreSession(event, weather, tides, dhdt, waterQuality),
          }))
          .sort((a, b) => a.event.time.getTime() - b.event.time.getTime());
        const nextBest = allFutureHighWaters[0];
        const referenceHighWater = [...tides].reverse().find((event) => event.type === 'HW' && event.time <= now)
          ?? allFutureHighWaters[0]?.event
          ?? tides[0];
        const nowScore = scoreSession(referenceHighWater, weather, tides, dhdt, waterQuality, now);
        const waterScore = scoreWaterQuality(waterQuality);
        const warningParts = [
          nowScore.thunderstormRisk || nextBest?.score.thunderstormRisk
            ? 'Sicherheitswarnung: Gewitterrisiko in den Daten, Session kritisch prüfen.'
            : null,
          nowScore.stormRisk || nextBest?.score.stormRisk
            ? 'Sicherheitswarnung: Sturmrisiko in den Daten, Session kritisch prüfen.'
            : null,
          waterScore.warning,
        ].filter(Boolean);

        if (cancelled) return;

        setRows(buildRows(weather, tides, dhdt, waterQuality));
        setCurrent({
          waterLevel: level ? `${level.value.toFixed(0)} cm` : 'kein aktueller Pegelwert',
          tidePhase,
          oxygen: formatOxygen(waterQuality),
          waterQuality: formatWaterQuality(waterQuality),
          nextBestTime: nextBest ? `HW ${formatDayLabel(nextBest.event.time)} ${formatTime(nextBest.event.time)}` : 'kein HW-Fenster gefunden',
          nowReason: `Jetzt: ${nowScore.reason}. ${typeof dhdt === 'number' ? `dH/dt ${dhdt.toFixed(1)} cm/h.` : 'dH/dt nicht verfügbar.'}`,
          nowScore: nowScore.total,
          nextBestScore: nextBest?.score.total ?? 0,
          dhdt: typeof dhdt === 'number' ? `${dhdt.toFixed(1)} cm/h` : 'nicht verfügbar',
          station: 'Pegel Zollenspieker / Elbe (PegelOnline UUID 3de8...)',
          oxygenStation: formatOxygenStation(waterQuality),
          tideSource,
          warning: warningParts.length > 0 ? warningParts.join(' ') : undefined,
          sourceLinks: getSourceLinks(brightSkyPeriodUrl),
        });
      } catch (analysisError) {
        if (!cancelled) {
          setError(analysisError instanceof Error ? analysisError.message : 'Hoopte-Analyse konnte nicht geladen werden.');
          setCurrent(null);
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchAnalysis();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    current,
    rows,
    loading,
    error,
  };
}
