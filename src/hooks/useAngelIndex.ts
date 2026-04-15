import { useWeather } from './useWeather';
import { usePegel } from './usePegel';
import { useTide } from './useTide';
import { useSolunar } from './useSolunar';
import { useMoon } from './useMoon';
import { calculateAngelIndex, getStromPhase, getSolunarStatus, AngelConditions } from '../utils/calculations';

export function useAngelIndex() {
  const weather = useWeather();
  const pegel = usePegel();
  const tide = useTide();
  const solunar = useSolunar();
  const moon = useMoon();

  const isLoading = weather.loading || pegel.loading || tide.loading;
  
  if (isLoading || !weather.data || !pegel.data) {
    return { score: 0, loading: true, conditions: null };
  }

  const now = new Date();
  const stromPhase = getStromPhase(now, tide.events);
  
  // Determine tageszeit
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
    niederschlag48h: weather.data.precipitation48h
  };

  const score = calculateAngelIndex(conditions);

  // Derived data: Turbidity
  let trübung: 'getrübt' | 'mittel' | 'klar' = 'mittel';
  if (weather.data.precipitation48h > 20 && pegel.data.waterLevel > 500) trübung = 'getrübt';
  else if (weather.data.precipitation48h < 5 && pegel.data.waterLevel < 450) trübung = 'klar';

  // Calculate hourly scores for the next 24 hours (4 hours past, 20 hours future)
  const hourlyScores: number[] = [];
  const startHour = now.getHours() - 4;
  
  for (let i = 0; i < 24; i++) {
    const hTime = new Date(now);
    hTime.setHours(startHour + i, 0, 0, 0);
    
    // Find matching weather index (hourly arrays start at 00:00 of YESTERDAY due to past_days=1)
    const hIdx = 24 + startHour + i; 
    
    // Choose the right sunrise/sunset string based on day differences
    // Since now.getDate() is Today, we find the difference in days.
    const hTimeStartOfDay = new Date(hTime.getFullYear(), hTime.getMonth(), hTime.getDate()).getTime();
    const nowStartOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayDiff = Math.round((hTimeStartOfDay - nowStartOfDay) / 86400000);
    // dayDiff: -1 (gestern), 0 (heute), 1 (morgen). 
    // weather.data.sunrises hat indices: 0 (gestern), 1 (heute), 2 (morgen)
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

    // Determine pressure trend from hourly data
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
      niederschlag48h: weather.data.hourly.precipitation[hIdx] || 0
    };
    
    hourlyScores.push(calculateAngelIndex(hConditions));
  }

  return { 
    score, 
    loading: false, 
    conditions: { ...conditions, trübung, pressure: weather.data.pressure, windDirection: weather.data.windDirection },
    weather: weather.data,
    pegel: pegel.data,
    tide: tide.events,
    moon,
    hourlyScores,
    startHour
  };
}
