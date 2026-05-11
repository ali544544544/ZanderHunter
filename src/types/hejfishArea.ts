export interface HejfishAreaLite {
  id: number | string;
  name: string;
  slug?: string;
  lat: number | null;
  lng: number | null;
  water_type?: string | null;
  main_image?: string | null;
  fish_count?: number;
  has_geometry?: boolean;
  geometry_quality?: 'none' | 'point' | 'line' | 'polygon' | string;
  detail_path?: string;
  mobile_ticket?: boolean;
  platform?: string;
}

export interface HejfishGeoIndexEntry {
  id: number | string;
  platform?: string;
  name: string;
  slug?: string;
  lat: number;
  lng: number;
  water_type?: string | null;
  fish_count?: number;
  bounds?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  points?: Array<{ lat: number; lng: number }>;
  geometry_quality?: 'none' | 'point' | 'line' | 'polygon' | string;
}

export interface HejfishArea {
  id: number | string;
  slug?: string;
  url?: string;
  name: string;
  description?: string;
  intro?: string;
  details?: string;
  borders?: string;
  water_size_ha?: number | null;
  fish?: string[];
  most_caught_fish?: string[];
  best_method?: string;
  followers?: number;
  catches_count?: number;
  images_count?: number;
  techniques?: string[];
  properties?: string[];
  season?: string;
  season_begin?: string;
  season_end?: string;
  water_type?: string;
  rules_text?: string;
  rules_files?: Array<{ name?: string; description?: string | null; file?: string; url?: string }>;
  mobile_ticket?: boolean;
  print_required?: boolean;
  tickets?: Array<{ name: string; price?: string }>;
  ticket_types?: unknown[];
  manager?: {
    name?: string;
    phone?: string;
    telephone?: string;
    email?: string;
    website?: string;
    logo?: string;
  };
  main_image?: string;
  image?: string;
  location_info?: string[];
  location?: {
    city?: { name?: string };
    district?: { name?: string };
    state?: { name?: string };
    country?: { name?: string; code?: string };
  };
  features?: Record<string, boolean | string | number | null | undefined>;
  lat?: number;
  lng?: number;
  center?: {
    lat: number;
    lng: number;
    source?: string;
    confidence?: string;
  };
  geometry?: {
    points?: Array<{ lat: number; lng: number }>;
    lines?: Array<Array<{ lat: number; lng: number }>>;
    polygons?: Array<Array<{ lat: number; lng: number }>>;
    source?: string;
    confidence?: string;
  };
  geocode_source?: string;
  map_data?: {
    points?: unknown[];
    polygons?: unknown[];
    geojson?: unknown;
    locations?: unknown[];
    data?: {
      geojson?: unknown;
      locations?: unknown[];
    };
  };
  country?: string;
  last_updated?: string;
  source_platform?: string;
  global_id?: string;
  source_ids?: Record<string, number | string>;
  external_ids?: Record<string, number | string>;
  links?: Record<string, string | undefined>;
  metadata?: {
    merged_fields?: Record<string, string | string[]>;
    sources?: Record<string, Partial<HejfishArea> & {
      platform?: string;
      source_last_updated?: string;
      seo_name?: string;
    }>;
  };
  error?: boolean;
}
