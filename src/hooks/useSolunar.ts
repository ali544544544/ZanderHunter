import { useState, useEffect } from 'react';
import { getSolunarStatus } from '../utils/calculations';

export function useSolunar(lat: number = 53.55, lng: number = 9.99) {
  const [status, setStatus] = useState<'major' | 'minor' | 'außerhalb'>('außerhalb');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function calculate() {
      const res = getSolunarStatus(new Date(), lat, lng);
      setStatus(res);
      setLoading(false);
    }

    calculate();
    const interval = setInterval(calculate, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lat, lng]);

  return { status, loading };
}
