import SunCalc from 'suncalc';

export interface AngelConditions {
  stromPhase: 'ablauf' | 'auflauf' | 'kenter' | 'stagnation';
  luftdruckTrend: 'fallend' | 'stabil' | 'steigend';
  wasserTemp: number;
  tageszeit: 'dämmerung' | 'nacht' | 'tag';
  solunar: 'major' | 'minor' | 'außerhalb';
  mondPhase: string;
  windSpeed: number;
  niederschlag48h: number;
}

export function calculateAngelIndex(conditions: AngelConditions): number {
  let score = 0;

  // Strömungsphase
  if (conditions.stromPhase === 'ablauf' || conditions.stromPhase === 'kenter') score += 25;
  else if (conditions.stromPhase === 'auflauf') score += 10;
  else score += 5;

  // Luftdruck-Trend
  if (conditions.luftdruckTrend === 'fallend') score += 15;
  else if (conditions.luftdruckTrend === 'stabil') score += 5;
  else score -= 10;

  // Wassertemperatur
  if (conditions.wasserTemp >= 10 && conditions.wasserTemp <= 18) score += 15;
  else if (conditions.wasserTemp >= 6 && conditions.wasserTemp < 10) score += 8;
  else if (conditions.wasserTemp > 18 && conditions.wasserTemp <= 22) score += 5;
  else score -= 15;

  // Tageszeit
  if (conditions.tageszeit === 'dämmerung') score += 15;
  else if (conditions.tageszeit === 'nacht') score += 8;
  else score += 0;

  // Solunar
  if (conditions.solunar === 'major') score += 10;
  else if (conditions.solunar === 'minor') score += 5;

  // Mondphase
  const mp = conditions.mondPhase.toLowerCase();
  if (mp.includes('neumond') || mp.includes('abnehmend')) score += 8;
  else if (mp.includes('zunehmend')) score += 3;
  else if (mp.includes('vollmond')) score -= 10;

  // Wind
  if (conditions.windSpeed < 15) score += 8;
  else if (conditions.windSpeed <= 25) score += 3;
  else score -= 10;

  // Niederschlag
  if (conditions.niederschlag48h >= 5 && conditions.niederschlag48h <= 20) score += 5;
  else if (conditions.niederschlag48h > 30) score -= 5;

  return Math.min(100, Math.max(0, score));
}

export function getMoonPhase(date: Date) {
  const known = new Date(2000, 0, 6);
  const diffDays = (date.getTime() - known.getTime()) / 86400000;
  const cycle = ((diffDays % 29.53) + 29.53) % 29.53;
  const illumination = Math.round(50 * (1 - Math.cos(2 * Math.PI * cycle / 29.53)));
  
  if (cycle < 1.85) return { name: 'Neumond', icon: '🌑', illumination };
  if (cycle < 7.38) return { name: 'Zunehmend (Sichel)', icon: '🌒', illumination };
  if (cycle < 9.22) return { name: 'Zunehmend (Halbmond)', icon: '🌓', illumination };
  if (cycle < 14.77) return { name: 'Zunehmend (Dreiviertel)', icon: '🌔', illumination };
  if (cycle < 16.61) return { name: 'Vollmond', icon: '🌕', illumination };
  if (cycle < 22.15) return { name: 'Abnehmend (Dreiviertel)', icon: '🌖', illumination };
  if (cycle < 23.99) return { name: 'Abnehmend (Halbmond)', icon: '🌗', illumination };
  return { name: 'Abnehmend (Sichel)', icon: '🌘', illumination };
}

export function getStromPhase(currentTime: Date, tideEvents: { time: Date, type: 'HW' | 'NW' }[]): 'ablauf' | 'auflauf' | 'kenter' | 'stagnation' {
  if (tideEvents.length < 2) return 'stagnation';
  
  const nextEvent = tideEvents.find(e => e.time > currentTime);
  if (!nextEvent) return 'stagnation';
  
  const diffMinutes = (nextEvent.time.getTime() - currentTime.getTime()) / 60000;
  
  // Kenterwasser: ±45 min um Ereignis
  if (diffMinutes < 45) return 'kenter';
  
  // Finde das letzte Ereignis
  const pastEvents = tideEvents.filter(e => e.time <= currentTime);
  const lastEvent = pastEvents[pastEvents.length - 1];
  
  if (!lastEvent) return 'stagnation';
  
  const sinceMinutes = (currentTime.getTime() - lastEvent.time.getTime()) / 60000;
  if (sinceMinutes < 45) return 'kenter';

  if (lastEvent.type === 'HW') return 'ablauf';
  return 'auflauf';
}

export function getSolunarStatus(date: Date, lat: number, lng: number): 'major' | 'minor' | 'außerhalb' {
  const times = SunCalc.getMoonTimes(date, lat, lng);
  if (!times.rise || !times.set) return 'außerhalb';

  const now = date.getTime();
  const hour = 3600000;

  // Major: Mondaufgang ± 1h, Monduntergang ± 1h
  if (Math.abs(now - times.rise.getTime()) < hour || Math.abs(now - times.set.getTime()) < hour) {
    return 'major';
  }

  // Minor: Mondmeridian (grob geschätzt als Mitte zwischen Rise und Set) ± 30 min
  const meridian = (times.rise.getTime() + times.set.getTime()) / 2;
  if (Math.abs(now - meridian) < hour / 2) {
    return 'minor';
  }

  return 'außerhalb';
}
