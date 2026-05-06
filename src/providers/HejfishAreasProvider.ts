import type { HejfishArea, HejfishAreaLite } from '../types/hejfishArea';
import type { FishSpecies, WaterBodyProfile, WaterBodyType, WaterDataProvider } from '../types/waterData';

type Coordinate = { lat: number; lng: number };

const knownSpeciesMap: Record<string, FishSpecies> = {
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

  private liteAreasPromise: Promise<HejfishAreaLite[]> | null = null;
  private detailPromises = new Map<number, Promise<HejfishArea | null>>();
  private resolvedDataBaseUrl: string | null = null;

  canHandleRegion(): boolean {
    return true;
  }

  async getWaterBodyProfile(lat: number, lng: number): Promise<WaterBodyProfile | null> {
    const liteAreas = await this.loadLiteAreas();
    const candidates = this.findLiteCandidates(liteAreas, lat, lng).slice(0, 8);
    if (candidates.length === 0) return null;

    const details = (await Promise.all(candidates.map((candidate) => this.loadAreaDetail(candidate.area.id))))
      .filter((area): area is HejfishArea => Boolean(area));

    const polygonMatch = details.find((area) => this.isInsideAreaPolygon(lat, lng, area));
    if (polygonMatch) return this.mapAreaToProfile(polygonMatch, lat, lng);

    const nearestDetail = details
      .map((area) => ({
        area,
        distance: typeof area.lat === 'number' && typeof area.lng === 'number'
          ? this.distanceMeters(lat, lng, area.lat, area.lng)
          : Number.POSITIVE_INFINITY,
      }))
      .filter((match) => match.distance <= this.getRadiusMeters(match.area))
      .sort((a, b) => a.distance - b.distance)[0]?.area;

    return nearestDetail ? this.mapAreaToProfile(nearestDetail, lat, lng) : null;
  }

  async searchWaterBodies(query: string, region?: string): Promise<WaterBodyProfile[]> {
    const normalizedQuery = this.normalize(query);
    if (normalizedQuery.length < 2) return [];

    const normalizedRegion = region ? this.normalize(region) : '';
    const liteAreas = await this.loadLiteAreas();

    return liteAreas
      .filter((area) => {
        const haystack = this.normalize([
          area.name,
          area.slug,
          area.water_type,
        ].filter(Boolean).join(' '));

        return haystack.includes(normalizedQuery)
          && (!normalizedRegion || haystack.includes(normalizedRegion));
      })
      .slice(0, 20)
      .map((area) => this.mapLiteAreaToProfile(area));
  }

  private async loadLiteAreas(): Promise<HejfishAreaLite[]> {
    if (!this.liteAreasPromise) {
      this.liteAreasPromise = this.fetchLiteAreas();
    }
    return this.liteAreasPromise;
  }

  private async fetchLiteAreas(): Promise<HejfishAreaLite[]> {
    for (const baseUrl of this.getDataBaseUrls()) {
      try {
        const response = await fetch(`${baseUrl}areas_lite.json`, {
          cache: 'force-cache',
        });

        if (!response.ok) continue;

        const data = await response.json();
        if (!Array.isArray(data)) continue;

        this.resolvedDataBaseUrl = baseUrl;
        return data.filter((area): area is HejfishAreaLite => (
            Boolean(area)
            && typeof area.id === 'number'
            && typeof area.lat === 'number'
            && typeof area.lng === 'number'
        ));
      } catch {
        continue;
      }
    }

    return [];
  }

  private async loadAreaDetail(id: number): Promise<HejfishArea | null> {
    if (!this.detailPromises.has(id)) {
      this.detailPromises.set(id, this.fetchAreaDetail(id));
    }
    return this.detailPromises.get(id)!;
  }

  private async fetchAreaDetail(id: number): Promise<HejfishArea | null> {
    const baseUrls = this.resolvedDataBaseUrl ? [this.resolvedDataBaseUrl] : this.getDataBaseUrls();

    for (const baseUrl of baseUrls) {
      try {
        const response = await fetch(`${baseUrl}details/${id}.json`, {
          cache: 'force-cache',
        });

        if (!response.ok) continue;

        const data = await response.json();
        if (data && typeof data.id === 'number' && !data.error) {
          return data as HejfishArea;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private getDataBaseUrls(): string[] {
    const configured = import.meta.env.VITE_HEJFISH_DATA_BASE_URL;
    const baseUrls = configured
      ? [configured]
      : [`${import.meta.env.BASE_URL}data/dist/`, `${import.meta.env.BASE_URL}data/`];

    return baseUrls.map((baseUrl) => this.normalizeBaseUrl(baseUrl));
  }

  private normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  }

  private findLiteCandidates(areas: HejfishAreaLite[], lat: number, lng: number) {
    return areas
      .map((area) => ({
        area,
        distance: this.distanceMeters(lat, lng, area.lat, area.lng),
      }))
      .filter((match) => match.distance <= this.getLiteRadiusMeters(match.area))
      .sort((a, b) => a.distance - b.distance);
  }

  private getLiteRadiusMeters(area: HejfishAreaLite): number {
    const type = this.mapWaterType(area.water_type);
    if (type === 'river' || type === 'canal') return 2500;
    return 1500;
  }

  private getRadiusMeters(area: HejfishArea): number {
    const sizeHa = area.water_size_ha || 0;
    if (sizeHa <= 0) return this.mapWaterType(area.water_type) === 'river' ? 2500 : 1000;

    const radius = Math.sqrt(sizeHa * 10000 / Math.PI) + 300;
    return Math.max(500, Math.min(3000, radius));
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

  private mapLiteAreaToProfile(area: HejfishAreaLite): WaterBodyProfile {
    return {
      id: `hejfish-${area.id}`,
      name: area.name,
      type: this.mapWaterType(area.water_type),
      latitude: area.lat,
      longitude: area.lng,
      region: 'hejfish',
      imageUrl: area.main_image,
      species: [],
      regulations: {
        permit_required: true,
      },
      dataQuality: 'medium',
      sources: ['hejfish'],
      links: [{ label: 'hejfish Details', url: `https://www.hejfish.com/d/${area.id}-${area.slug}`, kind: 'permit' }],
      areaDetails: {
        mobileTicket: area.mobile_ticket,
      },
      lastUpdated: new Date(),
    };
  }

  private mapAreaToProfile(area: HejfishArea, lat: number, lng: number): WaterBodyProfile {
    const lastUpdated = new Date(area.last_updated || Date.now());
    const uniqueFish = Array.from(new Map((area.fish || []).map((name) => {
      const species = this.mapFishSpecies(name);
      return [species, { species, displayName: name }];
    })).values());

    return {
      id: `hejfish-${area.id}`,
      name: area.name,
      type: this.mapWaterType(area.water_type),
      latitude: area.lat ?? lat,
      longitude: area.lng ?? lng,
      region: area.location_info?.join(', ') || area.country || 'Unbekannt',
      description: area.description,
      imageUrl: area.main_image,
      species: uniqueFish.map((entry) => ({
        species: entry.species,
        displayName: entry.displayName,
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

  private mapFishSpecies(name: string): FishSpecies {
    const normalized = this.normalize(name);
    return knownSpeciesMap[normalized] || normalized || name;
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
