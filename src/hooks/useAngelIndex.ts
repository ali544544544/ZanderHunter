import { useWeather } from './useWeather';
import { usePegel } from './usePegel';
import { useTide } from './useTide';
import { useSolunar } from './useSolunar';
import { useMoon } from './useMoon';
import { calculateBarschIndex, calculateHechtIndex, calculateZanderIndex, getStromPhase, getSolunarStatus } from '../utils/calculations';
import type { AngelConditions, TargetFish } from '../utils/calculations';

function findCurrentHourIndex(times: string[], date: Date) {
  const hour = new Date(date);
  hour.setMinutes(0, 0, 0);
  const matched = times.findIndex(time => new Date(time).getTime() === hour.getTime());
  return matched >= 0 ? matched : Math.max(0, times.length - 48 + date.getHours());
}

function getScoreDetails(targetFish: TargetFish, input: Parameters<typeof calculateBarschIndex>[0]) {
  if (targetFish === 'hecht') return calculateHechtIndex(input);
  if (targetFish === 'barsch') return calculateBarschIndex(input);
  return calculateZanderIndex(input);
}

export function useAngelIndex(targetFish: TargetFish = 'zander') {
  const weather = useWeather();
  const pegel = usePegel();
  const tide = useTide();
  const solunar = useSolunar();
  const moon = useMoon();

  const isLoading = weather.loading || pegel.loading || tide.loading;

  if (isLoading || !weather.data || !pegel.data) {
    return {
      score: 0,
      loading: true,
      conditions: null,
      weather: null,
      pegel: null,
      tide: [],
      moon: null,
      hourlyScores: [],
      startHour: undefined,
      scoreDetails: null
    };
  }

  const now = new Date();
  const stromPhase = getStromPhase(now, tide.events);

  const sunrise = new Date(weather.data.sunrise);
  const sunset = new Date(weather.data.sunset);
  let tageszeit: 'dämmerung' | 'nacht' | 'tag' = 'tag';

  const diffSunrise = Math.abs(now.getTime() - sunrise.getTime()) / 60000;
  const diffSunset = Math.abs(now.getTime() - sunset.getTime()) / 60000;

  if (diffSunrise < 45 || diffSunset < 45) {
    tageszeit = 'dämmerung';
  } else if (now < sunrise || now > sunset) {
    tageszeit = 'nacht';
  }

  const conditions: AngelConditions = {
    stromPhase,
    luftdruckTrend: weather.data.pressureTrend,
    wasserTemp: pegel.data.waterTemp,
    tageszeit,
    solunar: solunar.status,
    mondPhase: moon.name,
    windSpeed: weather.data.windSpeed,
    niederschlag48h: weather.data.precipitation48h,
    tideEvents: tide.events
  };

  let trübung: 'getrübt' | 'mittel' | 'klar' = 'mittel';
  if (weather.data.precipitation48h > 20 && pegel.data.waterLevel > 500) trübung = 'getrübt';
  else if (weather.data.precipitation48h < 5 && pegel.data.waterLevel < 450) trübung = 'klar';

  const secchiCm = trübung === 'klar' ? 90 : trübung === 'getrübt' ? 25 : 60;
  const currentHourIndex = findCurrentHourIndex(weather.data.hourly.time, now);

  const baseScoreInput = {
    ...conditions,
    pressure: weather.data.pressure,
    pressure3hAgo: weather.data.hourly.pressure[currentHourIndex - 3],
    pressure6hAgo: weather.data.hourly.pressure[currentHourIndex - 6],
    pressureHistory: weather.data.hourly.pressure.slice(Math.max(0, currentHourIndex - 72), currentHourIndex + 1),
    cloudCover: weather.data.cloudCover,
    uvIndex: weather.data.uvIndex,
    windDirection: weather.data.windDirection,
    sunrise: weather.data.sunrise,
    sunset: weather.data.sunset,
    date: now,
    shoreDirection: 90,
    secchiCm,
    structureType: 'Spundwand'
  };

  const scoreDetails = getScoreDetails(targetFish, baseScoreInput);
  const score = scoreDetails.total;

  const hourlyScores: number[] = [];
  const startHour = now.getHours() - 4;

  for (let i = 0; i < 24; i++) {
    const hTime = new Date(now);
    hTime.setHours(startHour + i, 0, 0, 0);

    const hIdx = currentHourIndex + (startHour + i - now.getHours());
    const hTimeStartOfDay = new Date(hTime.getFullYear(), hTime.getMonth(), hTime.getDate()).getTime();
    const nowStartOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayDiff = Math.round((hTimeStartOfDay - nowStartOfDay) / 86400000);
    const dayOffset = 1 + dayDiff;

    const hSunrise = new Date(weather.data.sunrises[dayOffset] || weather.data.sunrise);
    const hSunset = new Date(weather.data.sunsets[dayOffset] || weather.data.sunset);

    const sunriseMinutes = hSunrise.getHours() * 60 + hSunrise.getMinutes();
    const sunsetMinutes = hSunset.getHours() * 60 + hSunset.getMinutes();
    const hMinutes = hTime.getHours() * 60;

    let hTageszeit: 'dämmerung' | 'nacht' | 'tag' = 'tag';
    if (Math.abs(hMinutes - sunriseMinutes) < 45 || Math.abs(hMinutes - sunsetMinutes) < 45) {
      hTageszeit = 'dämmerung';
    } else if (hMinutes < sunriseMinutes || hMinutes > sunsetMinutes) {
      hTageszeit = 'nacht';
    }

    let hPressureTrend: 'fallend' | 'stabil' | 'steigend' = 'stabil';
    if (hIdx > 0 && weather.data.hourly.pressure[hIdx] && weather.data.hourly.pressure[hIdx - 1]) {
      const pDiff = weather.data.hourly.pressure[hIdx] - weather.data.hourly.pressure[hIdx - 1];
      if (pDiff > 0.5) hPressureTrend = 'steigend';
      else if (pDiff < -0.5) hPressureTrend = 'fallend';
    }

    const hConditions: AngelConditions = {
      stromPhase: getStromPhase(hTime, tide.events),
      luftdruckTrend: hPressureTrend,
      wasserTemp: pegel.data.waterTemp,
      tageszeit: hTageszeit,
      solunar: getSolunarStatus(hTime, 53.55, 9.99),
      mondPhase: moon.name,
      windSpeed: weather.data.hourly.windSpeed[hIdx] || weather.data.windSpeed,
      niederschlag48h: weather.data.hourly.precipitation[hIdx] || 0,
      tideEvents: tide.events
    };

    const hScoreInput = {
      ...hConditions,
      pressure: weather.data.hourly.pressure[hIdx] || weather.data.pressure,
      pressure3hAgo: weather.data.hourly.pressure[hIdx - 3],
      pressure6hAgo: weather.data.hourly.pressure[hIdx - 6],
      pressureHistory: weather.data.hourly.pressure.slice(Math.max(0, hIdx - 72), hIdx + 1),
      cloudCover: weather.data.hourly.cloudCover[hIdx] ?? weather.data.cloudCover,
      uvIndex: weather.data.hourly.uvIndex[hIdx] ?? weather.data.uvIndex,
      windDirection: weather.data.windDirection,
      sunrise: hSunrise.toISOString(),
      sunset: hSunset.toISOString(),
      date: hTime,
      shoreDirection: 90,
      secchiCm,
      structureType: 'Spundwand'
    };
    hourlyScores.push(getScoreDetails(targetFish, hScoreInput).total);
  }

  return {
    score,
    loading: false,
    conditions: { ...conditions, trübung, pressure: weather.data.pressure, windDirection: weather.data.windDirection, cloudCover: weather.data.cloudCover },
    weather: weather.data,
    pegel: pegel.data,
    tide: tide.events,
    moon,
    hourlyScores,
    startHour,
    scoreDetails
  };
}
