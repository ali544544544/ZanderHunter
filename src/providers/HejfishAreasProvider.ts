import type { HejfishArea, HejfishAreaLite, HejfishGeoIndexEntry } from '../types/hejfishArea';
import type { DataSource, FishSpecies, WaterBodyProfile, WaterBodyType, WaterDataProvider, WaterMapGeometry } from '../types/waterData';

type Coordinate = { lat: number; lng: number };
type AreaId = number | string;
type AreaCandidate = { id: string; platform: string; area?: HejfishAreaLite; distance: number };
type ProfileManager = NonNullable<WaterBodyProfile['areaDetails']>['manager'];

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
  name = 'Angelkarten-Daten';
  priority = 0;

  private liteAreasPromise: Promise<HejfishAreaLite[]> | null = null;
  private geoIndexPromise: Promise<HejfishGeoIndexEntry[]> | null = null;
  private detailPromises = new Map<string, Promise<HejfishArea | null>>();
  private resolvedDataBaseUrl: string | null = null;

  canHandleRegion(): boolean {
    return true;
  }

  async getWaterBodyProfile(lat: number, lng: number): Promise<WaterBodyProfile | null> {
    const [liteAreas, geoIndex] = await Promise.all([
      this.loadLiteAreas(),
      this.loadGeoIndex(),
    ]);
    const candidates = this.findAreaCandidates(liteAreas, geoIndex, lat, lng);
    if (candidates.length === 0) return null;

    const details = (await Promise.all(candidates.slice(0, 32).map((candidate) => this.loadAreaDetail(candidate))))
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

    if (nearestDetail) return this.mapAreaToProfile(nearestDetail, lat, lng);

    const nearestLite = candidates.find((candidate) => (
      candidate.area
      && Number.isFinite(candidate.distance)
      && candidate.distance < Number.MAX_SAFE_INTEGER
    ))?.area;

    return nearestLite ? this.mapLiteAreaToProfile(nearestLite) : null;
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

  private async loadGeoIndex(): Promise<HejfishGeoIndexEntry[]> {
    if (!this.geoIndexPromise) {
      this.geoIndexPromise = this.fetchGeoIndex();
    }
    return this.geoIndexPromise;
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
            && (typeof area.id === 'number' || typeof area.id === 'string')
            && (typeof area.lat === 'number' || area.lat === null)
            && (typeof area.lng === 'number' || area.lng === null)
        ));
      } catch {
        continue;
      }
    }

    return [];
  }

  private async fetchGeoIndex(): Promise<HejfishGeoIndexEntry[]> {
    const baseUrls = this.resolvedDataBaseUrl ? [this.resolvedDataBaseUrl] : this.getDataBaseUrls();

    for (const baseUrl of baseUrls) {
      try {
        const response = await fetch(`${baseUrl}areas_geo_index.json`, {
          cache: 'force-cache',
        });

        if (!response.ok) continue;

        const data = await response.json();
        if (!Array.isArray(data)) continue;

        return data.filter((entry): entry is HejfishGeoIndexEntry => (
          Boolean(entry)
          && (typeof entry.id === 'number' || typeof entry.id === 'string')
          && typeof entry.lat === 'number'
          && typeof entry.lng === 'number'
        ));
      } catch {
        continue;
      }
    }

    return [];
  }

  private async loadAreaDetail(candidate: AreaCandidate): Promise<HejfishArea | null> {
    const cacheKey = `${candidate.platform}/${candidate.id}`;
    if (!this.detailPromises.has(cacheKey)) {
      this.detailPromises.set(cacheKey, this.fetchAreaDetail(candidate));
    }
    return this.detailPromises.get(cacheKey)!;
  }

  private async fetchAreaDetail(candidate: AreaCandidate): Promise<HejfishArea | null> {
    const baseUrls = this.resolvedDataBaseUrl ? [this.resolvedDataBaseUrl] : this.getDataBaseUrls();

    for (const baseUrl of baseUrls) {
      try {
        const response = await fetch(`${baseUrl}details/${candidate.platform}/${candidate.id}.json`, {
          cache: 'force-cache',
        });

        if (!response.ok) continue;

        const data = await response.json();
        if (data && (typeof data.id === 'number' || typeof data.id === 'string' || typeof data.global_id === 'string') && !data.error) {
          return data as HejfishArea;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private getGlobalAreaId(id: AreaId, platform: string = 'hejfish'): string {
    if (typeof id === 'string') return id;
    return platform === 'hejfish' || platform === 'merged' ? `hejfish-${id}` : `${platform}-${id}`;
  }

  private getHejfishNumericId(id: AreaId): string | null {
    if (typeof id === 'number') return String(id);
    return id.match(/^hejfish-(\d+)$/)?.[1] || null;
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

  private findAreaCandidates(
    areas: HejfishAreaLite[],
    geoIndex: HejfishGeoIndexEntry[],
    lat: number,
    lng: number
  ): AreaCandidate[] {
    const candidates = [
      ...this.findGeoIndexCandidates(geoIndex, lat, lng),
      ...this.findLiteCandidates(areas, lat, lng),
    ];
    const unique = new Map<string, AreaCandidate>();

    for (const candidate of candidates) {
      const existing = unique.get(candidate.id);
      if (!existing) {
        unique.set(candidate.id, candidate);
        continue;
      }

      if (candidate.distance < existing.distance) {
        unique.set(candidate.id, {
          ...candidate,
          area: candidate.area || existing.area,
        });
        continue;
      }

      if (!existing.area && candidate.area) {
        unique.set(candidate.id, {
          ...existing,
          area: candidate.area,
        });
      }
    }

    return Array.from(unique.values()).sort((a, b) => a.distance - b.distance);
  }

  private findGeoIndexCandidates(index: HejfishGeoIndexEntry[], lat: number, lng: number): AreaCandidate[] {
    return index
      .map((entry) => ({
        id: this.getGlobalAreaId(entry.id),
        platform: 'hejfish',
        distance: this.getNearestIndexDistanceMeters(lat, lng, entry),
        radius: this.getGeoIndexRadiusMeters(entry),
      }))
      .filter((match) => match.distance <= match.radius)
      .sort((a, b) => a.distance - b.distance)
      .map(({ id, platform, distance }) => ({ id, platform, distance }));
  }

  private findLiteCandidates(areas: HejfishAreaLite[], lat: number, lng: number): AreaCandidate[] {
    const coordinateCandidates = areas
      .filter((area) => typeof area.lat === 'number' && typeof area.lng === 'number')
      .map((area) => ({
        id: this.getGlobalAreaId(area.id, area.platform),
        platform: this.getAreaPlatform(area),
        area,
        distance: this.distanceMeters(lat, lng, area.lat as number, area.lng as number),
      }))
      .filter((match) => match.distance <= this.getLiteRadiusMeters(match.area))
      .sort((a, b) => a.distance - b.distance);

    const regionalCandidates = areas
      .filter((area) => (typeof area.lat !== 'number' || typeof area.lng !== 'number') && this.isRegionalNameCandidate(area, lat, lng))
      .map((area) => ({ id: this.getGlobalAreaId(area.id, area.platform), platform: this.getAreaPlatform(area), area, distance: Number.MAX_SAFE_INTEGER }));

    return [...regionalCandidates, ...coordinateCandidates];
  }

  private getNearestIndexDistanceMeters(lat: number, lng: number, entry: HejfishGeoIndexEntry): number {
    const points = entry.points?.length ? entry.points : [{ lat: entry.lat, lng: entry.lng }];
    const pointDistance = this.getNearestPointOrSegmentDistanceMeters({ lat, lng }, points);
    const boundsDistance = entry.bounds
      ? this.distanceToBoundsMeters({ lat, lng }, entry.bounds)
      : Number.POSITIVE_INFINITY;

    return Math.min(pointDistance, boundsDistance);
  }

  private getGeoIndexRadiusMeters(entry: HejfishGeoIndexEntry): number {
    const type = this.mapWaterType(entry.water_type, entry.name);
    if (type === 'river' || type === 'canal') return 8000;
    return 5000;
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
    return this.getAreaPolygons(area).some((polygon) => this.isPointInPolygon({ lat, lng }, polygon));
  }

  private getNearestAreaDistanceMeters(lat: number, lng: number, area: HejfishArea): number {
    const points = this.getAreaReferencePoints(area);
    if (points.length === 0) return Number.POSITIVE_INFINITY;

    return this.getNearestPointOrSegmentDistanceMeters({ lat, lng }, points);
  }

  private getAreaReferencePoints(area: HejfishArea): Coordinate[] {
    const directPoint = typeof area.lat === 'number' && typeof area.lng === 'number'
      ? [{ lat: area.lat, lng: area.lng }]
      : [];
    const mapPoints = this.extractCoordinates(area.map_data?.points);
    const directLocations = this.extractCoordinates(area.map_data?.locations);
    const locationPoints = this.extractCoordinates(area.map_data?.data?.locations);

    return [...directPoint, ...mapPoints, ...directLocations, ...locationPoints];
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
    const name = this.cleanText(area.name) || area.name;
    const source = this.getLiteAreaSource(area);
    const links = this.getLiteAreaLinks(area);

    return {
      id: this.getGlobalAreaId(area.id, area.platform),
      name,
      type: this.mapWaterType(area.water_type, area.name),
      latitude: area.lat ?? 0,
      longitude: area.lng ?? 0,
      region: 'Angelkarten-Daten',
      imageUrl: this.cleanText(area.main_image),
      species: [],
      regulations: {
        permit_required: true,
      },
      dataQuality: 'medium',
      sources: [source],
      links,
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
    const mapGeometry = this.getAreaMapGeometry(area);
    const locationInfo = this.getLocationInfo(area);
    const techniques = this.cleanList(area.techniques || []);
    const techniqueKeys = new Set(techniques.map((entry) => this.normalize(entry)));
    const properties = this.cleanList(area.properties || [])
      .filter((entry) => !entry.toLowerCase().startsWith('techniken'))
      .filter((entry) => !techniqueKeys.has(this.normalize(entry)));
    const featureLabels = this.getFeatureLabels(area.features);
    const tickets = area.tickets
      ?.map((ticket) => ({
        name: this.cleanText(ticket.name) || ticket.name,
        price: this.cleanText(ticket.price),
      }))
      .filter((ticket) => ticket.name);
    const manager = area.manager
      ? {
          name: this.cleanText(area.manager.name),
          phone: this.cleanText(area.manager.phone || area.manager.telephone),
          email: this.cleanText(area.manager.email),
          website: this.cleanText(area.manager.website),
        }
      : undefined;
    const name = this.cleanText(area.name) || area.name;
    const imageUrl = this.cleanText(area.main_image || area.image);
    const source = this.getAreaSource(area);
    const rulesFiles = this.getRulesFiles(area);
    const links = this.getAreaLinks(area, manager, rulesFiles);
    const season = this.getSeasonText(area);

    return {
      id: this.getAreaProfileId(area),
      name,
      type: this.mapWaterType(area.water_type, area.name),
      latitude: area.lat ?? lat,
      longitude: area.lng ?? lng,
      region: locationInfo.join(', ') || area.country || 'Unbekannt',
      description: this.cleanText(area.description || area.intro || area.details),
      imageUrl,
      species: uniqueFish.map((entry) => ({
        species: entry.species,
        displayName: entry.displayName,
        confidence: 0.9,
        source,
        lastUpdated,
      })),
      regulations: {
        permit_required: true,
      },
      dataQuality: uniqueFish.length > 0 ? 'high' : 'medium',
      sources: [source],
      links,
      areaDetails: {
        waterSizeHa: area.water_size_ha ?? undefined,
        mapGeometry,
        locationInfo,
        season,
        techniques,
        properties: [...properties, ...featureLabels],
        rulesText: this.cleanText(area.rules_text),
        rulesFiles,
        mobileTicket: area.mobile_ticket ?? area.features?.digital_ticket === true,
        printRequired: area.print_required,
        tickets,
        ticketTypes: area.ticket_types,
        features: featureLabels,
        manager,
      },
      lastUpdated,
    };
  }

  private getAreaMapGeometry(area: HejfishArea): WaterMapGeometry | undefined {
    const polygons = this.getAreaPolygons(area);
    const lines = this.getAreaLines(area);
    const points = this.getAreaReferencePoints(area);

    if (polygons.length === 0 && lines.length === 0 && points.length === 0) return undefined;

    return { polygons, lines, points };
  }

  private getAreaPolygons(area: HejfishArea): Coordinate[][] {
    const polygonSources = [
      ...(Array.isArray(area.map_data?.polygons) ? area.map_data.polygons : []),
      area.map_data?.geojson,
      area.map_data?.data?.geojson,
    ];

    return polygonSources
      .flatMap((source) => this.extractPolygons(source))
      .filter((polygon) => polygon.length >= 3);
  }

  private getAreaLines(area: HejfishArea): Coordinate[][] {
    const lineSources = [
      area.map_data?.geojson,
      area.map_data?.data?.geojson,
    ];

    return lineSources
      .flatMap((source) => this.extractLines(source))
      .filter((line) => line.length >= 2);
  }

  private extractPolygons(value: unknown): Coordinate[][] {
    if (!value) return [];

    if (Array.isArray(value)) {
      const coordinates = this.extractCoordinates(value);
      if (coordinates.length >= 3) return [coordinates];
      return value.flatMap((entry) => this.extractPolygons(entry));
    }

    if (typeof value !== 'object') return [];

    const objectValue = value as Record<string, unknown>;
    const type = typeof objectValue.type === 'string' ? objectValue.type : '';
    const coordinates = objectValue.coordinates;

    if (type === 'Polygon') {
      return Array.isArray(coordinates)
        ? coordinates.map((ring) => this.extractGeoJsonRing(ring)).filter((ring) => ring.length >= 3)
        : [];
    }

    if (type === 'MultiPolygon') {
      return Array.isArray(coordinates)
        ? coordinates.flatMap((polygon) => this.extractPolygons({ type: 'Polygon', coordinates: polygon }))
        : [];
    }

    if (type === 'Feature') {
      return this.extractPolygons(objectValue.geometry);
    }

    if (type === 'FeatureCollection' && Array.isArray(objectValue.features)) {
      return objectValue.features.flatMap((feature) => this.extractPolygons(feature));
    }

    return this.extractPolygons(objectValue.polygons || objectValue.points || objectValue.path || objectValue.geojson);
  }

  private extractLines(value: unknown): Coordinate[][] {
    if (!value) return [];

    if (Array.isArray(value)) {
      const coordinates = this.extractGeoJsonRing(value);
      if (coordinates.length >= 2) return [coordinates];
      return value.flatMap((entry) => this.extractLines(entry));
    }

    if (typeof value !== 'object') return [];

    const objectValue = value as Record<string, unknown>;
    const type = typeof objectValue.type === 'string' ? objectValue.type : '';
    const coordinates = objectValue.coordinates;

    if (type === 'LineString') {
      const line = this.extractGeoJsonRing(coordinates);
      return line.length >= 2 ? [line] : [];
    }

    if (type === 'MultiLineString') {
      return Array.isArray(coordinates)
        ? coordinates.map((line) => this.extractGeoJsonRing(line)).filter((line) => line.length >= 2)
        : [];
    }

    if (type === 'Feature') {
      return this.extractLines(objectValue.geometry);
    }

    if (type === 'FeatureCollection' && Array.isArray(objectValue.features)) {
      return objectValue.features.flatMap((feature) => this.extractLines(feature));
    }

    return this.extractLines(objectValue.lines || objectValue.path || objectValue.geojson);
  }

  private extractGeoJsonRing(value: unknown): Coordinate[] {
    if (!Array.isArray(value)) return [];

    const first = value[0];
    if (Array.isArray(first) && typeof first[0] === 'number' && typeof first[1] === 'number') {
      return (value as number[][])
        .map((point) => ({ lng: point[0], lat: point[1] }))
        .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
    }

    return value.flatMap((entry) => this.extractGeoJsonRing(entry));
  }

  private mapFishSpecies(name: string): FishSpecies {
    const normalized = this.normalize(name);
    return knownSpeciesMap[normalized] || normalized || name;
  }

  private mapWaterType(type?: string | null, name?: string): WaterBodyType {
    const normalized = this.normalize(`${type || ''} ${name || ''}`);
    if (normalized.includes('fliess') || normalized.includes('fluss') || normalized.includes('river') || normalized.includes('bach')) return 'river';
    if (normalized.includes('elbe') || normalized.includes('rhein') || normalized.includes('weser')) return 'river';
    if (normalized.includes('kanal') || normalized.includes('canal') || normalized.includes('graben')) return 'canal';
    if (normalized.includes('teich') || normalized.includes('pond') || normalized.includes('weiher')) return 'pond';
    if (normalized.includes('meer') || normalized.includes('sea') || normalized.includes('fjord') || normalized.includes('kueste')) return 'sea';
    return 'lake';
  }

  private isRegionalNameCandidate(area: HejfishAreaLite, lat: number, lng: number): boolean {
    if (!this.isHamburgRegion(lat, lng)) return false;

    const normalized = this.normalize(`${area.name} ${area.slug || ''}`);
    return hamburgAreaKeywords.some((keyword) => normalized.includes(keyword));
  }

  private getAreaProfileId(area: HejfishArea): string {
    if (area.global_id) return area.global_id;
    return this.getGlobalAreaId(area.id, area.source_platform || 'hejfish');
  }

  private getAreaSource(area: HejfishArea): DataSource {
    return area.source_platform === 'alleangeln' ? 'alleangeln' : 'hejfish';
  }

  private getLiteAreaSource(area: HejfishAreaLite): DataSource {
    return area.platform === 'alleangeln' ? 'alleangeln' : 'hejfish';
  }

  private getAreaPlatform(area: HejfishAreaLite): string {
    return area.platform || 'hejfish';
  }

  private getLiteAreaLinks(area: HejfishAreaLite): WaterBodyProfile['links'] {
    const hejfishNumericId = this.getHejfishNumericId(area.id);
    if (!hejfishNumericId) return undefined;

    const slug = area.slug ? `-${area.slug}` : '';
    return [{ label: 'Bei hejfish oeffnen', url: `https://www.hejfish.com/d/${hejfishNumericId}${slug}`, kind: 'permit' }];
  }

  private getAreaLinks(
    area: HejfishArea,
    manager: ProfileManager,
    rulesFiles: Array<{ name: string; url: string }>
  ): WaterBodyProfile['links'] {
    const links: NonNullable<WaterBodyProfile['links']> = [];

    const sourceLabel = area.source_platform === 'alleangeln' ? 'Bei Alle Angeln oeffnen' : 'Bei hejfish oeffnen';
    const sourceUrl = this.cleanText(area.url);
    if (sourceUrl) links.push({ label: sourceLabel, url: sourceUrl, kind: 'permit' });
    if (manager?.website) links.push({ label: 'Betreiber', url: manager.website, kind: 'info' });
    for (const file of rulesFiles) {
      links.push({ label: file.name || 'Regeln', url: file.url, kind: 'info' });
    }

    return links.length > 0 ? links : undefined;
  }

  private getLocationInfo(area: HejfishArea): string[] {
    const structured = [
      area.location?.city?.name,
      area.location?.district?.name,
      area.location?.state?.name,
      area.location?.country?.name,
    ].filter((entry): entry is string => Boolean(entry));

    return this.cleanList(structured.length > 0 ? structured : area.location_info || []);
  }

  private getSeasonText(area: HejfishArea): string | undefined {
    if (area.season) return this.cleanText(area.season);
    if (area.season_begin || area.season_end) {
      return this.cleanText([area.season_begin, area.season_end].filter(Boolean).join(' bis '));
    }
    return undefined;
  }

  private getRulesFiles(area: HejfishArea): Array<{ name: string; url: string }> {
    return (area.rules_files || [])
      .map((file) => ({
        name: this.cleanText(file.name || file.description || 'Regeln') || 'Regeln',
        url: this.cleanText(file.file || file.url),
      }))
      .filter((file): file is { name: string; url: string } => Boolean(file.url));
  }

  private getFeatureLabels(features?: HejfishArea['features']): string[] {
    if (!features) return [];

    const labels: Record<string, string> = {
      accessible: 'Barrierearm',
      public_transport: 'OePNV',
      boat: 'Boot',
      belly_boat: 'Belly-Boot',
      digital_ticket: 'Online-Ticket',
      night_fishing: 'Nachtangeln',
      ice_fishing: 'Eisangeln',
      depth_map: 'Tiefenkarte',
      has_gauges: 'Pegel',
    };

    return Object.entries(features)
      .filter(([, value]) => value === true)
      .map(([key]) => labels[key] || key)
      .filter(Boolean);
  }

  private isHamburgRegion(lat: number, lng: number): boolean {
    return lat >= 53.35 && lat <= 53.7 && lng >= 9.65 && lng <= 10.35;
  }

  private normalizeFishList(fish: string[]): string[] {
    return this.cleanList(fish);
  }

  private cleanList(values: string[]): string[] {
    const unique = new Map<string, string>();

    values
      .flatMap((entry) => this.splitListEntry(this.fixMojibake(entry)))
      .map((entry) => this.cleanText(entry))
      .filter((entry): entry is string => Boolean(entry))
      .forEach((entry) => {
        const key = this.normalize(entry);
        if (key && !unique.has(key)) unique.set(key, entry);
      });

    return Array.from(unique.values());
  }

  private splitListEntry(entry: string): string[] {
    return entry
      .replace(/\r/g, '\n')
      .replace(/Techniken:/gi, '\n')
      .replace(/([a-z])([A-Z])/g, '$1\n$2')
      .split(/[,;/\n]+/)
      .map((part) => part.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  private cleanText(value?: string | null): string | undefined {
    if (!value) return undefined;

    const cleaned = this.fixMojibake(value)
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned || undefined;
  }

  private fixMojibake(value: string): string {
    return value
      .replace(/\u00c3\u0084/g, 'Ae')
      .replace(/\u00c3\u0096/g, 'Oe')
      .replace(/\u00c3\u009c/g, 'Ue')
      .replace(/\u00c3\u00a4/g, 'ae')
      .replace(/\u00c3\u00b6/g, 'oe')
      .replace(/\u00c3\u00bc/g, 'ue')
      .replace(/\u00c3\u009f/g, 'ss')
      .replace(/\u00e2\u20ac\u201c|\u00e2\u20ac\u201d/g, '-')
      .replace(/\u00e2\u20ac\u017e|\u00e2\u20ac\u0153|\u00e2\u20ac\u009d/g, '"')
      .replace(/\u00e2\u20ac\u02dc|\u00e2\u20ac\u2122/g, "'")
      .replace(/\u00c2/g, '')
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

  private getNearestPointOrSegmentDistanceMeters(point: Coordinate, line: Coordinate[]): number {
    const pointDistances = line.map((linePoint) => this.distanceMeters(point.lat, point.lng, linePoint.lat, linePoint.lng));
    const segmentDistances = line.length >= 2
      ? line.slice(0, -1).map((start, index) => this.distanceToSegmentMeters(point, start, line[index + 1]))
      : [];

    return Math.min(...pointDistances, ...segmentDistances);
  }

  private distanceToBoundsMeters(
    point: Coordinate,
    bounds: NonNullable<HejfishGeoIndexEntry['bounds']>
  ): number {
    const clampedLat = Math.max(bounds.minLat, Math.min(bounds.maxLat, point.lat));
    const clampedLng = Math.max(bounds.minLng, Math.min(bounds.maxLng, point.lng));

    return this.distanceMeters(point.lat, point.lng, clampedLat, clampedLng);
  }

  private distanceToSegmentMeters(point: Coordinate, start: Coordinate, end: Coordinate): number {
    const originLat = point.lat * Math.PI / 180;
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = Math.cos(originLat) * 111320;
    const ax = (start.lng - point.lng) * metersPerDegreeLng;
    const ay = (start.lat - point.lat) * metersPerDegreeLat;
    const bx = (end.lng - point.lng) * metersPerDegreeLng;
    const by = (end.lat - point.lat) * metersPerDegreeLat;
    const dx = bx - ax;
    const dy = by - ay;
    const segmentLengthSquared = dx * dx + dy * dy;

    if (segmentLengthSquared === 0) {
      return Math.sqrt(ax * ax + ay * ay);
    }

    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / segmentLengthSquared));
    const closestX = ax + t * dx;
    const closestY = ay + t * dy;

    return Math.sqrt(closestX * closestX + closestY * closestY);
  }
}
