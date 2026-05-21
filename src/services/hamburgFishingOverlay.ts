export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export type HamburgFishingLayerCategory = 'permission' | 'ban' | 'nsg' | 'info';

export interface HamburgFishingLayer {
  id: string;
  label: string;
  category: HamburgFishingLayerCategory;
  url: string;
  outFields: string[];
}

export type GeoJsonGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'MultiPoint'; coordinates: [number, number][] }
  | { type: 'LineString'; coordinates: [number, number][] }
  | { type: 'MultiLineString'; coordinates: [number, number][][] }
  | { type: 'Polygon'; coordinates: [number, number][][] }
  | { type: 'MultiPolygon'; coordinates: [number, number][][][] };

export interface HamburgFishingFeature {
  id: string;
  layerId: string;
  layerLabel: string;
  category: HamburgFishingLayerCategory;
  properties: Record<string, unknown>;
  geometry: GeoJsonGeometry;
}

interface GeoJsonFeature {
  id?: string | number;
  properties?: Record<string, unknown>;
  geometry?: GeoJsonGeometry | null;
}

interface GeoJsonFeatureCollection {
  features?: GeoJsonFeature[];
}

export const HAMBURG_FISHING_OVERLAY_SOURCE =
  'Anglerverband Hamburg e.V. / ArcGIS Anglerkarte_2024';

const arcgisBaseUrl = 'https://services9.arcgis.com/S9RWwBADLvmfvI9X/arcgis/rest/services';

export const HAMBURG_BOUNDS: MapBounds = {
  minLat: 53.35,
  maxLat: 53.75,
  minLng: 9.65,
  maxLng: 10.35,
};

export const HAMBURG_FISHING_LAYERS: HamburgFishingLayer[] = [
  {
    id: 'hamburg-permission-areas',
    label: 'Angel-Erlaubnisbereiche',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_BAl_aeb/FeatureServer/0`,
    outFields: ['AErl'],
  },
  {
    id: 'aussenalster-aeb',
    label: 'Aussenalster',
    category: 'permission',
    url: `${arcgisBaseUrl}/S__AAl_AEB/FeatureServer/0`,
    outFields: ['*'],
  },
  {
    id: 'fg-aeb',
    label: 'Freie Gewaesser',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_P1_AusbG_Freie/FeatureServer/0`,
    outFields: ['AErl'],
  },
  {
    id: 'alster-aeb',
    label: 'Alster',
    category: 'permission',
    url: `${arcgisBaseUrl}/SAl_Aeb/FeatureServer/0`,
    outFields: ['AErl'],
  },
  {
    id: 'elbe-aeb',
    label: 'Elbe',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_E__AEB/FeatureServer/0`,
    outFields: ['AErl'],
  },
  {
    id: 'elbe-ns-aeb',
    label: 'Elbe Nebenstrecken',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_E_NS_AEB/FeatureServer/0`,
    outFields: ['AErl'],
  },
  {
    id: 'hafen-kanal-aeb',
    label: 'Hafen und Kanaele',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_E_HuK_AEB_Mitte/FeatureServer/0`,
    outFields: ['AErl'],
  },
  {
    id: 'hafen-kanal-nord-aeb',
    label: 'Hafen und Kanaele Nord',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_E__HuK_N_AEB/FeatureServer/0`,
    outFields: ['AErl'],
  },
  {
    id: 'billkanal-aeb',
    label: 'Billkanaele',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_BK_Aeb/FeatureServer/0`,
    outFields: ['AErl'],
  },
  {
    id: 'bille-aeb',
    label: 'Bille',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_B_Aeb/FeatureServer/0`,
    outFields: ['AErl'],
  },
  {
    id: 'dove-elbe-aeb',
    label: 'Dove-Elbe',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_DE_AEB/FeatureServer/0`,
    outFields: ['AErl'],
  },
  {
    id: 'gae-aeb',
    label: 'Gewasser Ost',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_GE_AEB/FeatureServer/0`,
    outFields: ['AErl'],
  },
  {
    id: 'hohendeich-aeb',
    label: 'Hohendeicher See',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_HS_AEB/FeatureServer/0`,
    outFields: ['AErl'],
  },
  {
    id: 'eichbaumsee-aeb',
    label: 'Eichbaumsee',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_ES_AEB/FeatureServer/0`,
    outFields: ['*'],
  },
  {
    id: 'alte-suderelbe-aeb',
    label: 'Alte Suederelbe',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_AsE__AEB/FeatureServer/0`,
    outFields: ['*'],
  },
  {
    id: 'brackwasser-bucht-aeb',
    label: 'Brackwasserbereiche',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_BBu_Aeb/FeatureServer/0`,
    outFields: ['*'],
  },
  {
    id: 'wilstorf-aeb',
    label: 'Wilstorf',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_WG_AEB/FeatureServer/0`,
    outFields: ['AErl'],
  },
  {
    id: 'hamburg-sued-aeb',
    label: 'Hamburg Sued',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_HuS_AEB/FeatureServer/0`,
    outFields: ['AErl'],
  },
  {
    id: 'alkuf-aeb',
    label: 'Alsterkanaele',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_alkuf_aeb/FeatureServer/0`,
    outFields: ['AErl'],
  },
  {
    id: 'verband-boot-aeb',
    label: 'Bootsangelbereiche',
    category: 'permission',
    url: `${arcgisBaseUrl}/S_BA_AEB/FeatureServer/0`,
    outFields: ['AErl'],
  },
];

export function intersectsHamburg(bounds: MapBounds) {
  return bounds.maxLat >= HAMBURG_BOUNDS.minLat
    && bounds.minLat <= HAMBURG_BOUNDS.maxLat
    && bounds.maxLng >= HAMBURG_BOUNDS.minLng
    && bounds.minLng <= HAMBURG_BOUNDS.maxLng;
}

export function getPermissionTone(value: unknown): 'allowed' | 'blocked' | 'forbidden' | 'noUse' | 'unknown' {
  const text = value && typeof value === 'object'
    ? Object.values(value).filter((entry) => typeof entry === 'string').join(' ')
    : String(value || '');
  const normalized = text.toLowerCase();

  if (normalized.includes('keine anglerische nutzung')) return 'noUse';
  if (normalized.includes('erlaubt')) return 'allowed';
  if (normalized.includes('verboten')) return 'forbidden';
  if (normalized.includes('nicht')) return 'blocked';

  return 'unknown';
}

function toArcgisQuery(layer: HamburgFishingLayer, bounds: MapBounds) {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    returnGeometry: 'true',
    f: 'geojson',
    geometry: [
      bounds.minLng.toFixed(6),
      bounds.minLat.toFixed(6),
      bounds.maxLng.toFixed(6),
      bounds.maxLat.toFixed(6),
    ].join(','),
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outSR: '4326',
    resultRecordCount: '600',
  });

  return `${layer.url}/query?${params.toString()}`;
}

export async function fetchHamburgFishingOverlay(
  bounds: MapBounds,
  signal?: AbortSignal
): Promise<HamburgFishingFeature[]> {
  if (!intersectsHamburg(bounds)) {
    return [];
  }

  const results = await Promise.allSettled(
    HAMBURG_FISHING_LAYERS.map(async (layer) => {
      const response = await fetch(toArcgisQuery(layer, bounds), { signal });

      if (!response.ok) {
        throw new Error(`ArcGIS layer ${layer.id} failed with ${response.status}`);
      }

      const data = await response.json() as GeoJsonFeatureCollection;

      return (data.features || [])
        .filter((feature): feature is GeoJsonFeature & { geometry: GeoJsonGeometry } => Boolean(feature.geometry))
        .map((feature, index): HamburgFishingFeature => ({
          id: `${layer.id}-${feature.id ?? index}`,
          layerId: layer.id,
          layerLabel: layer.label,
          category: layer.category,
          properties: feature.properties || {},
          geometry: feature.geometry,
        }));
    })
  );

  return results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
}
