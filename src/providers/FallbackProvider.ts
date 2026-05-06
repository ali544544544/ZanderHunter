import type { WaterBodyProfile, WaterDataProvider } from '../types/waterData';

export class FallbackProvider implements WaterDataProvider {
  name = 'Fallback';
  priority = 99;

  canHandleRegion(): boolean {
    return true;
  }

  async getWaterBodyProfile(lat: number, lng: number): Promise<WaterBodyProfile> {
    return {
      id: `fallback-${lat.toFixed(3)}-${lng.toFixed(3)}`,
      name: 'Keine Gewässerdaten gefunden',
      type: 'lake',
      latitude: lat,
      longitude: lng,
      region: this.detectRegion(lat, lng),
      species: [],
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
}
