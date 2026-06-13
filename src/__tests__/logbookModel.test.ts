import { describe, expect, it } from 'vitest';
import { normalizeCatchEntry, normalizeLogbookTrips, normalizeWeight } from '../services/logbookModel';

describe('logbook model normalization', () => {
  it('sanitizes catch entries before they are stored or synced', () => {
    const entry = normalizeCatchEntry({
      id: ' catch-1 ',
      fishSpecies: 'monster',
      lengthCm: 999,
      weight: ' 1,25 kg ',
      weightUnit: 'lbs',
      caughtAt: 'not-a-date',
      bait: '  Gummifisch  ',
      method: '',
      released: 'yes',
      notes: '  erster   Wurf\n\n\nKante ',
      photoDataUrl: 'https://example.test/photo.jpg',
    }, 'fallback-catch', '2026-05-01T12:00:00.000Z');

    expect(entry).toMatchObject({
      id: 'catch-1',
      fishSpecies: 'zander',
      lengthCm: 300,
      weight: '1.25',
      weightUnit: 'g',
      caughtAt: '2026-05-01T12:00:00.000Z',
      bait: 'Gummifisch',
      method: 'Unbekannt',
      released: true,
      notes: 'erster Wurf\n\nKante',
      photoDataUrl: undefined,
    });
  });

  it('keeps only robust trip and catch data from legacy storage', () => {
    const trips = normalizeLogbookTrips([
      {
        id: 'trip-1',
        startedAt: '2026-05-03T08:00:00.000Z',
        spotName: '  Elbe   Buhne  ',
        lat: '99',
        lng: '-999',
        accuracy: -5,
        catches: [
          { id: 'catch-1', fishSpecies: 'hecht', lengthCm: 70, caughtAt: '2026-05-03T09:00:00.000Z' },
          { id: 'catch-1', fishSpecies: 'zander', lengthCm: 50, caughtAt: '2026-05-03T10:00:00.000Z' },
          null,
        ],
      },
      null,
    ]);

    expect(trips).toHaveLength(1);
    expect(trips[0]).toMatchObject({
      spotName: 'Elbe Buhne',
      lat: 90,
      lng: -180,
      accuracy: 0,
    });
    expect(trips[0].catches).toHaveLength(1);
    expect(trips[0].catches[0]).toMatchObject({
      id: 'catch-1',
      fishSpecies: 'zander',
      bait: 'Unbekannt',
      method: 'Unbekannt',
    });
  });

  it('normalizes decimal weight input consistently', () => {
    expect(normalizeWeight('2,75')).toBe('2.75');
    expect(normalizeWeight('abc')).toBe('');
    expect(normalizeWeight('-3')).toBe('');
  });
});
