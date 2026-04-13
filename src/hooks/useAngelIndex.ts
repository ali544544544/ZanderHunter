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

  // Calculate hourly scores for the next 24 hours
  const hourlyScores: number[] = [];
  const sunriseMinutes = sunrise.getHours() * 60 + sunrise.getMinutes();
  const sunsetMinutes = sunset.getHours() * 60 + sunset.getMinutes();
  
  for (let i = 0; i < 24; i++) {
    const hTime = new Date(now);
    hTime.setHours(i, 0, 0, 0);
    
    // Find matching weather index (Open-Meteo hourly arrays start at 00:00)
    const hIdx = i; 
    
    // Determine tageszeit with proper dämmerung detection (±45 min around sunrise/sunset)
    const hMinutes = i * 60;
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
    hourlyScores
  };
}
