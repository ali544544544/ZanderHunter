import { describe, expect, it } from 'vitest';
import { FallbackProvider } from '../providers/FallbackProvider';
import { HejfishAreasProvider } from '../providers/HejfishAreasProvider';
import type { HejfishArea, HejfishAreaLite, HejfishGeoIndexEntry } from '../types/hejfishArea';

describe('FallbackProvider', () => {
  it('does not invent local fish data when hejfish has no match', async () => {
    const provider = new FallbackProvider();
    const profile = await provider.getWaterBodyProfile(53.511, 10.121);

    expect(profile.name).toBe('Keine Gewässerdaten gefunden');
    expect(profile.dataQuality).toBe('unknown');
    expect(profile.sources).toEqual(['unknown']);
    expect(profile.species).toEqual([]);
  });
});

describe('HejfishAreasProvider mapping', () => {
  it('loads split hejfish data and exposes ticket and fish details', async () => {
    const liteArea: HejfishAreaLite = {
      id: 12071,
      slug: 'zielfinger-angelsee-zander-forellen-see',
      name: 'Zielfinger Angelsee',
      water_type: 'See',
      fish_count: 7,
      mobile_ticket: true,
      lat: 48.0123,
      lng: 9.3456,
    };
    const area: HejfishArea = {
      id: 12071,
      slug: 'zielfinger-angelsee-zander-forellen-see',
      url: 'https://www.hejfish.com/d/12071-zielfinger-angelsee-zander-forellen-see',
      name: 'Zielfinger Angelsee, Zander-Forellen-See',
      water_size_ha: 25,
      fish: ['Zander', 'Regenbogenforelle', 'Hecht', 'Karpfen'],
      techniques: ['Spinnfischen', 'Ansitzangeln'],
      properties: ['Nachtangeln erlaubt'],
      season: '01.03. bis 31.12.',
      water_type: 'Stillgewaesser',
      mobile_ticket: true,
      tickets: [{ name: 'Tageskarte', price: '18,00 EUR' }],
      location_info: ['Baden-Wuerttemberg', 'Sigmaringen'],
      lat: 48.0123,
      lng: 9.3456,
      country: 'DE',
      map_data: {
        polygons: [[
          { lat: 48.01, lng: 9.34 },
          { lat: 48.02, lng: 9.34 },
          { lat: 48.02, lng: 9.35 },
        ]],
      },
      error: false,
    };
    const geoIndexEntry: HejfishGeoIndexEntry = {
      id: 12071,
      slug: 'zielfinger-angelsee-zander-forellen-see',
      name: 'Zielfinger Angelsee',
      water_type: 'See',
      fish_count: 7,
      lat: 48.0123,
      lng: 9.3456,
      points: [{ lat: 48.0123, lng: 9.3456 }],
    };
    const originalFetch = globalThis.fetch;
    const detailUrls: string[] = [];
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('areas_lite')) return new Response(JSON.stringify([liteArea]));
      if (url.includes('areas_geo_index')) return new Response(JSON.stringify([geoIndexEntry]));
      detailUrls.push(url);
      return new Response(JSON.stringify(area));
    };
    globalThis.fetch = fetchMock;

    try {
      const provider = new HejfishAreasProvider();
      const profile = await provider.getWaterBodyProfile(48.0123, 9.3456);

      expect(profile?.name).toBe(area.name);
      expect(profile?.sources).toContain('hejfish');
      expect(profile?.species.map((entry) => entry.species)).toContain('zander');
      expect(profile?.species.map((entry) => entry.species)).toContain('forelle');
      expect(profile?.areaDetails?.mapGeometry?.polygons).toHaveLength(1);
      expect(profile?.areaDetails?.tickets?.[0].name).toBe('Tageskarte');
      expect(profile?.links?.[0].url).toBe(area.url);
      expect(detailUrls[0]).toContain('/details/hejfish/hejfish-12071.json');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('accepts new global ids from lite data and falls back to lite profiles without detail files', async () => {
    const liteArea: HejfishAreaLite = {
      id: 'alleangeln-decksteiner-weiher',
      name: 'Decksteiner Weiher',
      lat: 50.9072,
      lng: 6.8985,
      water_type: 'Weiher',
      platform: 'alleangeln',
      fish_count: 0,
    };
    const originalFetch = globalThis.fetch;
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('areas_lite')) return new Response(JSON.stringify([liteArea]));
      if (url.includes('areas_geo_index')) return new Response(JSON.stringify([]));
      return new Response(null, { status: 404 });
    };
    globalThis.fetch = fetchMock;

    try {
      const provider = new HejfishAreasProvider();
      const profile = await provider.getWaterBodyProfile(50.9072, 6.8985);

      expect(profile?.id).toBe('alleangeln-decksteiner-weiher');
      expect(profile?.name).toBe('Decksteiner Weiher');
      expect(profile?.sources).toEqual(['alleangeln']);
      expect(profile?.type).toBe('pond');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('does not expose placeholder season dates from generated details', async () => {
    const liteArea: HejfishAreaLite = {
      id: 'hejfish-16000',
      name: 'Platzhalter Saisonsee',
      lat: 52.1,
      lng: 10.1,
      water_type: 'See',
      platform: 'hejfish',
      fish_count: 1,
    };
    const area: HejfishArea = {
      id: 16000,
      global_id: 'hejfish-16000',
      source_platform: 'hejfish',
      name: 'Platzhalter Saisonsee',
      water_type: 'See',
      fish: ['Zander'],
      season_begin: '0001-01-01',
      season_end: '0001-12-31',
      lat: 52.1,
      lng: 10.1,
      error: false,
    };
    const originalFetch = globalThis.fetch;
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('areas_lite')) return new Response(JSON.stringify([liteArea]));
      if (url.includes('areas_geo_index')) return new Response(JSON.stringify([]));
      return new Response(JSON.stringify(area));
    };
    globalThis.fetch = fetchMock;

    try {
      const provider = new HejfishAreasProvider();
      const profile = await provider.getWaterBodyProfile(52.1, 10.1);

      expect(profile?.areaDetails?.season).toBeUndefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('keeps lite metadata when a matching geo index entry has no detail file', async () => {
    const liteArea: HejfishAreaLite = {
      id: 'hejfish-12004',
      name: 'Detailfreier Testsee',
      lat: 51.1,
      lng: 9.1,
      water_type: 'See',
      platform: 'merged',
      fish_count: 0,
    };
    const geoIndexEntry: HejfishGeoIndexEntry = {
      id: 12004,
      name: 'Detailfreier Testsee',
      lat: 51.1001,
      lng: 9.1001,
      water_type: 'See',
      points: [{ lat: 51.1001, lng: 9.1001 }],
    };
    const originalFetch = globalThis.fetch;
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('areas_lite')) return new Response(JSON.stringify([liteArea]));
      if (url.includes('areas_geo_index')) return new Response(JSON.stringify([geoIndexEntry]));
      return new Response(null, { status: 404 });
    };
    globalThis.fetch = fetchMock;

    try {
      const provider = new HejfishAreasProvider();
      const profile = await provider.getWaterBodyProfile(51.1001, 9.1001);

      expect(profile?.id).toBe('hejfish-12004');
      expect(profile?.name).toBe('Detailfreier Testsee');
      expect(profile?.sources).toEqual(['hejfish']);
      expect(profile?.dataQuality).toBe('medium');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('uses the generated geo index when the lite area has no coordinates', async () => {
    const liteArea: HejfishAreaLite = {
      id: 12189,
      slug: 'dove-elbe-kombi-karte',
      name: 'Dove Elbe (Kombi-Karte)',
      lat: null,
      lng: null,
      water_type: null,
    };
    const geoIndexEntry: HejfishGeoIndexEntry = {
      id: 12189,
      slug: 'dove-elbe-kombi-karte',
      name: 'Dove Elbe (Kombi-Karte)',
      lat: 53.497,
      lng: 10.078,
      points: [{ lat: 53.498851, lng: 10.078256 }],
    };
    const area: HejfishArea = {
      id: 12189,
      slug: 'dove-elbe-kombi-karte',
      url: 'https://www.hejfish.com/d/12189-dove-elbe-kombi-karte',
      name: 'Dove Elbe (Kombi-Karte)',
      fish: ['HechtZanderFlussbarschAal'],
      techniques: ['SpinnangelnAnsitzangelnPosenangeln'],
      properties: ['Boot\nTechniken:\nSpinnangelnAnsitzangelnPosenangeln'],
      location_info: ['Hamburg', 'Hamburg'],
      map_data: {
        data: {
          locations: [{ lat: 53.498851, lng: 10.078256 }],
        },
      },
      country: 'DE',
      error: false,
    };
    const originalFetch = globalThis.fetch;
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('areas_lite')) return new Response(JSON.stringify([liteArea]));
      if (url.includes('areas_geo_index')) return new Response(JSON.stringify([geoIndexEntry]));
      return new Response(JSON.stringify(area));
    };
    globalThis.fetch = fetchMock;

    try {
      const provider = new HejfishAreasProvider();
      const profile = await provider.getWaterBodyProfile(53.4989, 10.0783);

      expect(profile?.name).toBe('Dove Elbe (Kombi-Karte)');
      expect(profile?.sources).toContain('hejfish');
      expect(profile?.species.map((entry) => entry.species)).toContain('zander');
      expect(profile?.species.map((entry) => entry.displayName)).toEqual(['Hecht', 'Zander', 'Flussbarsch', 'Aal']);
      expect(profile?.areaDetails?.techniques).toEqual(['Spinnangeln', 'Ansitzangeln', 'Posenangeln']);
      expect(profile?.areaDetails?.properties).toEqual(['Boot']);
      expect(profile?.areaDetails?.mapGeometry?.points).toHaveLength(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('matches clicks inside hejfish geojson polygons', async () => {
    const liteArea: HejfishAreaLite = {
      id: 13001,
      slug: 'polygon-see',
      name: 'Polygon See',
      lat: null,
      lng: null,
      water_type: 'See',
    };
    const geoIndexEntry: HejfishGeoIndexEntry = {
      id: 13001,
      slug: 'polygon-see',
      name: 'Polygon See',
      lat: 54,
      lng: 10,
      water_type: 'See',
      bounds: {
        minLat: 54,
        maxLat: 54.02,
        minLng: 10,
        maxLng: 10.02,
      },
      points: [{ lat: 54, lng: 10 }],
    };
    const area: HejfishArea = {
      id: 13001,
      slug: 'polygon-see',
      url: 'https://www.hejfish.com/d/13001-polygon-see',
      name: 'Polygon See',
      fish: ['Zander', 'Hecht'],
      map_data: {
        data: {
          locations: [{ lat: 54, lng: 10 }],
          geojson: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [10, 54],
                  [10.02, 54],
                  [10.02, 54.02],
                  [10, 54.02],
                  [10, 54],
                ]],
              },
            }],
          },
        },
      },
      error: false,
    };
    const originalFetch = globalThis.fetch;
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('areas_lite')) return new Response(JSON.stringify([liteArea]));
      if (url.includes('areas_geo_index')) return new Response(JSON.stringify([geoIndexEntry]));
      return new Response(JSON.stringify(area));
    };
    globalThis.fetch = fetchMock;

    try {
      const provider = new HejfishAreasProvider();
      const profile = await provider.getWaterBodyProfile(54.015, 10.015);

      expect(profile?.name).toBe('Polygon See');
      expect(profile?.areaDetails?.mapGeometry?.polygons).toHaveLength(1);
      expect(profile?.areaDetails?.mapGeometry?.lines).toHaveLength(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
