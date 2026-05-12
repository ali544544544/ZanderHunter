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
      metadata: {
        followers: 1234,
        catches_count: 56,
        images_count: 7,
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
      expect(profile?.areaDetails?.stats?.followers).toBe(1234);
      expect(profile?.areaDetails?.stats?.catches).toBe(56);
      expect(profile?.links?.[0].url).toBe(area.url);
      expect(detailUrls[0]).toContain('/details/hejfish/hejfish-12071.json');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('uses community stats from the selected water detail json only', async () => {
    const liteArea: HejfishAreaLite = {
      id: 'alleangeln-isebekkanal-hamburg',
      name: 'Isebekkanal (Hamburg)',
      lat: 53.577553,
      lng: 9.973584,
      water_type: 'Kanal',
      platform: 'alleangeln',
      fish_count: 6,
    };
    const area: HejfishArea = {
      id: 'alleangeln-isebekkanal-hamburg',
      global_id: 'alleangeln-isebekkanal-hamburg',
      source_platform: 'alleangeln',
      source_ids: { alleangeln: 'isebekkanal-hamburg' },
      name: 'Isebekkanal (Hamburg)',
      water_type: 'Kanal',
      fish: ['Flussbarsch', 'Brachse', 'Hecht'],
      followers: 381,
      catches_count: 86,
      images_count: 5,
      lat: 53.577553,
      lng: 9.973584,
      metadata: {
        sources: {
          alleangeln: {
            id: 'alleangeln-außenalster',
            global_id: 'alleangeln-außenalster',
            source_platform: 'alleangeln',
            name: 'Außenalster',
            followers: 3999,
            catches_count: 1146,
            images_count: 28,
          },
        },
      },
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
      const profile = await provider.getWaterBodyProfile(53.577553, 9.973584);

      expect(profile?.name).toBe('Isebekkanal (Hamburg)');
      expect(profile?.areaDetails?.stats).toEqual({
        followers: 381,
        catches: 86,
        images: 5,
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('prefers the bundled public data index before stale dist data', async () => {
    const publicLiteArea: HejfishAreaLite = {
      id: 'alleangeln-außenalster',
      name: 'Außenalster',
      lat: 53.564222482522,
      lng: 10.006684783935,
      water_type: 'See',
      platform: 'alleangeln',
      fish_count: 0,
    };
    const staleDistLiteArea: HejfishAreaLite = {
      id: 'hejfish-12190',
      name: 'Strom-Elbe Hamburg (Kombi-Karte)',
      lat: 53.397707,
      lng: 10.178841,
      water_type: 'Fluss',
      platform: 'hejfish',
      fish_count: 18,
    };
    const publicDetail: HejfishArea = {
      id: 'außenalster',
      global_id: 'alleangeln-außenalster',
      source_platform: 'alleangeln',
      name: 'Außenalster',
      water_type: 'See',
      description: 'Außenalster ist ein See in Hamburg.',
      fish: [],
      most_caught_fish: ['Flussbarsch', 'Hecht', 'Zander', 'Brachse', 'Rapfen', '14 weitere Fischarten'],
      best_method: 'Spinnfischen',
      lat: 53.564222482522,
      lng: 10.006684783935,
      error: false,
    };
    const originalFetch = globalThis.fetch;
    const requestedUrls: string[] = [];
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.includes('/data/areas_lite.json')) return new Response(JSON.stringify([publicLiteArea]));
      if (url.includes('/data/dist/areas_lite.json')) return new Response(JSON.stringify([staleDistLiteArea]));
      if (url.includes('/data/areas_geo_index.json')) return new Response(JSON.stringify([]));
      if (url.includes('/data/details/alleangeln/alleangeln-außenalster.json')) return new Response(JSON.stringify(publicDetail));
      return new Response(null, { status: 404 });
    };
    globalThis.fetch = fetchMock;

    try {
      const provider = new HejfishAreasProvider();
      const profile = await provider.getWaterBodyProfile(53.5631, 10.0038);

      expect(requestedUrls[0]).toContain('/data/areas_lite.json');
      expect(requestedUrls.some((url) => url.includes('/data/dist/areas_lite.json'))).toBe(false);
      expect(profile?.id).toBe('alleangeln-außenalster');
      expect(profile?.sources).toEqual(['alleangeln']);
      expect(profile?.species.map((entry) => entry.species)).toEqual(expect.arrayContaining(['barsch', 'hecht', 'zander', 'brasse']));
      expect(profile?.species.map((entry) => entry.displayName)).not.toContain('14 weitere Fischarten');
      expect(profile?.areaDetails?.techniques).toEqual(['Spinnfischen']);
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

  it('prefers short border info without adding related Alle Angeln entries', async () => {
    const liteAreas: HejfishAreaLite[] = [
      {
        id: 'hejfish-12720',
        name: 'Gose Elbe (Kombi-Karte)',
        lat: 53.419741,
        lng: 10.20275,
        water_type: 'Altarm',
        platform: 'hejfish',
        fish_count: 14,
      },
      {
        id: 'alleangeln-gose-elbe',
        name: 'Gose Elbe',
        lat: 53.458185,
        lng: 10.156695,
        water_type: 'Fluss',
        platform: 'alleangeln',
        fish_count: 0,
      },
    ];
    const area: HejfishArea = {
      id: 12720,
      global_id: 'hejfish-12720',
      source_platform: 'hejfish',
      name: 'Gose Elbe (Kombi-Karte)',
      url: 'https://www.hejfish.com/d/12720-gose-elbe-kombi-karte',
      water_type: 'Altarm',
      description: '<p>Die Gose Elbe ist ein ca. 15km langer Altwasserarm.</p>',
      borders: '<p>Gose-Elbe: Es darf ab der Bruecke Heinrich-Stubbe-Web bis zur Reitschleuse geangelt werden.</p><p>Dove-Elbe: Es darf die Strecke von der Krapphof-Schleuse bis zur Tatenberger-Schleuse beangelt werden.</p>',
      rules_text: 'Fangmeldung und allgemeine Verhaltensregeln. Grenzen des Gewaessers: Viel zu spaet.',
      fish: ['Zander', 'Flussbarsch', 'Karpfen'],
      techniques: ['Spinnangeln'],
      tickets: [{ name: 'Jahreskarte', price: '30,00 EUR' }],
      lat: 53.419741,
      lng: 10.20275,
      error: false,
    };
    const originalFetch = globalThis.fetch;
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('areas_lite')) return new Response(JSON.stringify(liteAreas));
      if (url.includes('areas_geo_index')) return new Response(JSON.stringify([]));
      if (url.includes('/details/hejfish/hejfish-12720.json')) return new Response(JSON.stringify(area));
      return new Response(null, { status: 404 });
    };
    globalThis.fetch = fetchMock;

    try {
      const provider = new HejfishAreasProvider();
      const profile = await provider.getWaterBodyProfile(53.419741, 10.20275);

      expect(profile?.dataQuality).toBe('high');
      expect(profile?.sources).toEqual(['hejfish']);
      expect(profile?.links?.some((link) => link.url === 'https://www.hejfish.com/d/12720-gose-elbe-kombi-karte')).toBe(true);
      expect(profile?.links?.some((link) => link.url === 'https://www.alleangeln.de/gewaesser/gose-elbe')).not.toBe(true);
      expect(profile?.areaDetails?.rulesText).toContain('Gose-Elbe');
      expect(profile?.areaDetails?.rulesText).toContain('Dove-Elbe');
      expect(profile?.areaDetails?.rulesText).not.toContain('Fangmeldung');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('loads Strom-Elbe Hamburg details away from the lite midpoint', async () => {
    const liteArea: HejfishAreaLite = {
      id: 'hejfish-12190',
      name: 'Strom-Elbe Hamburg (Kombi-Karte)',
      lat: 53.397707,
      lng: 10.178841,
      water_type: 'Fluss',
      platform: 'hejfish',
      fish_count: 18,
    };
    const area: HejfishArea = {
      id: 12190,
      global_id: 'hejfish-12190',
      source_platform: 'hejfish',
      name: 'Strom-Elbe Hamburg (Kombi-Karte)',
      url: 'https://www.hejfish.com/d/12190-strom-elbe-hamburg-kombi-karte',
      water_type: 'Fluss',
      description: '<p>Elbestrom</p>',
      borders: '<p>Elbestrom: Rechtsseitig bis zur Strommitte.</p>',
      fish: ['Hecht', 'Zander', 'Flussbarsch', 'Karpfen'],
      techniques: ['Spinnangeln', 'Ansitzangeln'],
      tickets: [{ name: 'Jahreskarte', price: '30,00 EUR' }],
      manager: { name: 'Anglerverband Hamburg e.V.' },
      lat: 53.397707,
      lng: 10.178841,
      map_data: {
        locations: [
          { lat: 53.397707, lng: 10.178841 },
          { lat: 53.486067, lng: 10.053832 },
          { lat: 53.528347, lng: 9.825725 },
          { lat: 53.500185, lng: 9.886109 },
        ],
      },
      error: false,
    };
    const originalFetch = globalThis.fetch;
    const requestedDetails: string[] = [];
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('areas_lite')) return new Response(JSON.stringify([liteArea]));
      if (url.includes('areas_geo_index')) return new Response(JSON.stringify([]));
      requestedDetails.push(url);
      if (url.includes('/details/hejfish/hejfish-12190.json')) return new Response(JSON.stringify(area));
      return new Response(null, { status: 404 });
    };
    globalThis.fetch = fetchMock;

    try {
      const provider = new HejfishAreasProvider();
      const profile = await provider.getWaterBodyProfile(53.528347, 9.825725);

      expect(requestedDetails.some((url) => url.includes('/details/hejfish/hejfish-12190.json'))).toBe(true);
      expect(profile?.id).toBe('hejfish-12190');
      expect(profile?.dataQuality).toBe('high');
      expect(profile?.species.map((entry) => entry.species)).toContain('zander');
      expect(profile?.areaDetails?.rulesText).toContain('Elbestrom');
      expect(profile?.areaDetails?.tickets?.[0].name).toBe('Jahreskarte');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('prefers nearby merged lake details over broad canal polygons', async () => {
    const liteAreas: HejfishAreaLite[] = [
      {
        id: 'hejfish-15387',
        name: 'Prüßsee',
        lat: 53.529811766365256,
        lng: 10.68531693338845,
        water_type: 'Baggersee',
        platform: 'merged',
        fish_count: 15,
      },
      {
        id: 'hejfish-12544',
        name: 'Elbe-Lübeck-Kanal',
        lat: 53.60619849155722,
        lng: 10.625313520431519,
        water_type: 'Kanal',
        platform: 'hejfish',
        fish_count: 16,
      },
    ];
    const geoIndex: HejfishGeoIndexEntry[] = [
      {
        id: 12544,
        name: 'Elbe-Lübeck-Kanal',
        lat: 53.51854,
        lng: 10.635424,
        water_type: 'Kanal',
        bounds: {
          minLat: 53.5,
          maxLat: 53.55,
          minLng: 10.6,
          maxLng: 10.7,
        },
        points: [{ lat: 53.51854, lng: 10.635424 }],
      },
    ];
    const prueßsee: HejfishArea = {
      id: 15387,
      global_id: 'hejfish-15387',
      source_platform: 'merged',
      external_ids: { hejfish: 15387, alleangeln: 'prüßsee' },
      name: 'Prüßsee',
      water_type: 'Baggersee',
      fish: ['Zander', 'Hecht', 'Flussbarsch'],
      techniques: ['Spinnangeln'],
      borders: 'Prüßsee: Angelbereich am Baggersee.',
      tickets: [{ name: 'Tageskarte', price: '12,00 EUR' }],
      lat: 53.529811766365256,
      lng: 10.68531693338845,
      map_data: {
        locations: [{ lat: 53.534027, lng: 10.685797 }],
      },
      error: false,
    };
    const canal: HejfishArea = {
      id: 12544,
      global_id: 'hejfish-12544',
      source_platform: 'hejfish',
      name: 'Elbe-Lübeck-Kanal',
      water_type: 'Kanal',
      fish: ['Zander'],
      lat: 53.60619849155722,
      lng: 10.625313520431519,
      map_data: {
        geojson: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [10.6, 53.5],
              [10.7, 53.5],
              [10.7, 53.55],
              [10.6, 53.55],
              [10.6, 53.5],
            ]],
          },
        },
        locations: [{ lat: 53.51854, lng: 10.635424 }],
      },
      error: false,
    };
    const originalFetch = globalThis.fetch;
    const requestedDetails: string[] = [];
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('areas_lite')) return new Response(JSON.stringify(liteAreas));
      if (url.includes('areas_geo_index')) return new Response(JSON.stringify(geoIndex));
      requestedDetails.push(url);
      if (url.includes('/details/merged/hejfish-15387.json')) return new Response(JSON.stringify(prueßsee));
      if (url.includes('/details/hejfish/hejfish-12544.json')) return new Response(JSON.stringify(canal));
      return new Response(null, { status: 404 });
    };
    globalThis.fetch = fetchMock;

    try {
      const provider = new HejfishAreasProvider();
      const profile = await provider.getWaterBodyProfile(53.5304, 10.6779);

      expect(requestedDetails.some((url) => url.includes('/details/merged/hejfish-15387.json'))).toBe(true);
      expect(profile?.id).toBe('hejfish-15387');
      expect(profile?.name).toBe('Prüßsee');
      expect(profile?.links?.some((link) => link.url === 'https://www.alleangeln.de/gewaesser/prüßsee')).not.toBe(true);
      expect(profile?.areaDetails?.rulesText).toContain('Prüßsee');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('prefers the nearest city water over regional Hamburg combo waters', async () => {
    const liteAreas: HejfishAreaLite[] = [
      {
        id: 'alleangeln-außenalster',
        name: 'Außenalster',
        lat: 53.564222482522,
        lng: 10.006684783935,
        water_type: 'See',
        platform: 'alleangeln',
        fish_count: 0,
      },
      {
        id: 'hejfish-12190',
        name: 'Strom-Elbe Hamburg (Kombi-Karte)',
        lat: 53.397707,
        lng: 10.178841,
        water_type: 'Fluss',
        platform: 'hejfish',
        fish_count: 18,
      },
    ];
    const außenalster: HejfishArea = {
      id: 'außenalster',
      global_id: 'alleangeln-außenalster',
      source_platform: 'alleangeln',
      name: 'Außenalster',
      water_type: 'See',
      description: 'Außenalster ist ein See in Hamburg.',
      lat: 53.564222482522,
      lng: 10.006684783935,
      error: false,
    };
    const stromElbe: HejfishArea = {
      id: 12190,
      global_id: 'hejfish-12190',
      source_platform: 'hejfish',
      name: 'Strom-Elbe Hamburg (Kombi-Karte)',
      water_type: 'Fluss',
      fish: ['Zander', 'Hecht'],
      lat: 53.397707,
      lng: 10.178841,
      map_data: {
        locations: [
          { lat: 53.486067, lng: 10.053832 },
          { lat: 53.528347, lng: 9.825725 },
        ],
      },
      error: false,
    };
    const originalFetch = globalThis.fetch;
    const requestedDetails: string[] = [];
    const geoIndex: HejfishGeoIndexEntry[] = [{
      id: 12190,
      name: 'Strom-Elbe Hamburg (Kombi-Karte)',
      lat: 53.5637,
      lng: 10.0028,
      water_type: 'Fluss',
      bounds: {
        minLat: 53.55,
        maxLat: 53.57,
        minLng: 9.99,
        maxLng: 10.02,
      },
      points: [{ lat: 53.5637, lng: 10.0028 }],
    }];
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('areas_lite')) return new Response(JSON.stringify(liteAreas));
      if (url.includes('areas_geo_index')) return new Response(JSON.stringify(geoIndex));
      requestedDetails.push(url);
      if (url.includes('/details/alleangeln/alleangeln-außenalster.json')) return new Response(JSON.stringify(außenalster));
      if (url.includes('/details/hejfish/hejfish-12190.json')) return new Response(JSON.stringify(stromElbe));
      return new Response(null, { status: 404 });
    };
    globalThis.fetch = fetchMock;

    try {
      const provider = new HejfishAreasProvider();
      const profile = await provider.getWaterBodyProfile(53.5637, 10.0028);

      expect(requestedDetails).toEqual(expect.arrayContaining([
        expect.stringContaining('/details/alleangeln/alleangeln-außenalster.json'),
      ]));
      expect(requestedDetails.some((url) => url.includes('/details/hejfish/hejfish-12190.json'))).toBe(false);
      expect(profile?.id).toBe('alleangeln-außenalster');
      expect(profile?.name).toBe('Außenalster');
      expect(profile?.sources).toEqual(['alleangeln']);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('keeps merged platform when geo index and lite index share the same id', async () => {
    const liteArea: HejfishAreaLite = {
      id: 'hejfish-12189',
      name: 'Dove Elbe (Kombi-Karte)',
      lat: 53.469139,
      lng: 10.189977,
      water_type: 'Altarm',
      platform: 'merged',
      fish_count: 14,
    };
    const nearbyLake: HejfishAreaLite = {
      id: 'alleangeln-eichbaumsee',
      name: 'Eichbaumsee',
      lat: 53.485366017398,
      lng: 10.103371314819,
      water_type: 'See',
      platform: 'alleangeln',
      fish_count: 0,
    };
    const geoIndexEntry: HejfishGeoIndexEntry = {
      id: 12189,
      name: 'Dove Elbe (Kombi-Karte)',
      lat: 53.498851,
      lng: 10.078256,
      water_type: 'Altarm',
      points: [{ lat: 53.498851, lng: 10.078256 }],
    };
    const area: HejfishArea = {
      id: 12189,
      global_id: 'hejfish-12189',
      source_platform: 'merged',
      external_ids: { hejfish: 12189, alleangeln: 'dove-elbe-krapphofschleuse' },
      name: 'Dove Elbe (Kombi-Karte)',
      water_type: 'Altarm',
      fish: ['Zander', 'Hecht', 'Flussbarsch'],
      techniques: ['Spinnangeln'],
      borders: 'Dove-Elbe: Angelstrecke der Kombi-Karte.',
      tickets: [{ name: 'Jahreskarte', price: '30,00 EUR' }],
      lat: 53.469139,
      lng: 10.189977,
      map_data: {
        locations: [{ lat: 53.498851, lng: 10.078256 }],
      },
      error: false,
    };
    const lakeArea: HejfishArea = {
      id: 'eichbaumsee',
      global_id: 'alleangeln-eichbaumsee',
      source_platform: 'alleangeln',
      name: 'Eichbaumsee',
      water_type: 'See',
      lat: 53.485366017398,
      lng: 10.103371314819,
      error: false,
    };
    const originalFetch = globalThis.fetch;
    const requestedDetails: string[] = [];
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('areas_lite')) return new Response(JSON.stringify([liteArea, nearbyLake]));
      if (url.includes('areas_geo_index')) return new Response(JSON.stringify([geoIndexEntry]));
      requestedDetails.push(url);
      if (url.includes('/details/merged/hejfish-12189.json')) return new Response(JSON.stringify(area));
      if (url.includes('/details/alleangeln/alleangeln-eichbaumsee.json')) return new Response(JSON.stringify(lakeArea));
      return new Response(null, { status: 404 });
    };
    globalThis.fetch = fetchMock;

    try {
      const provider = new HejfishAreasProvider();
      const profile = await provider.getWaterBodyProfile(53.498851, 10.078256);

      expect(requestedDetails).toEqual(expect.arrayContaining([
        expect.stringContaining('/details/merged/hejfish-12189.json'),
      ]));
      expect(requestedDetails.some((url) => url.includes('/details/hejfish/hejfish-12189.json'))).toBe(false);
      expect(profile?.id).toBe('hejfish-12189');
      expect(profile?.dataQuality).toBe('high');
      expect(profile?.species.map((entry) => entry.species)).toContain('zander');
      expect(profile?.links?.some((link) => link.url === 'https://www.alleangeln.de/gewaesser/dove-elbe-krapphofschleuse')).not.toBe(true);

      const mapClickProfile = await provider.getWaterBodyProfile(53.4831, 10.1016);
      expect(mapClickProfile?.id).toBe('hejfish-12189');
      expect(mapClickProfile?.name).toBe('Dove Elbe (Kombi-Karte)');
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

  it('uses canonical dist detail center, geometry and explicit detail links', async () => {
    const liteArea: HejfishAreaLite = {
      id: 'hejfish-12046',
      name: 'Kiesgrube Schwarzer Hecht',
      platform: 'merged',
      lat: 50.789989,
      lng: 10.30387,
      water_type: 'See',
      fish_count: 7,
      has_geometry: true,
      geometry_quality: 'polygon',
      detail_path: 'details/merged/hejfish-12046.json',
    };
    const geoIndexEntry: HejfishGeoIndexEntry = {
      id: 'hejfish-12046',
      platform: 'merged',
      name: 'Kiesgrube Schwarzer Hecht',
      lat: 50.789989,
      lng: 10.30387,
      points: [{ lat: 50.789989, lng: 10.30387 }],
      geometry_quality: 'polygon',
    };
    const area: HejfishArea = {
      id: 'hejfish-12046',
      source_platform: 'merged',
      source_ids: {
        hejfish: 12046,
        alleangeln: 'kiesgrube-schwarzer-hecht',
      },
      name: 'Kiesgrube Schwarzer Hecht',
      water_type: 'See',
      country: 'DE',
      center: {
        lat: 50.789989,
        lng: 10.30387,
        source: 'hejfish_api_map_geojson',
        confidence: 'high',
      },
      geometry: {
        points: [{ lat: 50.790017, lng: 10.30405 }],
        lines: [],
        polygons: [[
          { lat: 50.789592, lng: 10.304312 },
          { lat: 50.789968, lng: 10.304827 },
          { lat: 50.790175, lng: 10.304897 },
          { lat: 50.789592, lng: 10.304312 },
        ]],
        source: 'hejfish_api_map_geojson',
        confidence: 'high',
      },
      links: {
        source: 'https://www.hejfish.com/d/12046-kiesgrube-schwarzer-hecht',
        hejfish: 'https://www.hejfish.com/d/12046-kiesgrube-schwarzer-hecht',
        alleangeln: 'https://www.alleangeln.de/gewaesser/kiesgrube-schwarzer-hecht',
        image: 'https://example.test/hecht.jpg',
      },
      fish: ['Karpfen', 'Schleie', 'Rotauge', 'Hecht', 'Flussbarsch', 'Aal', 'Regenbogenforelle'],
      metadata: {
        merged_fields: {
          center: 'hejfish',
          fish: ['hejfish', 'alleangeln'],
          description: 'hejfish',
          geometry: 'hejfish',
          water_type: 'hejfish',
        },
        sources: {
          hejfish: {
            platform: 'hejfish',
            description: '<p>Kleiner Kiessee mit sehr gutem Karpfenbestand.</p>',
            techniques: ['Ansitzangeln', 'Spinnangeln'],
            rules_text: '<p>Gewaesserordnung beachten.</p>',
            tickets: [{ name: 'Tageskarte', price: '17,50 EUR' }],
            manager: { name: 'Sportanglerverein Barchfeld e.V.' },
            features: { digital_ticket: true },
            location: {
              city: { name: 'Barchfeld' },
              state: { name: 'Thueringen' },
              country: { name: 'Deutschland', code: 'de' },
            },
          },
          alleangeln: {
            platform: 'alleangeln',
            best_method: 'Spinnfischen',
          },
        },
      },
      last_updated: '2026-05-07T11:46:39.173Z',
      error: false,
    };
    const originalFetch = globalThis.fetch;
    const detailUrls: string[] = [];
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('areas_lite')) return new Response(JSON.stringify([liteArea]));
      if (url.includes('areas_geo_index')) return new Response(JSON.stringify([geoIndexEntry]));
      detailUrls.push(url);
      if (url.includes('/details/merged/hejfish-12046.json')) return new Response(JSON.stringify(area));
      return new Response(null, { status: 404 });
    };
    globalThis.fetch = fetchMock;

    try {
      const provider = new HejfishAreasProvider();
      const profile = await provider.getWaterBodyProfile(50.789989, 10.30387);

      expect(detailUrls[0]).toContain('/details/merged/hejfish-12046.json');
      expect(profile?.id).toBe('hejfish-12046');
      expect(profile?.latitude).toBe(50.789989);
      expect(profile?.longitude).toBe(10.30387);
      expect(profile?.sources).toEqual(['hejfish']);
      expect(profile?.description).toBeUndefined();
      expect(profile?.imageUrl).toBe('https://example.test/hecht.jpg');
      expect(profile?.species.map((entry) => entry.species)).toEqual(expect.arrayContaining(['hecht', 'barsch', 'aal', 'forelle']));
      expect(profile?.areaDetails?.mapGeometry?.points).toEqual([{ lat: 50.790017, lng: 10.30405 }]);
      expect(profile?.areaDetails?.mapGeometry?.polygons).toHaveLength(1);
      expect(profile?.areaDetails?.tickets).toBeUndefined();
      expect(profile?.areaDetails?.mobileTicket).toBe(false);
      expect(profile?.links?.some((link) => link.url === 'https://www.alleangeln.de/gewaesser/kiesgrube-schwarzer-hecht')).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('does not reuse images from loosely matched nearby water details', async () => {
    const liteAreas: HejfishAreaLite[] = [
      {
        id: 1,
        name: 'Wohra Altarm',
        lat: 51.3807,
        lng: 9.3447,
        water_type: 'See',
        platform: 'hejfish',
        fish_count: 2,
      },
      {
        id: 15212,
        name: 'Wohra',
        lat: 51.381,
        lng: 9.345,
        water_type: 'Fluss',
        platform: 'hejfish',
        fish_count: 7,
      },
    ];
    const primaryArea: HejfishArea = {
      id: 1,
      global_id: 'hejfish-1',
      source_platform: 'hejfish',
      name: 'Wohra Altarm',
      water_type: 'See',
      lat: 51.3807,
      lng: 9.3447,
      fish: ['Zander'],
      error: false,
    };
    const nearbyAreaWithImage: HejfishArea = {
      id: 15212,
      global_id: 'hejfish-15212',
      source_platform: 'hejfish',
      name: 'Wohra',
      water_type: 'Fluss',
      lat: 51.381,
      lng: 9.345,
      links: {
        image: 'https://file.hejfish.com/image/cc1200x900/6a/07/6a0774e71d67b879fba6bbf112d18ef2b921e1dd.jpg',
      },
      fish: ['Bachforelle'],
      error: false,
    };
    const originalFetch = globalThis.fetch;
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('areas_lite')) return new Response(JSON.stringify(liteAreas));
      if (url.includes('areas_geo_index')) return new Response(JSON.stringify([]));
      if (url.includes('/details/hejfish/hejfish-1.json')) return new Response(JSON.stringify(primaryArea));
      if (url.includes('/details/hejfish/hejfish-15212.json')) return new Response(JSON.stringify(nearbyAreaWithImage));
      return new Response(null, { status: 404 });
    };
    globalThis.fetch = fetchMock;

    try {
      const provider = new HejfishAreasProvider();
      const profile = await provider.getWaterBodyProfile(51.3807, 9.3447);

      expect(profile?.id).toBe('hejfish-1');
      expect(profile?.imageUrl).toBeUndefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
