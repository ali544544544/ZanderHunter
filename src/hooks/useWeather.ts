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
  sunrises: string[];
  sunsets: string[];
  hourly: {
    time: string[];
    temperature: number[];
    pressure: number[];
    windSpeed: number[];
    precipitation: number[];
  };
}

export function useWeather(lat: number = 53.55, lng: number = 9.99) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const cb = `&_cb=${Date.now()}`;
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code,precipitation&hourly=temperature_2m,surface_pressure,wind_speed_10m,precipitation&daily=sunrise,sunset&forecast_days=2&past_days=1&timezone=Europe/Berlin${cb}`
        );
        const json = await response.json();

        const currentHourIndex = 24 + new Date().getHours();
        const currentPressure = json.current.surface_pressure;
        const pastPressure = json.hourly.surface_pressure[currentHourIndex - 3] || currentPressure;
        
        let trend: 'fallend' | 'stabil' | 'steigend' = 'stabil';
        const diff = currentPressure - pastPressure;
        if (diff > 1) trend = 'steigend';
        else if (diff < -1) trend = 'fallend';

        const precipSum = json.hourly.precipitation.slice(currentHourIndex - 48, currentHourIndex).reduce((a: number, b: number) => a + b, 0);

        setData({
          temperature: json.current.temperature_2m,
          pressure: currentPressure,
          pressureTrend: trend,
          windSpeed: json.current.wind_speed_10m,
          windDirection: json.current.wind_direction_10m,
          weatherCode: json.current.weather_code,
          precipitation: json.current.precipitation,
          precipitation48h: precipSum,
          sunrise: json.daily.sunrise[1],
          sunset: json.daily.sunset[1],
          sunrises: json.daily.sunrise,
          sunsets: json.daily.sunset,
          hourly: {
            time: json.hourly.time,
            temperature: json.hourly.temperature_2m,
            pressure: json.hourly.surface_pressure,
            windSpeed: json.hourly.wind_speed_10m,
            precipitation: json.hourly.precipitation
          }
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
