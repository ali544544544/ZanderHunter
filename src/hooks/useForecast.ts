import { useState, useEffect } from 'react';
import { calculateBarschIndex, calculateHechtIndex, calculateZanderIndex, getMoonPhase, getSolunarStatus, getStromPhase, getTideOffset } from '../utils/calculations';
import type { AngelConditions, TargetFish } from '../utils/calculations';
import type { TideEvent } from './useTide';
import { useWaterProfile } from './useWaterProfile';

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
    cloudCover: number;
    uvIndex: number;
  };
  tideEvents: TideEvent[];
  moonPhase: { name: string; icon: string; illumination: number };
  solunar: 'major' | 'minor' | 'außerhalb';
  tideOffset: number;
}

export function useForecast(lat: number = 53.55, lng: number = 9.99, targetFish: TargetFish = 'zander') {
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const waterProfile = useWaterProfile(lat, lng);

  useEffect(() => {
    async function fetchForecast() {
      try {
        setLoading(true);
        const cb = `&_cb=${Date.now()}`;
        
        // 1. Fetch 7-day weather from Open-Meteo
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,wind_speed_10m_max,precipitation_sum,weather_code,sunrise,sunset,surface_pressure_max,cloud_cover_mean,uv_index_max&timezone=Europe/Berlin&forecast_days=7${cb}`
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
            pressure: weatherJson.daily.surface_pressure_max[i],
            cloudCover: weatherJson.daily.cloud_cover_mean?.[i] ?? 50,
            uvIndex: weatherJson.daily.uv_index_max?.[i] ?? 0
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

          const scoreInput = {
            ...forecastConditions,
            pressure: dayWeather.pressure,
            pressure3hAgo: i > 0 ? weatherJson.daily.surface_pressure_max[i - 1] : dayWeather.pressure,
            pressure6hAgo: i > 1 ? weatherJson.daily.surface_pressure_max[i - 2] : dayWeather.pressure,
            pressureHistory: weatherJson.daily.surface_pressure_max.slice(Math.max(0, i - 2), i + 1),
            cloudCover: dayWeather.cloudCover,
            uvIndex: dayWeather.uvIndex,
            windDirection: 270,
            sunrise: dayWeather.sunrise,
            sunset: dayWeather.sunset,
            date: currentDate,
            shoreDirection: 90,
            waterProfile: waterProfile.profile,
            targetFish
          };
          const scoreDetails = targetFish === 'hecht'
            ? calculateHechtIndex(scoreInput)
            : targetFish === 'barsch'
              ? calculateBarschIndex(scoreInput)
              : calculateZanderIndex(scoreInput);

          dailyData.push({
            date: currentDate,
            score: scoreDetails.total,
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
  }, [lat, lng, targetFish, waterProfile.profile]);

  return { forecast, loading, error };
}
