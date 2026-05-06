export interface HejfishAreaLite {
  id: number;
  name: string;
  slug: string;
  lat: number | null;
  lng: number | null;
  water_type?: string | null;
  main_image?: string | null;
  fish_count?: number;
  mobile_ticket?: boolean;
}

export interface HejfishArea {
  id: number;
  slug: string;
  url: string;
  name: string;
  description?: string;
  water_size_ha?: number | null;
  fish?: string[];
  techniques?: string[];
  properties?: string[];
  season?: string;
  water_type?: string;
  rules_text?: string;
  mobile_ticket?: boolean;
  print_required?: boolean;
  tickets?: Array<{ name: string; price?: string }>;
  manager?: {
    name?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  main_image?: string;
  location_info?: string[];
  lat?: number;
  lng?: number;
  geocode_source?: string;
  map_data?: {
    points?: unknown[];
    polygons?: unknown[];
    data?: {
      geojson?: unknown;
      locations?: unknown[];
    };
  };
  country?: string;
  last_updated?: string;
  error?: boolean;
}
