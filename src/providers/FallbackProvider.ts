import type { SpeciesConfidence, WaterBodyProfile, WaterDataProvider } from '../types/waterData';

interface LocalWaterBody {
  id: string;
  name: string;
  type: WaterBodyProfile['type'];
  lat: number;
  lng: number;
  radiusMeters: number;
  bounds?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  species: Array<{ species: SpeciesConfidence['species']; confidence: number; notes?: string }>;
}

const localWaterBodies: LocalWaterBody[] = [
  {
    id: 'dove-elbe',
    name: 'Dove-Elbe',
    type: 'river',
    lat: 53.511,
    lng: 10.121,
    radiusMeters: 2500,
    bounds: {
      minLat: 53.475,
      maxLat: 53.535,
      minLng: 10.075,
      maxLng: 10.22,
    },
    species: [
      { species: 'zander', confidence: 0.72, notes: 'Lokales App-Profil: Kanten und Schleusenbereich' },
      { species: 'barsch', confidence: 0.68 },
      { species: 'hecht', confidence: 0.55 },
      { species: 'brasse', confidence: 0.62 },
      { species: 'rotauge', confidence: 0.7 },
    ],
  },
  {
    id: 'billwerder-bucht',
    name: 'Billwerder Bucht',
    type: 'lake',
    lat: 53.499,
    lng: 10.078,
    radiusMeters: 1800,
    species: [
      { species: 'zander', confidence: 0.66 },
      { species: 'barsch', confidence: 0.62 },
      { species: 'hecht', confidence: 0.48 },
      { species: 'brasse', confidence: 0.7 },
      { species: 'rotauge', confidence: 0.72 },
    ],
  },
  {
    id: 'mittelkanal',
    name: 'Mittelkanal / Billbrook',
    type: 'canal',
    lat: 53.519,
    lng: 10.065,
    radiusMeters: 1600,
    species: [
      { species: 'zander', confidence: 0.7 },
      { species: 'barsch', confidence: 0.65 },
      { species: 'rotauge', confidence: 0.62 },
      { species: 'brasse', confidence: 0.55 },
    ],
  },
  {
    id: 'suederelbe',
    name: 'Suederelbe',
    type: 'river',
    lat: 53.521,
    lng: 9.924,
    radiusMeters: 2400,
    species: [
      { species: 'zander', confidence: 0.74 },
      { species: 'barsch', confidence: 0.58 },
      { species: 'hecht', confidence: 0.38 },
      { species: 'brasse', confidence: 0.64 },
      { species: 'rotauge', confidence: 0.66 },
    ],
  },
  {
    id: 'aussenalster',
    name: 'Aussenalster',
    type: 'lake',
    lat: 53.567,
    lng: 10.003,
    radiusMeters: 1800,
    species: [
      { species: 'zander', confidence: 0.62 },
      { species: 'barsch', confidence: 0.72 },
      { species: 'hecht', confidence: 0.5 },
      { species: 'brasse', confidence: 0.75 },
      { species: 'rotauge', confidence: 0.78 },
    ],
  },
];

export class FallbackProvider implements WaterDataProvider {
  name = 'Fallback';
  priority = 99;

  canHandleRegion(): boolean {
    return true;
  }

  async getWaterBodyProfile(lat: number, lng: number): Promise<WaterBodyProfile> {
    const localWater = this.findLocalWaterBody(lat, lng);
    if (localWater) {
      return this.createLocalProfile(localWater, lat, lng);
    }

    const region = this.detectRegion(lat, lng);

    return {
      id: `fallback-${lat.toFixed(3)}-${lng.toFixed(3)}`,
      name: 'Unbekanntes Gewaesser',
      type: 'lake',
      latitude: lat,
      longitude: lng,
      region,
      species: this.getDefaultSpeciesForRegion(),
      dataQuality: 'unknown',
      sources: ['unknown'],
      lastUpdated: new Date(),
    };
  }

  async searchWaterBodies(): Promise<WaterBodyProfile[]> {
    return [];
  }

  private detectRegion(lat: number, lng: number): string {
    if (lat >= 50.3 && lat <= 52.5 && lng >= 5.9 && lng <= 9.5) return 'NRW';
    if (lat >= 53.4 && lat <= 53.7 && lng >= 9.8 && lng <= 10.3) return 'Hamburg';
    if (lat >= 52.3 && lat <= 53.9 && lng >= 12.8 && lng <= 14.0) return 'Berlin';
    return 'Deutschland';
  }

  private findLocalWaterBody(lat: number, lng: number): LocalWaterBody | null {
    const matches = localWaterBodies
      .map((waterBody) => ({
        waterBody,
        distance: this.distanceMeters(lat, lng, waterBody.lat, waterBody.lng),
      }))
      .filter((match) => (
        match.distance <= match.waterBody.radiusMeters || this.isInsideBounds(lat, lng, match.waterBody)
      ))
      .sort((a, b) => a.distance - b.distance);

    return matches[0]?.waterBody ?? null;
  }

  private isInsideBounds(lat: number, lng: number, waterBody: LocalWaterBody): boolean {
    if (!waterBody.bounds) return false;

    return lat >= waterBody.bounds.minLat
      && lat <= waterBody.bounds.maxLat
      && lng >= waterBody.bounds.minLng
      && lng <= waterBody.bounds.maxLng;
  }

  private createLocalProfile(waterBody: LocalWaterBody, lat: number, lng: number): WaterBodyProfile {
    const lastUpdated = new Date();

    return {
      id: `local-${waterBody.id}`,
      name: waterBody.name,
      type: waterBody.type,
      latitude: lat,
      longitude: lng,
      region: 'Hamburg',
      species: waterBody.species.map((entry) => ({
        species: entry.species,
        confidence: entry.confidence,
        source: 'user_report',
        lastUpdated,
        notes: entry.notes,
      })),
      regulations: {
        permit_required: true,
        closed_seasons: [
          { species: 'zander', start: '02-01', end: '05-31' },
          { species: 'hecht', start: '02-01', end: '05-31' },
        ],
        size_limits: [
          { species: 'zander', min_cm: 45 },
          { species: 'hecht', min_cm: 45 },
          { species: 'barsch', min_cm: 10 },
        ],
        bag_limits: [
          { species: 'zander', daily_limit: 2 },
          { species: 'hecht', daily_limit: 2 },
        ],
      },
      dataQuality: 'medium',
      sources: ['user_report'],
      lastUpdated,
    };
  }

  private distanceMeters(latA: number, lngA: number, latB: number, lngB: number): number {
    const earthRadiusMeters = 6371000;
    const toRadians = (value: number) => value * Math.PI / 180;
    const deltaLat = toRadians(latB - latA);
    const deltaLng = toRadians(lngB - lngA);
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
      + Math.cos(toRadians(latA)) * Math.cos(toRadians(latB))
      * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private getDefaultSpeciesForRegion(): SpeciesConfidence[] {
    const lastUpdated = new Date();
    return [
      { species: 'barsch', confidence: 0.7, source: 'unknown', lastUpdated },
      { species: 'rotauge', confidence: 0.8, source: 'unknown', lastUpdated },
      { species: 'brasse', confidence: 0.6, source: 'unknown', lastUpdated },
      { species: 'hecht', confidence: 0.4, source: 'unknown', lastUpdated },
      { species: 'zander', confidence: 0.35, source: 'unknown', lastUpdated },
    ];
  }
}
