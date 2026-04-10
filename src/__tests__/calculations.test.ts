import { describe, it, expect } from 'vitest';
import { calculateAngelIndex, getMoonPhase, getStromPhase } from '../utils/calculations';

describe('calculateAngelIndex', () => {
  it('gibt hohen Score bei optimalen Bedingungen', () => {
    const score = calculateAngelIndex({
      stromPhase: 'ablauf',
      luftdruckTrend: 'fallend',
      wasserTemp: 14,
      tageszeit: 'dämmerung',
      solunar: 'major',
      mondPhase: 'neumond',
      windSpeed: 10,
      niederschlag48h: 10
    });
    expect(score).toBeGreaterThanOrEqual(75);
  });

  it('gibt niedrigen Score bei schlechten Bedingungen', () => {
    const score = calculateAngelIndex({
      stromPhase: 'stagnation',
      luftdruckTrend: 'steigend',
      wasserTemp: 3,
      tageszeit: 'tag',
      solunar: 'außerhalb',
      mondPhase: 'vollmond',
      windSpeed: 35,
      niederschlag48h: 0
    });
    expect(score).toBeLessThan(40);
  });

  it('score ist immer zwischen 0 und 100', () => {
    const score = calculateAngelIndex({
      stromPhase: 'ablauf',
      luftdruckTrend: 'fallend',
      wasserTemp: 14,
      tageszeit: 'dämmerung',
      solunar: 'major',
      mondPhase: 'neumond',
      windSpeed: 5,
      niederschlag48h: 15
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('getMoonPhase', () => {
  it('erkennt Vollmond korrekt', () => {
    // Bekannter Vollmond um den 13. April 2025 herum (geschätzt)
    const result = getMoonPhase(new Date('2025-04-13'));
    expect(result.name).toContain('Vollmond');
    expect(result.illumination).toBeGreaterThan(90);
  });

  it('gibt immer einen Icon zurück', () => {
    const result = getMoonPhase(new Date());
    expect(result.icon).toBeTruthy();
    expect(result.name).toBeTruthy();
  });
});

describe('getStromPhase', () => {
  it('erkennt Ablaufwasser nach Hochwasser', () => {
    const now = new Date('2025-04-10T14:00:00');
    const tides: any[] = [
      { time: new Date('2025-04-10T12:00:00'), type: 'HW' },
      { time: new Date('2025-04-10T18:30:00'), type: 'NW' },
    ];
    expect(getStromPhase(now, tides)).toBe('ablauf');
  });

  it('erkennt Kenterwasser vor Ereignis', () => {
    const now = new Date('2025-04-10T18:10:00');
    const tides: any[] = [
      { time: new Date('2025-04-10T12:00:00'), type: 'HW' },
      { time: new Date('2025-04-10T18:30:00'), type: 'NW' },
    ];
    expect(getStromPhase(now, tides)).toBe('kenter');
  });
});
