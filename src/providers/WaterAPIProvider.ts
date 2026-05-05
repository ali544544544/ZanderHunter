import type { FishSpecies, WaterBodyProfile, WaterBodyType, WaterDataProvider } from '../types/waterData';

type WaterApiFish = {
  name?: string;
  abundance?: number | string;
  notes?: string;
};

type WaterApiWater = {
  id?: string | number;
  name?: string;
  type?: string;
  latitude?: number;
  longitude?: number;
  region?: string;
  fish_species?: WaterApiFish[];
  depth?: {
    average?: number;
    max?: number;
  };
  regulations?: WaterBodyProfile['regulations'];
};

const speciesMap: Record<string, FishSpecies> = {
  pike: 'hecht',
  hecht: 'hecht',
  zander: 'zander',
  perch: 'barsch',
  barsch: 'barsch',
  flussbarsch: 'barsch',
  carp: 'karpfen',
  karpfen: 'karpfen',
  eel: 'aal',
  aal: 'aal',
  bream: 'brasse',
  brasse: 'brasse',
  roach: 'rotauge',
  rotauge: 'rotauge',
  catfish: 'wels',
  wels: 'wels',
  trout: 'forelle',
  forelle: 'forelle',
};

export class WaterAPIProvider implements WaterDataProvider {
  name = 'WaterAPI';
  priority = 1;

  private apiKey: string;
  private baseUrl = 'https://api.waterapi.nl/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_WATERAPI_KEY || '';
  }

  canHandleRegion(lat: number, lng: number): boolean {
    return lat >= 35 && lat <= 71 && lng >= -10 && lng <= 40;
  }

  async getWaterBodyProfile(lat: number, lng: number, radius: number = 1000): Promise<WaterBodyProfile | null> {
    if (!this.apiKey) return null;

    try {
      const nearbyUrl = new URL(`${this.baseUrl}/waters/nearby`);
      nearbyUrl.searchParams.set('lat', String(lat));
      nearbyUrl.searchParams.set('lng', String(lng));
      nearbyUrl.searchParams.set('radius', String(radius));

      const nearbyResponse = await fetch(nearbyUrl.toString(), {
        headers: this.getHeaders(),
      });

      if (!nearbyResponse.ok) return null;

      const nearbyData = await nearbyResponse.json();
      const closestWater = nearbyData.waters?.[0];
      if (!closestWater?.id) return null;

      const detailResponse = await fetch(`${this.baseUrl}/waters/${closestWater.id}`, {
        headers: this.getHeaders(),
      });

      if (!detailResponse.ok) return null;

      return this.mapToWaterBodyProfile(await detailResponse.json(), lat, lng);
    } catch (error) {
      console.error('WaterAPI error:', error);
      return null;
    }
  }

  async searchWaterBodies(query: string, region?: string): Promise<WaterBodyProfile[]> {
    if (!this.apiKey || query.trim().length < 2) return [];

    try {
      const url = new URL(`${this.baseUrl}/waters/search`);
      url.searchParams.set('q', query);
      if (region) url.searchParams.set('region', region);

      const response = await fetch(url.toString(), {
        headers: this.getHeaders(),
      });

      if (!response.ok) return [];

      const data = await response.json();
      return (data.waters || []).map((water: WaterApiWater) => this.mapToWaterBodyProfile(water));
    } catch (error) {
      console.error('WaterAPI search error:', error);
      return [];
    }
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
    };
  }

  private mapToWaterBodyProfile(waterApiData: WaterApiWater, fallbackLat?: number, fallbackLng?: number): WaterBodyProfile {
    const species = (waterApiData.fish_species || [])
      .map((fish) => {
        const name = fish.name?.toLowerCase().replace(/\s+/g, '') || '';
        const mappedSpecies = speciesMap[name];
        if (!mappedSpecies) return null;

        const abundance = Number(fish.abundance);
        return {
          species: mappedSpecies,
          confidence: Number.isFinite(abundance) ? Math.max(0, Math.min(1, abundance / 100)) : 0.5,
          source: 'waterapi' as const,
          lastUpdated: new Date(),
          notes: fish.notes,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return {
      id: `waterapi-${waterApiData.id || `${fallbackLat}-${fallbackLng}`}`,
      name: waterApiData.name || 'Unbekanntes Gewaesser',
      type: this.mapWaterType(waterApiData.type),
      latitude: waterApiData.latitude ?? fallbackLat ?? 0,
      longitude: waterApiData.longitude ?? fallbackLng ?? 0,
      region: waterApiData.region || 'Europa',
      species,
      depth: waterApiData.depth
        ? {
            average: waterApiData.depth.average,
            max: waterApiData.depth.max,
            unit: 'm',
          }
        : undefined,
      regulations: waterApiData.regulations,
      dataQuality: species.length > 3 ? 'high' : species.length > 0 ? 'medium' : 'low',
      sources: ['waterapi'],
      lastUpdated: new Date(),
    };
  }

  private mapWaterType(type?: string): WaterBodyType {
    const normalized = type?.toLowerCase() || '';
    if (normalized.includes('river') || normalized.includes('fluss') || normalized.includes('bach')) return 'river';
    if (normalized.includes('canal') || normalized.includes('kanal')) return 'canal';
    if (normalized.includes('pond') || normalized.includes('teich')) return 'pond';
    if (normalized.includes('sea') || normalized.includes('meer')) return 'sea';
    return 'lake';
  }
}
