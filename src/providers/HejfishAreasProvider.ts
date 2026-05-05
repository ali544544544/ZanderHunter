import type { HejfishArea } from '../types/hejfishArea';
import type { FishSpecies, WaterBodyProfile, WaterBodyType, WaterDataProvider } from '../types/waterData';

type Coordinate = { lat: number; lng: number };

const speciesMap: Record<string, FishSpecies> = {
  zander: 'zander',
  hecht: 'hecht',
  barsch: 'barsch',
  flussbarsch: 'barsch',
  karpfen: 'karpfen',
  aal: 'aal',
  brasse: 'brasse',
  brachse: 'brasse',
  rotauge: 'rotauge',
  forelle: 'forelle',
  regenbogenforelle: 'forelle',
  bachforelle: 'forelle',
  wels: 'wels',
  waller: 'wels',
};

export class HejfishAreasProvider implements WaterDataProvider {
  name = 'hejfish areas';
  priority = 0;

  private areasPromise: Promise<HejfishArea[]> | null = null;

  canHandleRegion(): boolean {
    return true;
  }

  async getWaterBodyProfile(lat: number, lng: number): Promise<WaterBodyProfile | null> {
    const areas = await this.loadAreas();
    const match = this.findBestAreaMatch(areas, lat, lng);
    return match ? this.mapAreaToProfile(match, lat, lng) : null;
  }

  async searchWaterBodies(query: string, region?: string): Promise<WaterBodyProfile[]> {
    const normalizedQuery = this.normalize(query);
    if (normalizedQuery.length < 2) return [];

    const normalizedRegion = region ? this.normalize(region) : '';
    const areas = await this.loadAreas();

    return areas
      .filter((area) => {
        const haystack = this.normalize([
          area.name,
          area.description,
          ...(area.location_info || []),
        ].filter(Boolean).join(' '));

        return haystack.includes(normalizedQuery)
          && (!normalizedRegion || haystack.includes(normalizedRegion));
      })
      .slice(0, 20)
      .map((area) => this.mapAreaToProfile(area, area.lat || 0, area.lng || 0));
  }

  private async loadAreas(): Promise<HejfishArea[]> {
    if (!this.areasPromise) {
      this.areasPromise = this.fetchAreas();
    }
    return this.areasPromise;
  }

  private async fetchAreas(): Promise<HejfishArea[]> {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/areas.json`, {
        cache: 'force-cache',
      });

      if (!response.ok) return [];

      const data = await response.json();
      return Array.isArray(data)
        ? data.filter((area): area is HejfishArea => Boolean(area && !area.error))
        : [];
    } catch {
      return [];
    }
  }

  private findBestAreaMatch(areas: HejfishArea[], lat: number, lng: number): HejfishArea | null {
    const matches = areas
      .map((area) => ({
        area,
        distance: typeof area.lat === 'number' && typeof area.lng === 'number'
          ? this.distanceMeters(lat, lng, area.lat, area.lng)
          : Number.POSITIVE_INFINITY,
        insidePolygon: this.isInsideAreaPolygon(lat, lng, area),
      }))
      .filter((match) => match.insidePolygon || match.distance <= this.getRadiusMeters(match.area))
      .sort((a, b) => {
        if (a.insidePolygon !== b.insidePolygon) return a.insidePolygon ? -1 : 1;
        return a.distance - b.distance;
      });

    return matches[0]?.area ?? null;
  }

  private getRadiusMeters(area: HejfishArea): number {
    const sizeHa = area.water_size_ha || 0;
    if (sizeHa <= 0) return 1000;

    const radius = Math.sqrt(sizeHa * 10000 / Math.PI) + 300;
    return Math.max(500, Math.min(2500, radius));
  }

  private isInsideAreaPolygon(lat: number, lng: number, area: HejfishArea): boolean {
    const polygons = area.map_data?.polygons;
    if (!Array.isArray(polygons)) return false;

    return polygons.some((polygon) => {
      const coordinates = this.extractCoordinates(polygon);
      return coordinates.length >= 3 && this.isPointInPolygon({ lat, lng }, coordinates);
    });
  }

  private extractCoordinates(value: unknown): Coordinate[] {
    if (!Array.isArray(value)) {
      if (value && typeof value === 'object') {
        const objectValue = value as Record<string, unknown>;
        return this.extractCoordinates(objectValue.points || objectValue.coordinates || objectValue.path);
      }
      return [];
    }

    if (value.length === 0) return [];

    const first = value[0];
    if (typeof first === 'number' && typeof value[1] === 'number') {
      const firstNumber = first;
      const secondNumber = value[1] as number;
      return [{
        lat: Math.abs(firstNumber) <= 90 ? firstNumber : secondNumber,
        lng: Math.abs(firstNumber) <= 90 ? secondNumber : firstNumber,
      }];
    }

    if (first && typeof first === 'object' && !Array.isArray(first)) {
      return (value as Array<Record<string, unknown>>)
        .map((point) => {
          const lat = Number(point.lat ?? point.latitude);
          const lng = Number(point.lng ?? point.lon ?? point.longitude);
          return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
        })
        .filter((point): point is Coordinate => Boolean(point));
    }

    return value.flatMap((entry) => this.extractCoordinates(entry));
  }

  private isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;
      const intersects = ((yi > point.lat) !== (yj > point.lat))
        && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);

      if (intersects) inside = !inside;
    }

    return inside;
  }

  private mapAreaToProfile(area: HejfishArea, lat: number, lng: number): WaterBodyProfile {
    const lastUpdated = new Date(area.last_updated || Date.now());
    const fish = (area.fish || [])
      .map((name) => speciesMap[this.normalize(name)])
      .filter((species): species is FishSpecies => Boolean(species));
    const uniqueFish = Array.from(new Set(fish));

    return {
      id: `hejfish-${area.id}`,
      name: area.name,
      type: this.mapWaterType(area.water_type),
      latitude: area.lat ?? lat,
      longitude: area.lng ?? lng,
      region: area.location_info?.join(', ') || area.country || 'Unbekannt',
      description: area.description,
      imageUrl: area.main_image,
      species: uniqueFish.map((species) => ({
        species,
        confidence: 0.9,
        source: 'hejfish',
        lastUpdated,
      })),
      regulations: {
        permit_required: true,
      },
      dataQuality: uniqueFish.length > 0 ? 'high' : 'medium',
      sources: ['hejfish'],
      links: [
        { label: 'hejfish Gewaesser', url: area.url, kind: 'permit' },
        ...(area.manager?.website
          ? [{ label: 'Betreiber', url: area.manager.website, kind: 'info' as const }]
          : []),
      ],
      areaDetails: {
        waterSizeHa: area.water_size_ha,
        season: area.season,
        techniques: area.techniques,
        properties: area.properties,
        rulesText: area.rules_text,
        mobileTicket: area.mobile_ticket,
        printRequired: area.print_required,
        tickets: area.tickets,
        manager: area.manager,
      },
      lastUpdated,
    };
  }

  private mapWaterType(type?: string): WaterBodyType {
    const normalized = this.normalize(type || '');
    if (normalized.includes('fliess') || normalized.includes('fluss') || normalized.includes('river')) return 'river';
    if (normalized.includes('kanal') || normalized.includes('canal')) return 'canal';
    if (normalized.includes('teich') || normalized.includes('pond')) return 'pond';
    if (normalized.includes('meer') || normalized.includes('sea')) return 'sea';
    return 'lake';
  }

  private normalize(value: string): string {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
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
}
