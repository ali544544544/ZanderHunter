import { useEffect, useMemo, useState } from 'react';
import { getTideOffset } from '../utils/calculations';

const SPOT_LAT = 53.396611;
const SPOT_LNG = 10.221192;
const HALF_TIDE_MS = 6.21 * 60 * 60 * 1000;
const FULL_TIDE_MS = 12.42 * 60 * 60 * 1000;
const PEGEL_STATION = 'ZOLLENSPIEKER';

interface PegelMeasurement {
  timestamp: string;
  value: number;
}

interface WeatherApiResponse {
  current?: {
    time: string;
    temperature_2m: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    cloud_cover: number;
    weather_code: number;
    precipitation: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    surface_pressure: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    cloud_cover: number[];
    weather_code: number[];
    precipitation: number[];
    precipitation_probability?: number[];
  };
  daily?: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
}

interface TideEvent {
  time: Date;
  type: 'HW' | 'NW';
  height: number;
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
}

export interface HoopteForecastRow {
  dateLabel: string;
  highWater: string;
  arrival: string;
  weather: string;
  bestPhase: string;
  score: number;
  reason: string;
  rank?: 1 | 2 | 3;
  thunderstormRisk: boolean;
}

export interface HoopteCurrentAnalysis {
  waterLevel: string;
  tidePhase: string;
  oxygen: string;
  nextBestTime: string;
  nowReason: string;
  nowScore: number;
  nextBestScore: number;
  dhdt: string;
  station: string;
  oxygenStation: string;
  warning?: string;
}

export interface HoopteZanderAnalysis {
  current: HoopteCurrentAnalysis | null;
  rows: HoopteForecastRow[];
  loading: boolean;
  error: string | null;
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

function formatDayLabel(date: Date) {
  const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  return `${weekdays[date.getDay()]} ${formatDate(date)}`;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function weatherCodeShortLabel(code?: number) {
  if (typeof code !== 'number') return 'offen';
  if (code === 0) return 'klar';
  if (code <= 3) return 'bew.';
  if (code < 60) return 'Niesel';
  if (code < 80) return 'Regen';
  if (code < 90) return 'Schauer';
  if (code >= 95) return 'Gewitter';
  return 'wechselh.';
}

function getNearestHourlyIndex(times: string[] = [], date: Date) {
  if (times.length === 0) return -1;
  const target = date.getTime();
  return times.reduce((bestIndex, value, index) => {
    const time = new Date(value).getTime();
    const bestTime = new Date(times[bestIndex]).getTime();
    return Math.abs(time - target) < Math.abs(bestTime - target) ? index : bestIndex;
  }, 0);
}

function generateHoopteTides() {
  const now = new Date();
  const offset = getTideOffset(SPOT_LNG);
  const referenceHighWater = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0);
  const firstHighWater = referenceHighWater.getTime() + offset * 60000 - FULL_TIDE_MS * 3;
  const events: TideEvent[] = [];

  for (let index = 0; index < 22; index += 1) {
    const highWaterTime = firstHighWater + FULL_TIDE_MS * index;
    events.push({
      time: new Date(highWaterTime),
      type: 'HW',
      height: 730,
    });
    events.push({
      time: new Date(highWaterTime + HALF_TIDE_MS),
      type: 'NW',
      height: 190,
    });
  }

  return events.sort((a, b) => a.time.getTime() - b.time.getTime());
}

function calculateDhdt(measurements: PegelMeasurement[]) {
  const sorted = [...measurements]
    .filter((entry) => typeof entry.value === 'number' && parseDate(entry.timestamp))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const latest = sorted[sorted.length - 1];
  if (!latest) return null;

  const latestTime = new Date(latest.timestamp).getTime();
  const oneHourBefore = sorted
    .slice(0, -1)
    .reverse()
    .find((entry) => latestTime - new Date(entry.timestamp).getTime() >= 45 * 60 * 1000);

  if (!oneHourBefore) return null;

  const hours = (latestTime - new Date(oneHourBefore.timestamp).getTime()) / 3600000;
  if (hours <= 0) return null;

  return (latest.value - oneHourBefore.value) / hours;
}

function getTidePhase(now: Date, tides: TideEvent[], dhdt: number | null) {
  if (typeof dhdt === 'number') {
    if (dhdt > 5) return 'steigend';
    if (dhdt < -5) return 'fallend';
  }

  const nearest = tides.reduce<TideEvent | null>((best, event) => {
    if (!best) return event;
    return Math.abs(event.time.getTime() - now.getTime()) < Math.abs(best.time.getTime() - now.getTime())
      ? event
      : best;
  }, null);

  return nearest?.type === 'HW' ? 'Hochwasser-Stillstand' : 'Niedrigwasser-Stillstand';
}

function isNearTwilight(date: Date, sunrise?: string, sunset?: string) {
  const sunriseDate = parseDate(sunrise);
  const sunsetDate = parseDate(sunset);
  const limit = 75 * 60 * 1000;
  const time = date.getTime();
  return Boolean(
    (sunriseDate && Math.abs(time - sunriseDate.getTime()) <= limit)
    || (sunsetDate && Math.abs(time - sunsetDate.getTime()) <= limit)
  );
}

function scoreWeather(weather: WeatherApiResponse, date: Date) {
  const index = getNearestHourlyIndex(weather.hourly?.time, date);
  if (index < 0 || !weather.hourly) {
    return {
      score: 7,
      label: 'Wetterdaten offen',
      thunderstormRisk: false,
      pressureFalling: false,
    };
  }

  const cloud = weather.hourly.cloud_cover[index] ?? 50;
  const precipitation = weather.hourly.precipitation[index] ?? 0;
  const wind = weather.hourly.wind_speed_10m[index] ?? 0;
  const code = weather.hourly.weather_code[index] ?? 0;
  const pressure = weather.hourly.surface_pressure[index] ?? 1013;
  const pressureBefore = weather.hourly.surface_pressure[Math.max(0, index - 3)] ?? pressure;
  const pressureFalling = pressure - pressureBefore < -1;
  const thunderstormRisk = code >= 95;

  let score = 4;
  if (cloud >= 60) score += 5;
  else if (cloud < 20) score -= 2;
  if (precipitation > 0 && precipitation <= 2) score += 4;
  else if (precipitation > 8) score -= 2;
  if (wind >= 6 && wind <= 25) score += 2;
  if (pressureFalling) score += 2;
  if (thunderstormRisk) score -= 8;

  return {
    score: Math.round(clamp(score, 0, 15)),
    label: `${weatherCodeShortLabel(code)}, ${Math.round(cloud)}%, ${wind.toFixed(0)} km/h`,
    thunderstormRisk,
    pressureFalling,
  };
}

function scoreSession(
  highWater: Date,
  weather: WeatherApiResponse,
  tides: TideEvent[],
  dhdt: number | null,
  currentTime: Date = highWater
): SessionScore {
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
  const tideHub = nextLowWater ? highWater.getTime() - nextLowWater.time.getTime() : null;
  const fallingAfterHighWater = minutesFromHighWater >= 0 || currentTime.getTime() >= highWater.getTime();
  let flowScore = fallingAfterHighWater ? 20 : 12;
  if (typeof dhdt === 'number' && dhdt < -8) flowScore += 5;
  else if (typeof dhdt === 'number' && dhdt < -3) flowScore += 3;
  if (tideHub) flowScore += 1;

  const weatherScore = scoreWeather(weather, highWater);
  const dayIndex = weather.daily?.time.findIndex((value) => sameLocalDay(new Date(value), highWater)) ?? -1;
  const twilight = isNearTwilight(highWater, weather.daily?.sunrise[dayIndex], weather.daily?.sunset[dayIndex]);
  const lightScore = twilight ? 10 : weatherScore.label.includes('bewölkt') ? 5 : 3;
  const waterScore = 3;
  const total = Math.round(clamp(tideScore + clamp(flowScore, 0, 25) + weatherScore.score + lightScore + waterScore));

  const reasonParts = [
    inTopWindow || inStartWindow ? 'HW-Fenster' : 'Randfenster',
    fallingAfterHighWater ? 'Ablauf' : 'vor HW',
    weatherScore.pressureFalling ? 'Druck fallend' : null,
    twilight ? 'Dämm.' : null,
    weatherScore.thunderstormRisk ? 'Gewitter' : null,
    'O2 offen',
  ].filter(Boolean);

  return {
    total,
    tideScore,
    flowScore: Math.round(clamp(flowScore, 0, 25)),
    weatherScore: weatherScore.score,
    lightScore,
    waterScore,
    reason: reasonParts.join(', '),
    thunderstormRisk: weatherScore.thunderstormRisk,
  };
}

function buildRows(weather: WeatherApiResponse, tides: TideEvent[], dhdt: number | null) {
  const now = new Date();
  const rows: Array<HoopteForecastRow & { highWaterDate: Date }> = [];

  for (let day = 0; day < 7; day += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + day);
    const highWaters = tides.filter((event) => event.type === 'HW' && sameLocalDay(event.time, date));
    const bestHighWater = highWaters
      .map((event) => ({
        event,
        score: scoreSession(event.time, weather, tides, dhdt),
      }))
      .sort((a, b) => b.score.total - a.score.total)[0];

    if (!bestHighWater) continue;

    const arrival = new Date(bestHighWater.event.time.getTime() - 30 * 60000);
    const end = new Date(bestHighWater.event.time.getTime() + 2 * 60 * 60000);
    const weatherInfo = scoreWeather(weather, bestHighWater.event.time);
    const phase = `${formatTime(bestHighWater.event.time)}-${formatTime(end)}`;

    rows.push({
      dateLabel: formatDayLabel(date),
      highWater: formatTime(bestHighWater.event.time),
      arrival: `ab ${formatTime(arrival)}`,
      weather: weatherInfo.label,
      bestPhase: phase,
      score: bestHighWater.score.total,
      reason: bestHighWater.score.reason,
      thunderstormRisk: bestHighWater.score.thunderstormRisk,
      highWaterDate: bestHighWater.event.time,
    });
  }

  const ranked = [...rows].sort((a, b) => b.score - a.score).slice(0, 3);
  return rows.map(({ highWaterDate: _highWaterDate, ...row }) => {
    const rankIndex = ranked.findIndex((rankedRow) => rankedRow.highWaterDate.getTime() === _highWaterDate.getTime());
    return {
      ...row,
      rank: rankIndex >= 0 ? (rankIndex + 1) as 1 | 2 | 3 : undefined,
    };
  });
}

export function useHoopteZanderAnalysis(enabled: boolean): HoopteZanderAnalysis {
  const [current, setCurrent] = useState<HoopteCurrentAnalysis | null>(null);
  const [rows, setRows] = useState<HoopteForecastRow[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const tides = useMemo(generateHoopteTides, []);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    async function fetchAnalysis() {
      setLoading(true);
      setError(null);

      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${SPOT_LAT}&longitude=${SPOT_LNG}&current=temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover,weather_code,precipitation&hourly=temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover,weather_code,precipitation,precipitation_probability&daily=sunrise,sunset&forecast_days=7&timezone=Europe/Berlin&_cb=${Date.now()}`;
        const currentLevelUrl = `https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/${PEGEL_STATION}/W/currentmeasurement.json?_cb=${Date.now()}`;
        const measurementsUrl = `https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/${PEGEL_STATION}/W/measurements.json?start=PT24H&_cb=${Date.now()}`;

        const [weatherRes, levelRes, measurementsRes] = await Promise.all([
          fetch(weatherUrl),
          fetch(currentLevelUrl),
          fetch(measurementsUrl),
        ]);

        if (!weatherRes.ok) throw new Error('Wetterdaten konnten nicht geladen werden.');
        const weather = await weatherRes.json() as WeatherApiResponse;
        const level = levelRes.ok ? await levelRes.json() as PegelMeasurement : null;
        const measurements = measurementsRes.ok ? await measurementsRes.json() as PegelMeasurement[] : [];
        const dhdt = calculateDhdt(measurements);
        const now = new Date();
        const tidePhase = getTidePhase(now, tides, dhdt);
        const allFutureHighWaters = tides
          .filter((event) => event.type === 'HW' && event.time > now)
          .map((event) => ({
            event,
            score: scoreSession(event.time, weather, tides, dhdt),
          }))
          .sort((a, b) => a.event.time.getTime() - b.event.time.getTime());
        const nextBest = allFutureHighWaters[0];
        const previousHighWater = [...tides].reverse().find((event) => event.type === 'HW' && event.time <= now) ?? tides[0];
        const nowScore = scoreSession(previousHighWater.time, weather, tides, dhdt, now);
        const warning = nowScore.thunderstormRisk || nextBest?.score.thunderstormRisk
          ? 'Sicherheitswarnung: Gewitterrisiko in den Daten, Session kritisch prüfen.'
          : undefined;

        if (cancelled) return;

        setRows(buildRows(weather, tides, dhdt));
        setCurrent({
          waterLevel: level ? `${level.value.toFixed(0)} cm` : 'kein aktueller Pegelwert',
          tidePhase,
          oxygen: 'keine aktuellen O2-Daten gefunden',
          nextBestTime: nextBest ? `HW ${formatDayLabel(nextBest.event.time)} ${formatTime(nextBest.event.time)}` : 'kein HW-Fenster gefunden',
          nowReason: `Jetzt: ${nowScore.reason}. ${typeof dhdt === 'number' ? `dH/dt ${dhdt.toFixed(1)} cm/h.` : 'dH/dt nicht verfügbar.'}`,
          nowScore: nowScore.total,
          nextBestScore: nextBest?.score.total ?? 0,
          dhdt: typeof dhdt === 'number' ? `${dhdt.toFixed(1)} cm/h` : 'nicht verfügbar',
          station: 'Pegel Zollenspieker / Elbe (PegelOnline)',
          oxygenStation: 'keine aktuellen O2-Daten gefunden',
          warning,
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
  }, [enabled, tides]);

  return {
    current,
    rows,
    loading,
    error,
  };
}
