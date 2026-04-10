import { useState, useEffect } from 'react';

export interface TideEvent {
  time: Date;
  type: 'HW' | 'NW';
  height: number;
}

export function useTide() {
  const [events, setEvents] = useState<TideEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTide() {
      try {
        // In a real app, you'd fetch from an API. 
        // For this demo, we use a semi-calculated approach for Hamburg.
        // Hamburg has semi-diurnal tides (~12h 25min cycle).
        
        const now = new Date();
        const baseHW = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0); 
        // This is a simplified calculation for demonstration.
        // In production, use a reliable Tide API results.
        
        const mockEvents: TideEvent[] = [];
        const cycle = 12.42 * 60 * 60 * 1000; // 12h 25min
        
        let startTime = baseHW.getTime() - cycle * 2;
        for (let i = 0; i < 10; i++) {
          mockEvents.push({
            time: new Date(startTime),
            type: 'HW',
            height: 720 + Math.random() * 50
          });
          mockEvents.push({
            time: new Date(startTime + cycle / 2),
            type: 'NW',
            height: 180 + Math.random() * 30
          });
          startTime += cycle;
        }

        setEvents(mockEvents.sort((a, b) => a.time.getTime() - b.time.getTime()));
      } catch (err) {
        setError('Tidedaten nicht verfügbar');
      } finally {
        setLoading(false);
      }
    }

    fetchTide();
  }, []);

  return { events, loading, error };
}
