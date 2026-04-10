import { useWeather } from './useWeather';
import { usePegel } from './usePegel';
import { useTide } from './useTide';
import { useSolunar } from './useSolunar';
import { useMoon } from './useMoon';
import { calculateAngelIndex, getStromPhase, AngelConditions } from '../utils/calculations';

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

  return { 
    score, 
    loading: false, 
    conditions: { ...conditions, trübung, pressure: weather.data.pressure, windDirection: weather.data.windDirection },
    weather: weather.data,
    pegel: pegel.data,
    tide: tide.events,
    moon
  };
}
