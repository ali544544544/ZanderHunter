import { useState, useEffect } from 'react';

export interface WeatherData {
  temperature: number;
  pressure: number;
  pressureTrend: 'fallend' | 'stabil' | 'steigend';
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  precipitation: number;
  precipitation48h: number;
  sunrise: string;
  sunset: string;
}

export function useWeather(lat: number = 53.55, lng: number = 9.99) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code,precipitation&hourly=surface_pressure,precipitation&daily=sunrise,sunset&forecast_days=2&timezone=Europe/Berlin`
        );
        const json = await response.json();

        const currentPressure = json.current.surface_pressure;
        const pastPressure = json.hourly.surface_pressure[json.hourly.surface_pressure.length - 4] || currentPressure;
        
        let trend: 'fallend' | 'stabil' | 'steigend' = 'stabil';
        const diff = currentPressure - pastPressure;
        if (diff > 1) trend = 'steigend';
        else if (diff < -1) trend = 'fallend';

        const precipSum = json.hourly.precipitation.slice(0, 48).reduce((a: number, b: number) => a + b, 0);

        setData({
          temperature: json.current.temperature_2m,
          pressure: currentPressure,
          pressureTrend: trend,
          windSpeed: json.current.wind_speed_10m,
          windDirection: json.current.wind_direction_10m,
          weatherCode: json.current.weather_code,
          precipitation: json.current.precipitation,
          precipitation48h: precipSum,
          sunrise: json.daily.sunrise[0],
          sunset: json.daily.sunset[0],
        });
      } catch (err) {
        setError('Wetterdaten nicht verfügbar');
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lat, lng]);

  return { data, loading, error };
}
