import { useState, useEffect } from 'react';
import { getMoonPhase } from '../utils/calculations';

export function useMoon() {
  const [phase, setPhase] = useState(getMoonPhase(new Date()));

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(getMoonPhase(new Date()));
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return phase;
}
