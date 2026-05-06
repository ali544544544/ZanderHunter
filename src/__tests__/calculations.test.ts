import { describe, it, expect } from 'vitest';
import { calculateAngelIndex, calculateZanderIndex, getMoonPhase, getStromPhase } from '../utils/calculations';
import type { HechtScoreInput } from '../utils/calculations';
import type { WaterBodyProfile } from '../types/waterData';

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

describe('water profile score context', () => {
  const baseInput: HechtScoreInput = {
    stromPhase: 'ablauf',
    luftdruckTrend: 'fallend',
    wasserTemp: 14,
    tageszeit: 'dämmerung',
    solunar: 'major',
    mondPhase: 'neumond',
    windSpeed: 10,
    niederschlag48h: 8,
    pressure: 1010,
    pressure3hAgo: 1014,
    date: new Date('2026-06-15T20:00:00'),
  };

  function createProfile(confidence: number): WaterBodyProfile {
    return {
      id: `test-${confidence}`,
      name: 'Testsee',
      type: 'lake',
      latitude: 53.5,
      longitude: 9.9,
      region: 'Hamburg',
      dataQuality: 'high',
      sources: ['hejfish'],
      lastUpdated: new Date('2026-06-01'),
      species: [
        {
          species: 'zander',
          confidence,
          source: 'hejfish',
          lastUpdated: new Date('2026-06-01'),
        },
      ],
    };
  }

  it('bewertet guten Bestand hoeher als schwachen Bestand', () => {
    const strong = calculateZanderIndex({ ...baseInput, waterProfile: createProfile(0.9) });
    const weak = calculateZanderIndex({ ...baseInput, waterProfile: createProfile(0.1) });

    expect(strong.total).toBeGreaterThan(weak.total);
    expect(strong.probability).toContain('Bestand 90%');
  });

  it('uebernimmt Schonzeit aus dem Gewaesserprofil', () => {
    const profile = createProfile(0.9);
    profile.regulations = {
      permit_required: true,
      closed_seasons: [{ species: 'zander', start: '06-01', end: '06-30' }],
    };

    const result = calculateZanderIndex({ ...baseInput, waterProfile: profile });

    expect(result.legal.schonzeitAktiv).toBe(true);
    expect(result.legal.hinweis).toContain('SCHONZEIT AKTIV');
  });
});
