import { useState, useEffect } from 'react';

export interface PegelData {
  waterLevel: number;
  waterTemp: number;
  levelTrend: 'fallend' | 'stabil' | 'steigend';
  timestamp: string;
}

export function usePegel() {
  const [data, setData] = useState<PegelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPegel() {
      try {
        // Append timestamp for cache busting
        const cb = `?_cb=${Date.now()}`;
        
        // Pegelstand Hamburg St. Pauli
        const levelRes = await fetch(`https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/HAMBURGSTPAULI/W/currentmeasurement.json${cb}`);
        const levelJson = await levelRes.json();
        
        // Wassertemperatur Seemannshöft
        const tempRes = await fetch(`https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/SEEMANNSHOEFT/WT/currentmeasurement.json${cb}`);
        const tempJson = await tempRes.json();

        // Pegelstand letzte 2h für Trend
        const trendRes = await fetch(`https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/HAMBURGSTPAULI/W/measurements.json?start=PT2H&_cb=${Date.now()}`);
        const trendJson = await trendRes.json();

        let trend: 'fallend' | 'stabil' | 'steigend' = 'stabil';
        if (trendJson.length > 2) {
          const first = trendJson[0].value;
          const last = trendJson[trendJson.length - 1].value;
          const diff = last - first;
          if (diff > 5) trend = 'steigend';
          else if (diff < -5) trend = 'fallend';
        }

        setData({
          waterLevel: levelJson.value,
          waterTemp: tempJson.value || 12, // Fallback if temp sensor is offline
          levelTrend: trend,
          timestamp: levelJson.timestamp
        });
      } catch (err) {
        setError('Pegeldaten nicht verfügbar');
      } finally {
        setLoading(false);
      }
    }

    fetchPegel();
    const interval = setInterval(fetchPegel, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}
