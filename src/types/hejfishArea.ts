export interface HejfishAreaLite {
  id: number | string;
  name: string;
  slug?: string;
  lat: number | null;
  lng: number | null;
  water_type?: string | null;
  main_image?: string | null;
  fish_count?: number;
  mobile_ticket?: boolean;
  platform?: string;
}

export interface HejfishGeoIndexEntry {
  id: number | string;
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
  external_ids?: Record<string, number | string>;
  error?: boolean;
}
