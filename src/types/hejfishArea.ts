export interface HejfishArea {
  id: number;
  slug: string;
  url: string;
  name: string;
  description?: string;
  water_size_ha?: number;
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
  };
  country?: string;
  last_updated?: string;
  error?: boolean;
}
