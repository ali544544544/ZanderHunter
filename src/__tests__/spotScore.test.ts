import { describe, it, expect } from 'vitest';
import { calculateSpotScore, Spot } from '../data/spots';

describe('calculateSpotScore', () => {
  const mockSpot: Spot = {
    id: 'test',
    name: 'Test Spot',
    beschreibung: 'Test',
    lat: 0, lng: 0,
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

  it('erhöht Score bei passender Strömungsphase', () => {
    const conditions = { stromPhase: 'ablauf', windSpeed: 5, trübung: 'mittel', wasserTemp: 10 };
    const score = calculateSpotScore(mockSpot, conditions);
    expect(score).toBeGreaterThan(50);
  });

  it('senkt Score bei zu viel Wind', () => {
    const conditions = { stromPhase: 'ablauf', windSpeed: 30, trübung: 'getrübt', wasserTemp: 10 };
    const score = calculateSpotScore(mockSpot, conditions);
    expect(score).toBeLessThanOrEqual(70); 
  });
});
