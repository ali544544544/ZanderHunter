import { describe, it, expect } from 'vitest';
import { calculateSpotScore, Spot } from '../data/spots';

describe('calculateSpotScore', () => {
  const mockSpot: Spot = {
    id: 'test',
    name: 'Test Spot',
    beschreibung: 'Test',
    lat: 53.5, lng: 9.96, // St. Pauli reference (offset 0)
    tiefe: '5m',
    bestePhase: 'ablauf',
    windtoleranz: 20,
    bootNötig: false,
    uferAngling: true,
    struktur: [],
    trübungsPräferenz: 'getrübt',
    temperaturMin: 5,
    jahreszeitBonus: { frühling: 10, sommer: 5, herbst: 15, winter: 0 },
    taktik: 'Test Taktik',
    koderTipp: 'Test Köder'
  };

  const fixedDate = new Date('2024-04-10T12:00:00Z');
  // Tide Events: HW at 11:00, NW at 17:00 -> 12:00 is Ablaufwasser
  const mockTideEvents = [
    { time: new Date('2024-04-10T11:00:00Z'), type: 'HW' as const },
    { time: new Date('2024-04-10T17:00:00Z'), type: 'NW' as const }
  ];

  it('erhöht Score bei passender Strömungsphase', () => {
    const conditions = { 
      stromPhase: 'ablauf', 
      windSpeed: 5, 
      trübung: 'mittel', 
      wasserTemp: 10,
      tideEvents: mockTideEvents
    };
    const score = calculateSpotScore(mockSpot, conditions, fixedDate);
    expect(score).toBeGreaterThan(50);
  });

  it('senkt Score bei zu viel Wind', () => {
    const conditions = { 
      stromPhase: 'ablauf', 
      windSpeed: 50, // Higher wind speed to ensure penalty
      trübung: 'getrübt', 
      wasserTemp: 10,
      tideEvents: mockTideEvents
    };
    const score = calculateSpotScore(mockSpot, conditions, fixedDate);
    expect(score).toBeLessThanOrEqual(75); 
  });
});
