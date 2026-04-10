import { useState, useEffect } from 'react';
import { AngelConditions, calculateAngelIndex, getMoonPhase, getSolunarStatus, getStromPhase, getTideOffset } from '../utils/calculations';
import { TideEvent } from './useTide';

export interface DailyForecast {
  date: Date;
  score: number;
  weather: {
    tempMax: number;
    windSpeedMax: number;
    precipSum: number;
    weatherCode: number;
    sunrise: string;
    sunset: string;
    pressure: number;
  };
  tideEvents: TideEvent[];
  moonPhase: { name: string; icon: string; illumination: number };
  solunar: 'major' | 'minor' | 'außerhalb';
  tideOffset: number;
}

export function useForecast(lat: number = 53.55, lng: number = 9.99) {
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchForecast() {
      try {
        setLoading(true);
        const cb = `&_cb=${Date.now()}`;
        
        // 1. Fetch 7-day weather from Open-Meteo
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,wind_speed_10m_max,precipitation_sum,weather_code,sunrise,sunset,surface_pressure_max&timezone=Europe/Berlin&forecast_days=7${cb}`
        );
        const weatherJson = await weatherRes.json();

        if (!weatherJson.daily || !weatherJson.daily.time) {
          throw new Error('Keine Daten von Wetter-API');
        }

        // 2. Generate Tides for 7 days with Spot Offset
        const offset = getTideOffset(lng);
        const tideEvents: TideEvent[] = [];
        const baseHW = new Date();
        baseHW.setHours(12, 0, 0, 0);
        const cycle = 12.42 * 60 * 60 * 1000;
        let startTime = baseHW.getTime();
        for (let i = 0; i < 20; i++) {
          tideEvents.push({ time: new Date(startTime), type: 'HW', height: 730 });
          tideEvents.push({ time: new Date(startTime + cycle / 2), type: 'NW', height: 190 });
          startTime += cycle;
        }

        const dailyData: DailyForecast[] = [];
        const today = new Date();

        // Loop through available days from API (usually 7)
        const daysToProcess = Math.min(weatherJson.daily.time.length, 7);

        for (let i = 0; i < daysToProcess; i++) {
          const currentDate = new Date();
          currentDate.setDate(today.getDate() + i);
          currentDate.setHours(12, 0, 0, 0);

          const dayWeather = {
            tempMax: weatherJson.daily.temperature_2m_max[i],
            windSpeedMax: weatherJson.daily.wind_speed_10m_max[i],
            precipSum: weatherJson.daily.precipitation_sum[i],
            weatherCode: weatherJson.daily.weather_code[i],
            sunrise: weatherJson.daily.sunrise[i],
            sunset: weatherJson.daily.sunset[i],
            pressure: weatherJson.daily.surface_pressure_max[i]
          };

          const moonInfo = getMoonPhase(currentDate);
          const solunarStatus = getSolunarStatus(currentDate, lat, lng);
          
          // Tide filter with offset adjustment
          const localTideEvents = tideEvents.filter(e => {
            const localTime = new Date(e.time.getTime() + (offset * 60000));
            return localTime.getDate() === currentDate.getDate() && 
                   localTime.getMonth() === currentDate.getMonth();
          });

          const forecastConditions: AngelConditions = {
            stromPhase: getStromPhase(currentDate, tideEvents, offset),
            luftdruckTrend: 'stabil',
            wasserTemp: 12,
            tageszeit: 'tag',
            solunar: solunarStatus,
            mondPhase: moonInfo.name,
            windSpeed: dayWeather.windSpeedMax,
            niederschlag48h: dayWeather.precipSum,
            tideEvents: tideEvents
          };

          dailyData.push({
            date: currentDate,
            score: calculateAngelIndex(forecastConditions),
            weather: dayWeather,
            tideEvents: localTideEvents.sort((a, b) => a.time.getTime() - b.time.getTime()),
            moonPhase: moonInfo,
            solunar: solunarStatus,
            tideOffset: offset
          });
        }

        setForecast(dailyData);
      } catch (err) {
        setError('Forecast konnte nicht geladen werden');
      } finally {
        setLoading(false);
      }
    }

    fetchForecast();
  }, [lat, lng]);

  return { forecast, loading, error };
}
