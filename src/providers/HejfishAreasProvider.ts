import type { HejfishArea, HejfishAreaLite, HejfishGeoIndexEntry } from '../types/hejfishArea';
import type { DataQuality, DataSource, FishSpecies, WaterBodyProfile, WaterBodyType, WaterDataProvider, WaterMapGeometry } from '../types/waterData';

type Coordinate = { lat: number; lng: number };
type AreaId = number | string;
type AreaCandidate = { id: string; platform: string; area?: HejfishAreaLite; distance: number; regional?: boolean; coordinate?: boolean; detailPath?: string };
type AreaDetailMatch = { area: HejfishArea; distance: number; candidateDistance: number; insidePolygon: boolean; regional: boolean };
type ProfileManager = NonNullable<WaterBodyProfile['areaDetails']>['manager'];
type RelatedAreaLink = { source: DataSource; label: string; url: string };

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
  'goseelbe',
  'stromelbe',
  'altesuederelbe',
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

    const nearestCoordinateCandidate = this.getNearestCoordinateCandidate(candidates);
    if (
      nearestCoordinateCandidate
      && nearestCoordinateCandidate.distance <= this.getNearestPreferredRadiusMeters(nearestCoordinateCandidate.area)
      && !this.shouldInspectDetailCandidates(candidates, nearestCoordinateCandidate)
    ) {
      const detail = await this.loadAreaDetail(nearestCoordinateCandidate);
      return detail
        ? this.mapAreaToProfile(detail, lat, lng, liteAreas)
        : this.mapLiteAreaToProfile(nearestCoordinateCandidate.area);
    }

    const detailCandidates = this.getDetailCandidates(candidates);
    const details = (await Promise.all(detailCandidates.map((candidate) => this.loadAreaDetail(candidate))))
      .filter((area): area is HejfishArea => Boolean(area));

    const bestDetail = this.findBestDetailMatch(details, detailCandidates, lat, lng);
    if (bestDetail) return this.mapAreaToProfile(bestDetail, lat, lng, liteAreas);

    const nearestLite = candidates.find((candidate) => (
      !candidate.regional
      && candidate.area
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

    const matches = liteAreas
      .filter((area) => {
        const haystack = this.normalize([
          area.name,
          area.slug,
          area.water_type,
        ].filter(Boolean).join(' '));

        return haystack.includes(normalizedQuery)
          && (!normalizedRegion || haystack.includes(normalizedRegion));
      })
      .slice(0, 20);

    return Promise.all(matches.map(async (area) => {
      const candidate = {
        id: this.getGlobalAreaId(area.id, area.platform),
        platform: this.getAreaPlatform(area),
        area,
        distance: 0,
        detailPath: area.detail_path,
      };
      const detail = await this.loadAreaDetail(candidate);
      const center = detail ? this.getAreaCenter(detail, { lat: area.lat ?? 0, lng: area.lng ?? 0 }) : null;
      return detail
        ? this.mapAreaToProfile(detail, center?.lat ?? area.lat ?? 0, center?.lng ?? area.lng ?? 0, liteAreas)
        : this.mapLiteAreaToProfile(area);
    }));
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
    const cacheKey = candidate.detailPath || candidate.area?.detail_path || `${candidate.platform}/${candidate.id}`;
    if (!this.detailPromises.has(cacheKey)) {
      this.detailPromises.set(cacheKey, this.fetchAreaDetail(candidate));
    }
    return this.detailPromises.get(cacheKey)!;
  }

  private async fetchAreaDetail(candidate: AreaCandidate): Promise<HejfishArea | null> {
    const baseUrls = this.resolvedDataBaseUrl ? [this.resolvedDataBaseUrl] : this.getDataBaseUrls();

    for (const baseUrl of baseUrls) {
      try {
        const response = await fetch(`${baseUrl}${this.getCandidateDetailPath(candidate)}`, {
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

  private getCandidateDetailPath(candidate: AreaCandidate): string {
    const detailPath = candidate.detailPath || candidate.area?.detail_path;
    if (detailPath) return detailPath.replace(/^\/+/, '');

    return `details/${candidate.platform}/${candidate.id}.json`;
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
      : [`${import.meta.env.BASE_URL}data/`];

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
    const areaById = new Map(areas.map((area) => [this.getGlobalAreaId(area.id, area.platform), area]));

    for (const candidate of candidates) {
      const existing = unique.get(candidate.id);
      if (!existing) {
        unique.set(candidate.id, candidate);
        continue;
      }

      if (candidate.distance < existing.distance) {
        const area = candidate.area || existing.area;
        unique.set(candidate.id, {
          ...candidate,
          area,
          platform: area ? this.getAreaPlatform(area) : candidate.platform,
          regional: candidate.area ? candidate.regional : existing.regional,
          coordinate: candidate.coordinate || existing.coordinate,
        });
        continue;
      }

      if (!existing.area && candidate.area) {
        unique.set(candidate.id, {
          ...existing,
          area: candidate.area,
          platform: this.getAreaPlatform(candidate.area),
          regional: candidate.regional,
          coordinate: candidate.coordinate || existing.coordinate,
        });
      }
    }

    for (const [id, candidate] of unique) {
      if (candidate.area) continue;

      const area = areaById.get(id);
      if (!area) continue;

      unique.set(id, {
        ...candidate,
        area,
        platform: this.getAreaPlatform(area),
        regional: candidate.regional || this.isRegionalNameCandidate(area, lat, lng),
        coordinate: candidate.coordinate,
      });
    }

    return Array.from(unique.values()).sort((a, b) => a.distance - b.distance);
  }

  private getDetailCandidates(candidates: AreaCandidate[]): AreaCandidate[] {
    const detailCandidates = new Map<string, AreaCandidate>();

    for (const candidate of candidates.slice(0, 32)) {
      detailCandidates.set(`${candidate.platform}/${candidate.id}`, candidate);
    }

    for (const candidate of candidates) {
      if (candidate.regional) {
        detailCandidates.set(`${candidate.platform}/${candidate.id}`, candidate);
      }
    }

    return Array.from(detailCandidates.values());
  }

  private getNearestCoordinateCandidate(candidates: AreaCandidate[]): (AreaCandidate & { area: HejfishAreaLite }) | null {
    return candidates.find((candidate): candidate is AreaCandidate & { area: HejfishAreaLite } => (
      !candidate.regional
      && Boolean(candidate.area)
      && candidate.coordinate === true
      && Number.isFinite(candidate.distance)
      && candidate.distance < Number.MAX_SAFE_INTEGER
    )) || null;
  }

  private shouldInspectDetailCandidates(
    candidates: AreaCandidate[],
    nearestCoordinateCandidate: AreaCandidate & { area: HejfishAreaLite }
  ): boolean {
    const nearestType = this.mapWaterType(
      nearestCoordinateCandidate.area.water_type,
      nearestCoordinateCandidate.area.name
    );
    const nearbyRegionalCandidates = candidates.filter((candidate): candidate is AreaCandidate & { area: HejfishAreaLite } => {
      if (!candidate.regional || !candidate.area) return false;
      return this.isLikelySpecificHamburgWater(candidate.area);
    });

    if (nearbyRegionalCandidates.length === 0) return false;
    if (nearestCoordinateCandidate.distance > 1000) return true;

    return (nearestType === 'lake' || nearestType === 'pond')
      && this.isSmallStillwaterNearRegionalRoute(nearestCoordinateCandidate.area, nearbyRegionalCandidates);
  }

  private isSmallStillwaterNearRegionalRoute(
    area: HejfishAreaLite,
    regionalCandidates: Array<AreaCandidate & { area: HejfishAreaLite }>
  ): boolean {
    const normalizedName = this.normalize(`${area.name} ${area.slug || ''}`);
    if (normalizedName.includes('alster')) return false;

    const regionalHaystack = regionalCandidates
      .map((candidate) => this.normalize(`${candidate.area.name} ${candidate.area.slug || ''}`))
      .join(' ');

    if (regionalHaystack.includes('doveelbe') || regionalHaystack.includes('goseelbe')) {
      return true;
    }

    return false;
  }

  private getNearestPreferredRadiusMeters(area: HejfishAreaLite): number {
    const type = this.mapWaterType(area.water_type, area.name);
    if (type === 'river' || type === 'canal') return 900;
    return 1500;
  }

  private findBestDetailMatch(
    details: HejfishArea[],
    candidates: AreaCandidate[],
    lat: number,
    lng: number
  ): HejfishArea | null {
    const candidateDistanceById = new Map<string, number>();
    const candidateRegionalById = new Map<string, boolean>();
    for (const candidate of candidates) {
      candidateDistanceById.set(candidate.id, candidate.distance);
      candidateRegionalById.set(candidate.id, Boolean(candidate.regional));
    }

    const matches = details
      .map((area): AreaDetailMatch => {
        const id = this.getAreaProfileId(area);
        return {
          area,
          distance: this.getNearestAreaDistanceMeters(lat, lng, area),
          candidateDistance: candidateDistanceById.get(id) ?? Number.POSITIVE_INFINITY,
          insidePolygon: this.isInsideAreaPolygon(lat, lng, area),
          regional: candidateRegionalById.get(id) ?? false,
        };
      })
      .filter((match) => (
        match.insidePolygon
        || match.distance <= this.getRadiusMeters(match.area)
        || match.candidateDistance <= this.getRadiusMeters(match.area)
      ));

    const closeDirectMatchScore = Math.min(
      ...matches
        .filter((match) => !match.regional)
        .map((match) => this.getAreaMatchScore(match))
        .filter((score) => Number.isFinite(score) && score <= 1500)
    );
    const filteredMatches = Number.isFinite(closeDirectMatchScore)
      ? matches.filter((match) => !match.regional || this.getAreaMatchScore(match) <= closeDirectMatchScore * 1.4)
      : matches;

    return filteredMatches
      .sort((a, b) => this.getAreaMatchScore(a) - this.getAreaMatchScore(b))[0]?.area || null;
  }

  private getAreaMatchScore(match: AreaDetailMatch): number {
    const nearestKnownDistance = Number.isFinite(match.distance) ? match.distance : match.candidateDistance;
    const baseScore = Number.isFinite(nearestKnownDistance) ? nearestKnownDistance : Number.MAX_SAFE_INTEGER;

    if (this.isLikelySpecificHamburgWater(match.area) && baseScore <= 1200) {
      return baseScore * 0.25;
    }

    if (!match.insidePolygon) return baseScore;

    const type = this.mapWaterType(match.area.water_type, match.area.name);
    const polygonBonus = type === 'river' || type === 'canal' ? 0.95 : 0.75;
    return baseScore * polygonBonus;
  }

  private findGeoIndexCandidates(index: HejfishGeoIndexEntry[], lat: number, lng: number): AreaCandidate[] {
    return index
      .map((entry) => ({
        id: this.getGlobalAreaId(entry.id, entry.platform),
        platform: entry.platform || 'hejfish',
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
        coordinate: true,
        detailPath: area.detail_path,
      }))
      .filter((match) => match.distance <= this.getLiteRadiusMeters(match.area))
      .sort((a, b) => a.distance - b.distance);

    const regionalCandidates = areas
      .filter((area) => this.isRegionalNameCandidate(area, lat, lng))
      .map((area) => ({
        id: this.getGlobalAreaId(area.id, area.platform),
        platform: this.getAreaPlatform(area),
        area,
        distance: Number.MAX_SAFE_INTEGER,
        regional: true,
        coordinate: false,
        detailPath: area.detail_path,
      }));

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
    return [
      this.getAreaCenter(area),
      ...this.getAreaGeometryPoints(area),
      ...this.getAreaLines(area).flat(),
      ...this.getAreaPolygons(area).flat(),
    ].filter((point): point is Coordinate => Boolean(point));
  }

  private getAreaGeometryPoints(area: HejfishArea): Coordinate[] {
    const canonicalPoints = this.extractCoordinates(area.geometry?.points);
    if (canonicalPoints.length > 0) return canonicalPoints;

    const mapPoints = this.extractCoordinates(area.map_data?.points);
    const directLocations = this.extractCoordinates(area.map_data?.locations);
    const locationPoints = this.extractCoordinates(area.map_data?.data?.locations);

    return [...mapPoints, ...directLocations, ...locationPoints];
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
        .map((point) => this.normalizeCoordinate(point))
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

  private mapAreaToProfile(area: HejfishArea, lat: number, lng: number, liteAreas: HejfishAreaLite[] = []): WaterBodyProfile {
    const detailsArea = this.mergeSourceFields(
      area,
      this.getSourceFieldArea(area, 'description')
      || this.getSourceArea(area, area.source_platform || 'hejfish')
      || this.getSourceArea(area, 'hejfish')
      || this.getSourceArea(area, 'alleangeln')
    );
    const geometryArea = this.mergeSourceFields(area, this.getSourceFieldArea(area, 'geometry'));
    const center = this.getAreaCenter(area, { lat, lng }) || { lat, lng };
    const lastUpdated = new Date(area.last_updated || detailsArea.last_updated || Date.now());
    const fishNames = this.getAreaFishNames(detailsArea);
    const uniqueFish = Array.from(new Map(fishNames.map((name) => {
      const species = this.mapFishSpecies(name);
      return [species, { species, displayName: name }];
    })).values());
    const mapGeometry = this.getAreaMapGeometry(geometryArea);
    const locationInfo = this.getLocationInfo(detailsArea);
    const techniques = this.cleanList([...(detailsArea.techniques || []), detailsArea.best_method || '']);
    const techniqueKeys = new Set(techniques.map((entry) => this.normalize(entry)));
    const properties = this.cleanList(detailsArea.properties || [])
      .filter((entry) => !entry.toLowerCase().startsWith('techniken'))
      .filter((entry) => !techniqueKeys.has(this.normalize(entry)));
    const featureLabels = this.getFeatureLabels(detailsArea.features);
    const rawTickets = detailsArea.tickets || (detailsArea as any).ticket_types || [];
    const tickets = (Array.isArray(rawTickets) ? rawTickets : [])
      .map((ticket: any) => ({
        name: this.cleanText(ticket.name) || ticket.name,
        price: this.cleanText(ticket.price),
      }))
      .filter((ticket) => ticket.name);
    const manager = detailsArea.manager
      ? {
          name: this.cleanText(detailsArea.manager.name),
          phone: this.cleanText(detailsArea.manager.phone || detailsArea.manager.telephone),
          email: this.cleanText(detailsArea.manager.email),
          website: this.cleanText(detailsArea.manager.website),
          logoUrl: this.cleanText(detailsArea.manager.logo),
        }
      : undefined;
    const name = this.cleanText(area.name) || area.name;
    const imageUrl = this.cleanText(area.links?.image || detailsArea.main_image || detailsArea.image);
    const source = this.getAreaSource(area);
    const rulesFiles = this.getRulesFiles(detailsArea);
    const rulesText = this.getAreaRulesText(detailsArea);
    const relatedAreaLinks = this.getRelatedAreaLinks(area, liteAreas);
    const links = this.getAreaLinks(area, manager, rulesFiles, relatedAreaLinks);
    const season = this.getSeasonText(detailsArea);
    const sources = this.getProfileSources(area, source, relatedAreaLinks);
    const description = this.cleanText(
      area.description
      || detailsArea.description
      || detailsArea.intro
      || detailsArea.details
    );

    return {
      id: this.getAreaProfileId(area),
      name,
      type: this.mapWaterType(area.water_type || detailsArea.water_type, area.name),
      latitude: center.lat,
      longitude: center.lng,
      region: locationInfo.join(', ') || area.country || 'Unbekannt',
      description,
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
      dataQuality: this.getAreaDataQuality({
        fishCount: uniqueFish.length,
        techniquesCount: techniques.length,
        propertiesCount: properties.length + featureLabels.length,
        ticketsCount: tickets?.length || 0,
        hasDescription: Boolean(description),
        hasRulesText: Boolean(rulesText),
        hasMapGeometry: Boolean(mapGeometry),
        hasManager: Boolean(manager?.name),
      }),
      sources,
      links,
      areaDetails: {
        waterSizeHa: detailsArea.water_size_ha ?? undefined,
        mapGeometry,
        locationInfo,
        season,
        techniques,
        properties: [...properties, ...featureLabels],
        rulesText,
        rulesFiles,
        mobileTicket: detailsArea.mobile_ticket ?? detailsArea.features?.digital_ticket === true,
        printRequired: detailsArea.print_required,
        tickets,
        ticketTypes: detailsArea.ticket_types,
        features: featureLabels,
        stats: {
          followers: (detailsArea as any).followers ?? (detailsArea as any).follower_count,
          catches: (detailsArea as any).catches_count ?? (detailsArea as any).catch_count,
          images: (detailsArea as any).images_count ?? (detailsArea as any).image_count,
        },
        manager,
      },
      lastUpdated,
    };
  }

  private getAreaCenter(area: HejfishArea, fallback?: Coordinate): Coordinate | null {
    const center = this.normalizeCoordinate(area.center);
    if (center) return center;

    if (typeof area.lat === 'number' && typeof area.lng === 'number') {
      return { lat: area.lat, lng: area.lng };
    }

    return fallback || null;
  }

  private normalizeCoordinate(value: unknown): Coordinate | null {
    if (!value || typeof value !== 'object') return null;

    const point = value as Record<string, unknown>;
    const lat = Number(point.lat ?? point.latitude);
    const lng = Number(point.lng ?? point.lon ?? point.longitude);

    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }

  private getSourceArea(area: HejfishArea, source: string): Partial<HejfishArea> | undefined {
    // 1. Check if the source is explicitly listed in metadata.sources
    const fromSources = area.metadata?.sources?.[source];
    if (fromSources) return fromSources;

    // 2. Check if the top-level metadata object itself belongs to the requested platform
    // This is common in scraped JSON files where the metadata object contains all raw fields.
    if (area.metadata && (area.metadata as any).platform === source) {
      return area.metadata as any;
    }

    return undefined;
  }

  private getSourceFieldArea(area: HejfishArea, field: string): Partial<HejfishArea> | undefined {
    const source = area.metadata?.merged_fields?.[field];
    if (typeof source !== 'string') return undefined;

    return this.getSourceArea(area, source);
  }

  private mergeSourceFields(area: HejfishArea, source?: Partial<HejfishArea>): HejfishArea {
    if (!source) return area;

    return {
      ...area,
      ...source,
      id: area.id,
      global_id: area.global_id,
      source_platform: area.source_platform,
      source_ids: area.source_ids,
      external_ids: area.external_ids,
      name: area.name || source.name || '',
      water_type: area.water_type || source.water_type,
      country: area.country || source.country,
      center: area.center,
      geometry: area.geometry,
      links: { ...source.links, ...area.links },
      metadata: area.metadata,
    } as HejfishArea;
  }

  private getProfileSources(
    area: HejfishArea,
    primarySource: DataSource,
    relatedAreaLinks: RelatedAreaLink[]
  ): DataSource[] {
    const sources = new Set<DataSource>([primarySource, ...relatedAreaLinks.map((link) => link.source)]);
    const sourceIds = { ...area.external_ids, ...area.source_ids };

    if (sourceIds.hejfish !== undefined || area.metadata?.sources?.hejfish) sources.add('hejfish');
    if (sourceIds.alleangeln !== undefined || area.metadata?.sources?.alleangeln) sources.add('alleangeln');

    return Array.from(sources);
  }

  private getAreaMapGeometry(area: HejfishArea): WaterMapGeometry | undefined {
    const polygons = this.getAreaPolygons(area);
    const lines = this.getAreaLines(area);
    const points = this.getAreaGeometryPoints(area);

    if (polygons.length === 0 && lines.length === 0 && points.length === 0) return undefined;

    return { polygons, lines, points };
  }

  private getAreaPolygons(area: HejfishArea): Coordinate[][] {
    const canonicalPolygons = Array.isArray(area.geometry?.polygons)
      ? area.geometry.polygons
          .map((polygon) => this.extractCoordinates(polygon))
          .filter((polygon) => polygon.length >= 3)
      : [];
    if (canonicalPolygons.length > 0) return canonicalPolygons;

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
    const canonicalLines = Array.isArray(area.geometry?.lines)
      ? area.geometry.lines
          .map((line) => this.extractCoordinates(line))
          .filter((line) => line.length >= 2)
      : [];
    if (canonicalLines.length > 0) return canonicalLines;

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

  private getAreaFishNames(area: HejfishArea): string[] {
    const primaryFish = this.normalizeFishList(area.fish || (area.metadata as any)?.fish || []);
    if (primaryFish.length > 0) return primaryFish;

    return this.normalizeFishList(area.most_caught_fish || (area.metadata as any)?.most_caught_fish || [])
      .filter((name) => !/^\d+\s+weitere/i.test(name));
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
    const platform = this.getAreaPlatform(area);
    if (platform !== 'hejfish' && platform !== 'merged') return false;
    if (typeof area.lat === 'number' && typeof area.lng === 'number' && !this.isHamburgRegion(area.lat, area.lng)) return false;

    const normalized = this.normalize(`${area.name} ${area.slug || ''}`);
    return hamburgAreaKeywords.some((keyword) => normalized.includes(keyword));
  }

  private isLikelySpecificHamburgWater(area: Pick<HejfishAreaLite | HejfishArea, 'name' | 'slug'>): boolean {
    const normalized = this.normalize(`${area.name} ${area.slug || ''}`);
    return ['doveelbe', 'goseelbe', 'stromelbe', 'altesuederelbe'].some((keyword) => normalized.includes(keyword));
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
    const link = this.getLiteAreaPrimaryLink(area);
    return link ? [{ label: link.label, url: link.url, kind: 'permit' }] : undefined;
  }

  private getAreaLinks(
    area: HejfishArea,
    manager: ProfileManager,
    rulesFiles: Array<{ name: string; url: string }>,
    relatedAreaLinks: RelatedAreaLink[] = []
  ): WaterBodyProfile['links'] {
    const links: NonNullable<WaterBodyProfile['links']> = [];

    const areaName = this.cleanText(area.name) || area.name;
    const sourceLabel = area.source_platform === 'alleangeln' ? `${areaName} bei Alle Angeln oeffnen` : `${areaName} bei hejfish oeffnen`;
    const sourceUrl = this.cleanText(
      area.url
      || area.links?.source
      || (area.source_platform === 'alleangeln' ? area.links?.alleangeln : area.links?.hejfish)
    );
    if (sourceUrl) links.push({ label: sourceLabel, url: sourceUrl, kind: 'permit' });
    for (const link of relatedAreaLinks) {
      links.push({ label: link.label, url: link.url, kind: 'community' });
    }
    if (manager?.website) links.push({ label: 'Betreiber', url: manager.website, kind: 'info' });
    for (const file of rulesFiles) {
      links.push({ label: file.name || 'Regeln', url: file.url, kind: 'info' });
    }

    return links.length > 0 ? links : undefined;
  }

  private getLiteAreaPrimaryLink(area: HejfishAreaLite): RelatedAreaLink | null {
    const platform = this.getAreaPlatform(area);
    if (platform === 'alleangeln') {
      const slug = String(area.id).replace(/^alleangeln-/, '');
      if (!slug) return null;
      return {
        source: 'alleangeln',
        label: `${area.name} bei Alle Angeln oeffnen`,
        url: `https://www.alleangeln.de/gewaesser/${slug}`,
      };
    }

    const hejfishNumericId = this.getHejfishNumericId(area.id);
    if (!hejfishNumericId) return null;

    const slug = area.slug ? `-${area.slug}` : '';
    return {
      source: 'hejfish',
      label: `${area.name} bei hejfish oeffnen`,
      url: `https://www.hejfish.com/d/${hejfishNumericId}${slug}`,
    };
  }

  private getRelatedAreaLinks(area: HejfishArea, liteAreas: HejfishAreaLite[]): RelatedAreaLink[] {
    const links = new Map<string, RelatedAreaLink>();
    const primaryPlatform = area.source_platform || 'hejfish';
    const alleAngelnExternalId = area.source_ids?.alleangeln || area.external_ids?.alleangeln;

    if (alleAngelnExternalId) {
      const slug = String(alleAngelnExternalId).replace(/^alleangeln-/, '');
      const url = `https://www.alleangeln.de/gewaesser/${slug}`;
      links.set(`alleangeln:${url}`, {
        source: 'alleangeln',
        label: `${area.name} bei Alle Angeln oeffnen`,
        url,
      });
    }

    for (const candidate of liteAreas) {
      const candidatePlatform = this.getAreaPlatform(candidate);
      if (candidatePlatform === primaryPlatform) continue;
      if (!this.isLikelySameWater(area, candidate)) continue;

      const link = this.getLiteAreaPrimaryLink(candidate);
      if (link) links.set(`${link.source}:${link.url}`, link);
    }

    return Array.from(links.values());
  }

  private isLikelySameWater(area: HejfishArea, candidate: HejfishAreaLite): boolean {
    const areaName = this.getComparableAreaName(area.name);
    const candidateName = this.getComparableAreaName(candidate.name);
    if (!areaName || !candidateName) return false;

    const nameMatches = areaName === candidateName || areaName.includes(candidateName) || candidateName.includes(areaName);
    if (!nameMatches) return false;

    if (typeof area.lat !== 'number' || typeof area.lng !== 'number' || typeof candidate.lat !== 'number' || typeof candidate.lng !== 'number') {
      return true;
    }

    return this.distanceMeters(area.lat, area.lng, candidate.lat, candidate.lng) <= this.getRelatedAreaRadiusMeters(area, candidate);
  }

  private getComparableAreaName(value?: string): string {
    const normalized = this.normalize(this.cleanText(value) || '');
    return normalized
      .replace(/kombikarte/g, '')
      .replace(/angelkarte/g, '')
      .replace(/jahreskarte/g, '')
      .replace(/gewaesser/g, '')
      .replace(/gewasser/g, '')
      .replace(/karte/g, '');
  }

  private getRelatedAreaRadiusMeters(area: HejfishArea, candidate: HejfishAreaLite): number {
    const areaType = this.mapWaterType(area.water_type, area.name);
    const candidateType = this.mapWaterType(candidate.water_type, candidate.name);
    if (areaType === 'river' || areaType === 'canal' || candidateType === 'river' || candidateType === 'canal') return 9000;
    return 3500;
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
    const season = this.cleanText(area.season);
    if (season && !this.isPlaceholderSeason(season)) return season;

    const begin = this.formatSeasonDate(area.season_begin);
    const end = this.formatSeasonDate(area.season_end);
    if (begin && end) return `${begin} bis ${end}`;
    if (begin) return `ab ${begin}`;
    if (end) return `bis ${end}`;

    return undefined;
  }

  private formatSeasonDate(value?: string): string | undefined {
    const clean = this.cleanText(value);
    if (!clean || this.isPlaceholderSeason(clean)) return undefined;

    const isoDate = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDate) {
      const [, year, month, day] = isoDate;
      return `${day}.${month}.${year}`;
    }

    return clean;
  }

  private isPlaceholderSeason(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return true;
    if (normalized.startsWith('0001-')) return true;
    if (normalized.includes('0001-01-01') && normalized.includes('0001-12-31')) return true;

    return false;
  }

  private getAreaRulesText(area: HejfishArea): string | undefined {
    const borders = this.cleanText(area.borders);
    const rawRulesText = this.cleanText(area.rules_text);
    const extractedRules = rawRulesText ? (this.extractBoundaryRulesText(rawRulesText) || rawRulesText) : undefined;

    if (borders && extractedRules) {
      return `Grenzen:\n${borders}\n\nRegeln:\n${extractedRules}`;
    }

    return borders || extractedRules;
  }

  private extractBoundaryRulesText(value: string): string | undefined {
    const match = value.match(/Grenzen (?:des Gewässers|des Gewaessers|der Gewässer|der Gewaesser)\s*:?\s*(.+)$/i);
    return match?.[1]?.trim() || undefined;
  }

  private getAreaDataQuality(input: {
    fishCount: number;
    techniquesCount: number;
    propertiesCount: number;
    ticketsCount: number;
    hasDescription: boolean;
    hasRulesText: boolean;
    hasMapGeometry: boolean;
    hasManager: boolean;
  }): DataQuality {
    const richSignals = [
      input.techniquesCount > 0,
      input.propertiesCount > 0,
      input.ticketsCount > 0,
      input.hasDescription,
      input.hasRulesText,
      input.hasMapGeometry,
      input.hasManager,
    ].filter(Boolean).length;

    if (input.fishCount > 0 && richSignals >= 2) return 'high';
    if (input.fishCount >= 3) return 'high';
    if (richSignals >= 4) return 'high';
    if (input.fishCount > 0 || richSignals > 0) return 'medium';
    return 'low';
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
