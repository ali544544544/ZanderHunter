export type DataSource = 'waterapi' | 'fischinfo_nrw' | 'anglermap' | 'hejfish' | 'user_report' | 'unknown';

export type KnownFishSpecies =
  | 'zander'
  | 'hecht'
  | 'barsch'
  | 'karpfen'
  | 'aal'
  | 'brasse'
  | 'rotauge'
  | 'forelle'
  | 'wels';

export type FishSpecies = KnownFishSpecies | (string & {});

export type WaterBodyType = 'river' | 'lake' | 'canal' | 'pond' | 'sea';
export type DataQuality = 'high' | 'medium' | 'low' | 'unknown';

export interface SpeciesConfidence {
  species: FishSpecies;
  displayName?: string;
  confidence: number;
  source: DataSource;
  lastUpdated: Date;
  notes?: string;
}

export interface WaterBodyProfile {
  id: string;
  name: string;
  type: WaterBodyType;
  latitude: number;
  longitude: number;
  region: string;
  species: SpeciesConfidence[];
  description?: string;
  imageUrl?: string;
  depth?: {
    average?: number;
    max?: number;
    unit: 'm';
  };
  regulations?: {
    permit_required: boolean;
    closed_seasons?: Array<{ species: FishSpecies; start: string; end: string }>;
    size_limits?: Array<{ species: FishSpecies; min_cm: number }>;
    bag_limits?: Array<{ species: FishSpecies; daily_limit: number }>;
  };
  dataQuality: DataQuality;
  sources: DataSource[];
  links?: Array<{
    label: string;
    url: string;
    kind: 'permit' | 'info' | 'community';
  }>;
  areaDetails?: {
    waterSizeHa?: number;
    season?: string;
    techniques?: string[];
    properties?: string[];
    rulesText?: string;
    mobileTicket?: boolean;
    printRequired?: boolean;
    tickets?: Array<{ name: string; price?: string }>;
    manager?: {
      name?: string;
      phone?: string;
      email?: string;
      website?: string;
    };
  };
  lastUpdated: Date;
}

export interface WaterDataProvider {
  name: string;
  priority: number;
  canHandleRegion(lat: number, lng: number): boolean;
  getWaterBodyProfile(lat: number, lng: number, radius?: number): Promise<WaterBodyProfile | null>;
  searchWaterBodies(query: string, region?: string): Promise<WaterBodyProfile[]>;
}

export interface CacheEntry {
  key: string;
  data: WaterBodyProfile;
  cachedAt: Date;
  expiresAt: Date;
}
