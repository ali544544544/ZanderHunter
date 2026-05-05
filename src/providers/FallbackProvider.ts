import type { SpeciesConfidence, WaterBodyProfile, WaterDataProvider } from '../types/waterData';

export class FallbackProvider implements WaterDataProvider {
  name = 'Fallback';
  priority = 99;

  canHandleRegion(): boolean {
    return true;
  }

  async getWaterBodyProfile(lat: number, lng: number): Promise<WaterBodyProfile> {
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
