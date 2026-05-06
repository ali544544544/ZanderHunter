import type { HejfishArea, HejfishAreaLite } from '../types/hejfishArea';
import type { FishSpecies, WaterBodyProfile, WaterBodyType, WaterDataProvider } from '../types/waterData';

type Coordinate = { lat: number; lng: number };
type LiteCandidate = { area: HejfishAreaLite; distance: number };

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

const hamburgAreaKeywords = [
  'doveelbe',
  'stromelbe',
  'elbe',
  'hamburg',
  'hohendeicher',
  'oortkatensee',
  'billwerder',
];

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
        distance: this.getNearestAreaDistanceMeters(lat, lng, area),
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
            && (typeof area.lat === 'number' || area.lat === null)
            && (typeof area.lng === 'number' || area.lng === null)
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

  private findLiteCandidates(areas: HejfishAreaLite[], lat: number, lng: number): LiteCandidate[] {
    const coordinateCandidates = areas
      .filter((area) => typeof area.lat === 'number' && typeof area.lng === 'number')
      .map((area) => ({
        area,
        distance: this.distanceMeters(lat, lng, area.lat as number, area.lng as number),
      }))
      .filter((match) => match.distance <= this.getLiteRadiusMeters(match.area))
      .sort((a, b) => a.distance - b.distance);

    const regionalCandidates = areas
      .filter((area) => (typeof area.lat !== 'number' || typeof area.lng !== 'number') && this.isRegionalNameCandidate(area, lat, lng))
      .map((area) => ({ area, distance: Number.MAX_SAFE_INTEGER }));

    return [...regionalCandidates, ...coordinateCandidates];
  }

  private getLiteRadiusMeters(area: HejfishAreaLite): number {
    const type = this.mapWaterType(area.water_type, area.name);
    if (type === 'river' || type === 'canal') return 2500;
    return 1500;
  }

  private getRadiusMeters(area: HejfishArea): number {
    const sizeHa = area.water_size_ha || 0;
    if (sizeHa <= 0) {
      if (this.getAreaReferencePoints(area).length > 0) return 5000;
      return this.mapWaterType(area.water_type, area.name) === 'river' ? 2500 : 1000;
    }

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

  private getNearestAreaDistanceMeters(lat: number, lng: number, area: HejfishArea): number {
    const points = this.getAreaReferencePoints(area);
    if (points.length === 0) return Number.POSITIVE_INFINITY;

    return Math.min(...points.map((point) => this.distanceMeters(lat, lng, point.lat, point.lng)));
  }

  private getAreaReferencePoints(area: HejfishArea): Coordinate[] {
    const directPoint = typeof area.lat === 'number' && typeof area.lng === 'number'
      ? [{ lat: area.lat, lng: area.lng }]
      : [];
    const mapPoints = this.extractCoordinates(area.map_data?.points);
    const locationPoints = this.extractCoordinates(area.map_data?.data?.locations);

    return [...directPoint, ...mapPoints, ...locationPoints];
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
      type: this.mapWaterType(area.water_type, area.name),
      latitude: area.lat ?? 0,
      longitude: area.lng ?? 0,
      region: 'hejfish',
      imageUrl: area.main_image || undefined,
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
    const uniqueFish = Array.from(new Map(this.normalizeFishList(area.fish || []).map((name) => {
      const species = this.mapFishSpecies(name);
      return [species, { species, displayName: name }];
    })).values());

    return {
      id: `hejfish-${area.id}`,
      name: area.name,
      type: this.mapWaterType(area.water_type, area.name),
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

  private mapWaterType(type?: string | null, name?: string): WaterBodyType {
    const normalized = this.normalize(`${type || ''} ${name || ''}`);
    if (normalized.includes('fliess') || normalized.includes('fluss') || normalized.includes('river')) return 'river';
    if (normalized.includes('elbe') || normalized.includes('rhein') || normalized.includes('weser')) return 'river';
    if (normalized.includes('kanal') || normalized.includes('canal')) return 'canal';
    if (normalized.includes('teich') || normalized.includes('pond')) return 'pond';
    if (normalized.includes('meer') || normalized.includes('sea')) return 'sea';
    return 'lake';
  }

  private isRegionalNameCandidate(area: HejfishAreaLite, lat: number, lng: number): boolean {
    if (!this.isHamburgRegion(lat, lng)) return false;

    const normalized = this.normalize(`${area.name} ${area.slug}`);
    return hamburgAreaKeywords.some((keyword) => normalized.includes(keyword));
  }

  private isHamburgRegion(lat: number, lng: number): boolean {
    return lat >= 53.35 && lat <= 53.7 && lng >= 9.65 && lng <= 10.35;
  }

  private normalizeFishList(fish: string[]): string[] {
    return fish
      .flatMap((entry) => this.splitFishEntry(this.fixMojibake(entry)))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  private splitFishEntry(entry: string): string[] {
    return entry
      .split(/[,;/\n]+/)
      .flatMap((part) => part.replace(/([a-z])([A-Z])/g, '$1,$2').split(','))
      .map((part) => part.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  private fixMojibake(value: string): string {
    return value
      .replace(/Ã„/g, 'Ae')
      .replace(/Ã–/g, 'Oe')
      .replace(/Ãœ/g, 'Ue')
      .replace(/Ã¤/g, 'ae')
      .replace(/Ã¶/g, 'oe')
      .replace(/Ã¼/g, 'ue')
      .replace(/ÃŸ/g, 'ss');
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
