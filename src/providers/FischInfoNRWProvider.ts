import type { FishSpecies, WaterBodyProfile, WaterBodyType, WaterDataProvider } from '../types/waterData';

type FischInfoWater = {
  id?: string | number;
  name?: string;
  typ?: string;
  latitude?: number;
  longitude?: number;
};

type FischInfoSpecies = {
  name?: string;
  haeufigkeit?: string;
  datum?: string;
  bemerkung?: string;
};

const speciesMap: Record<string, FishSpecies> = {
  Zander: 'zander',
  Hecht: 'hecht',
  Flussbarsch: 'barsch',
  Barsch: 'barsch',
  Karpfen: 'karpfen',
  Aal: 'aal',
  Brassen: 'brasse',
  Brachse: 'brasse',
  Rotauge: 'rotauge',
  Wels: 'wels',
  Forelle: 'forelle',
  Bachforelle: 'forelle',
  Regenbogenforelle: 'forelle',
};

export class FischInfoNRWProvider implements WaterDataProvider {
  name = 'FischInfo NRW';
  priority = 2;

  private baseUrl = 'https://fischinfo.naturschutzinformationen.nrw.de/fischinfo/api';

  canHandleRegion(lat: number, lng: number): boolean {
    return lat >= 50.3 && lat <= 52.5 && lng >= 5.9 && lng <= 9.5;
  }

  async getWaterBodyProfile(lat: number, lng: number, radius: number = 2000): Promise<WaterBodyProfile | null> {
    try {
      const probestellenUrl = new URL(`${this.baseUrl}/probestellen`);
      probestellenUrl.searchParams.set('lat', String(lat));
      probestellenUrl.searchParams.set('lng', String(lng));
      probestellenUrl.searchParams.set('radius', String(radius));

      const probestellenResponse = await fetch(probestellenUrl.toString());
      if (!probestellenResponse.ok) return null;

      const probestellen = await probestellenResponse.json();
      const closest = probestellen.features?.[0];
      const gewaesserId = closest?.properties?.gewaesser_id || closest?.properties?.id;
      if (!gewaesserId) return null;

      const gewaesserResponse = await fetch(`${this.baseUrl}/gewaesser/${gewaesserId}`);
      if (!gewaesserResponse.ok) return null;

      const arten = await this.fetchArten(gewaesserId);
      return this.mapToWaterBodyProfile(await gewaesserResponse.json(), arten, lat, lng);
    } catch (error) {
      console.error('FischInfo NRW error:', error);
      return null;
    }
  }

  async searchWaterBodies(query: string): Promise<WaterBodyProfile[]> {
    if (query.trim().length < 2) return [];

    try {
      const url = new URL(`${this.baseUrl}/gewaesser/search`);
      url.searchParams.set('q', query);
      const response = await fetch(url.toString());

      if (!response.ok) return [];

      const results = await response.json();
      return Promise.all(
        (results.gewaesser || []).map(async (gewaesser: FischInfoWater) => {
          const arten = await this.fetchArten(String(gewaesser.id));
          return this.mapToWaterBodyProfile(gewaesser, arten);
        })
      );
    } catch (error) {
      console.error('FischInfo NRW search error:', error);
      return [];
    }
  }

  private async fetchArten(gewaesserId: string | number): Promise<{ arten: FischInfoSpecies[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/artnachweise?gewaesser_id=${gewaesserId}`);
      return response.ok ? await response.json() : { arten: [] };
    } catch {
      return { arten: [] };
    }
  }

  private mapToWaterBodyProfile(
    gewaesser: FischInfoWater,
    arten: { arten?: FischInfoSpecies[] },
    fallbackLat?: number,
    fallbackLng?: number
  ): WaterBodyProfile {
    const species = (arten.arten || [])
      .map((art) => {
        const mappedSpecies = art.name ? speciesMap[art.name] : undefined;
        if (!mappedSpecies) return null;

        return {
          species: mappedSpecies,
          confidence: this.mapFrequency(art.haeufigkeit),
          source: 'fischinfo_nrw' as const,
          lastUpdated: new Date(art.datum || Date.now()),
          notes: art.bemerkung,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return {
      id: `fischinfo-nrw-${gewaesser.id || `${fallbackLat}-${fallbackLng}`}`,
      name: gewaesser.name || 'NRW-Gewaesser',
      type: this.mapGewaessertyp(gewaesser.typ),
      latitude: gewaesser.latitude ?? fallbackLat ?? 0,
      longitude: gewaesser.longitude ?? fallbackLng ?? 0,
      region: 'NRW',
      species,
      dataQuality: species.length > 0 ? 'high' : 'low',
      sources: ['fischinfo_nrw'],
      lastUpdated: new Date(),
    };
  }

  private mapFrequency(value?: string): number {
    const normalized = value?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
    if (normalized === 'sehr haeufig' || normalized === 'sehr haufig') return 0.9;
    if (normalized === 'haeufig' || normalized === 'haufig') return 0.8;
    if (normalized === 'selten') return 0.3;
    if (normalized === 'sehr selten') return 0.1;
    return 0.5;
  }

  private mapGewaessertyp(typ?: string): WaterBodyType {
    const normalized = typ?.toLowerCase() || '';
    if (normalized.includes('fluss') || normalized.includes('bach')) return 'river';
    if (normalized.includes('kanal')) return 'canal';
    if (normalized.includes('teich')) return 'pond';
    if (normalized.includes('see')) return 'lake';
    return 'river';
  }
}
