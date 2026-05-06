import { describe, expect, it } from 'vitest';
import { FallbackProvider } from '../providers/FallbackProvider';
import { HejfishAreasProvider } from '../providers/HejfishAreasProvider';
import type { HejfishArea, HejfishAreaLite } from '../types/hejfishArea';

describe('FallbackProvider local water detection', () => {
  it('recognizes a map point on the Dove-Elbe', async () => {
    const provider = new FallbackProvider();
    const profile = await provider.getWaterBodyProfile(53.511, 10.121);

    expect(profile.name).toBe('Dove-Elbe');
    expect(profile.type).toBe('river');
    expect(profile.dataQuality).toBe('medium');
    expect(profile.sources).toContain('user_report');
    expect(profile.species.some((entry) => entry.species === 'zander')).toBe(true);
    expect(profile.species.some((entry) => entry.species === 'aal')).toBe(true);
    expect(profile.links?.some((link) => link.label.includes('hejfish'))).toBe(true);
  });

  it('recognizes a map point on the Elbe as a river', async () => {
    const provider = new FallbackProvider();
    const profile = await provider.getWaterBodyProfile(53.545, 9.89);

    expect(profile.name).toBe('Elbe');
    expect(profile.type).toBe('river');
    expect(profile.species.length).toBeGreaterThanOrEqual(8);
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
      error: false,
    };
    const originalFetch = globalThis.fetch;
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      return new Response(JSON.stringify(url.includes('areas_lite') ? [liteArea] : area));
    };
    globalThis.fetch = fetchMock;

    try {
      const provider = new HejfishAreasProvider();
      const profile = await provider.getWaterBodyProfile(48.0123, 9.3456);

      expect(profile?.name).toBe(area.name);
      expect(profile?.sources).toContain('hejfish');
      expect(profile?.species.map((entry) => entry.species)).toContain('zander');
      expect(profile?.species.map((entry) => entry.species)).toContain('forelle');
      expect(profile?.areaDetails?.tickets?.[0].name).toBe('Tageskarte');
      expect(profile?.links?.[0].url).toBe(area.url);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
