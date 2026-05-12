import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { HejfishAreaLite } from '../types/hejfishArea';

interface LocationPickerMapProps {
  center: {
    lat: number;
    lng: number;
  };
  onSelect: (location: { lat: number; lng: number; label: string }) => void;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  centerX: number;
  centerY: number;
  moved: boolean;
}

interface WaterCluster {
  key: string;
  lat: number;
  lng: number;
  count: number;
  areas: HejfishAreaLite[];
}

const tileSize = 256;
const minZoom = 5;
const maxZoom = 17;
const mapHeight = 280;
const singleMarkerZoom = 13;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lngToWorldX(lng: number, zoom: number) {
  return ((lng + 180) / 360) * tileSize * Math.pow(2, zoom);
}

function latToWorldY(lat: number, zoom: number) {
  const latRad = lat * Math.PI / 180;
  return (
    (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) /
    2 *
    tileSize *
    Math.pow(2, zoom)
  );
}

function worldXToLng(x: number, zoom: number) {
  return x / (tileSize * Math.pow(2, zoom)) * 360 - 180;
}

function worldYToLat(y: number, zoom: number) {
  const n = Math.PI - 2 * Math.PI * y / (tileSize * Math.pow(2, zoom));
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function locationLabel(lat: number, lng: number) {
  return `Kartenpunkt ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function isControlTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('[data-map-control="true"]'));
}

function isWaterMarkerTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('[data-water-marker="true"]'));
}

function hasAreaCoordinate(area: HejfishAreaLite): area is HejfishAreaLite & { lat: number; lng: number } {
  return typeof area.lat === 'number' && typeof area.lng === 'number' && Number.isFinite(area.lat) && Number.isFinite(area.lng);
}

function waterLabel(area: HejfishAreaLite) {
  return area.name || `Gewaesser ${area.lat?.toFixed(4)}, ${area.lng?.toFixed(4)}`;
}

async function fetchWaterAreas() {
  const basePath = import.meta.env.BASE_URL;
  const paths = [`${basePath}data/areas_lite.json`, `${basePath}data/dist/areas_lite.json`];

  for (const path of paths) {
    try {
      const response = await fetch(path, { cache: 'no-cache' });
      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        return data.filter((area): area is HejfishAreaLite => Boolean(area) && hasAreaCoordinate(area));
      }
    } catch {
      continue;
    }
  }

  return [];
}

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ center, onSelect }) => {
  const centerLat = center.lat;
  const centerLng = center.lng;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClusterClickRef = useRef(false);
  const [mapWidth, setMapWidth] = useState(360);
  const [zoom, setZoom] = useState(12);
  const [mapCenter, setMapCenter] = useState(center);
  const [selectedPoint, setSelectedPoint] = useState(center);
  const [waterAreas, setWaterAreas] = useState<HejfishAreaLite[]>([]);
  const [waterAreasLoading, setWaterAreasLoading] = useState(false);

  useEffect(() => {
    const nextCenter = { lat: centerLat, lng: centerLng };
    setMapCenter(nextCenter);
    setSelectedPoint(nextCenter);
  }, [centerLat, centerLng]);

  const centerWorld = useMemo(
    () => ({
      x: lngToWorldX(mapCenter.lng, zoom),
      y: latToWorldY(mapCenter.lat, zoom),
    }),
    [mapCenter.lat, mapCenter.lng, zoom]
  );

  const tiles = useMemo(() => {
    const topLeftX = centerWorld.x - mapWidth / 2;
    const topLeftY = centerWorld.y - mapHeight / 2;
    const startTileX = Math.floor(topLeftX / tileSize);
    const endTileX = Math.floor((topLeftX + mapWidth) / tileSize);
    const startTileY = Math.floor(topLeftY / tileSize);
    const endTileY = Math.floor((topLeftY + mapHeight) / tileSize);
    const tileCount = Math.pow(2, zoom);
    const nextTiles = [];

    for (let x = startTileX; x <= endTileX; x += 1) {
      for (let y = startTileY; y <= endTileY; y += 1) {
        if (y < 0 || y >= tileCount) {
          continue;
        }

        const wrappedX = ((x % tileCount) + tileCount) % tileCount;
        nextTiles.push({
          key: `${zoom}-${x}-${y}`,
          src: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`,
          left: x * tileSize - topLeftX,
          top: y * tileSize - topLeftY,
        });
      }
    }

    return nextTiles;
  }, [centerWorld.x, centerWorld.y, mapWidth, zoom]);

  const visibleWaterAreas = useMemo(() => {
    if (waterAreas.length === 0) {
      return [];
    }

    const topLeftX = centerWorld.x - mapWidth / 2;
    const topLeftY = centerWorld.y - mapHeight / 2;
    const bottomRightX = centerWorld.x + mapWidth / 2;
    const bottomRightY = centerWorld.y + mapHeight / 2;
    const minLng = worldXToLng(topLeftX, zoom);
    const maxLng = worldXToLng(bottomRightX, zoom);
    const minLat = worldYToLat(bottomRightY, zoom);
    const maxLat = worldYToLat(topLeftY, zoom);
    const lngPadding = Math.abs(maxLng - minLng) * 0.12;
    const latPadding = Math.abs(maxLat - minLat) * 0.12;

    return waterAreas.filter((area) => {
      if (!hasAreaCoordinate(area)) {
        return false;
      }

      return area.lat >= minLat - latPadding
        && area.lat <= maxLat + latPadding
        && area.lng >= minLng - lngPadding
        && area.lng <= maxLng + lngPadding;
    });
  }, [centerWorld.x, centerWorld.y, mapWidth, waterAreas, zoom]);

  const waterClusters = useMemo(() => {
    if (visibleWaterAreas.length === 0) {
      return [];
    }

    const bucketSize = zoom >= singleMarkerZoom ? 1 : zoom >= 11 ? 56 : zoom >= 9 ? 72 : 96;
    const clusters = new Map<string, {
      areas: HejfishAreaLite[];
      latSum: number;
      lngSum: number;
    }>();

    for (const area of visibleWaterAreas) {
      if (!hasAreaCoordinate(area)) {
        continue;
      }

      const x = lngToWorldX(area.lng, zoom) - centerWorld.x + mapWidth / 2;
      const y = latToWorldY(area.lat, zoom) - centerWorld.y + mapHeight / 2;
      const key = zoom >= singleMarkerZoom
        ? String(area.id)
        : `${Math.floor(x / bucketSize)}:${Math.floor(y / bucketSize)}`;
      const cluster = clusters.get(key);

      if (cluster) {
        cluster.areas.push(area);
        cluster.latSum += area.lat;
        cluster.lngSum += area.lng;
      } else {
        clusters.set(key, {
          areas: [area],
          latSum: area.lat,
          lngSum: area.lng,
        });
      }
    }

    return Array.from(clusters.entries()).map(([key, cluster]): WaterCluster => ({
      key,
      areas: cluster.areas,
      count: cluster.areas.length,
      lat: cluster.latSum / cluster.areas.length,
      lng: cluster.lngSum / cluster.areas.length,
    }));
  }, [centerWorld.x, centerWorld.y, mapWidth, visibleWaterAreas, zoom]);

  const selectedMarkerStyle = useMemo(() => {
    const selectedWorldX = lngToWorldX(selectedPoint.lng, zoom);
    const selectedWorldY = latToWorldY(selectedPoint.lat, zoom);

    return {
      left: selectedWorldX - centerWorld.x + mapWidth / 2,
      top: selectedWorldY - centerWorld.y + mapHeight / 2,
    };
  }, [centerWorld.x, centerWorld.y, mapWidth, selectedPoint.lat, selectedPoint.lng, zoom]);

  const getMarkerStyle = (point: { lat: number; lng: number }) => ({
    left: lngToWorldX(point.lng, zoom) - centerWorld.x + mapWidth / 2,
    top: latToWorldY(point.lat, zoom) - centerWorld.y + mapHeight / 2,
  });

  const pointToLocation = (clientX: number, clientY: number) => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) {
      return selectedPoint;
    }

    const worldX = centerWorld.x + clientX - rect.left - rect.width / 2;
    const worldY = centerWorld.y + clientY - rect.top - rect.height / 2;
    const lat = Number(worldYToLat(worldY, zoom).toFixed(5));
    const lng = Number(worldXToLng(worldX, zoom).toFixed(5));

    return { lat, lng };
  };

  const moveCenterByPixels = (worldX: number, worldY: number) => {
    const tileCount = Math.pow(2, zoom);
    const maxWorld = tileSize * tileCount;
    const lat = clamp(worldYToLat(worldY, zoom), -85, 85);
    const lng = worldXToLng(((worldX % maxWorld) + maxWorld) % maxWorld, zoom);

    setMapCenter({ lat, lng });
  };

  const selectCenter = () => {
    setSelectedPoint(mapCenter);
    onSelect({ ...mapCenter, label: locationLabel(mapCenter.lat, mapCenter.lng) });
  };

  const changeZoom = (direction: number) => {
    setZoom((value) => clamp(value + direction, minZoom, maxZoom));
  };

  const selectWaterArea = (area: HejfishAreaLite) => {
    if (!hasAreaCoordinate(area)) {
      return;
    }

    const nextPoint = { lat: area.lat, lng: area.lng };
    setMapCenter(nextPoint);
    setSelectedPoint(nextPoint);
    onSelect({ ...nextPoint, label: waterLabel(area) });
  };

  const openWaterCluster = (cluster: WaterCluster) => {
    if (cluster.count === 1) {
      selectWaterArea(cluster.areas[0]);
      return;
    }

    setMapCenter({ lat: cluster.lat, lng: cluster.lng });
    setZoom((value) => clamp(Math.max(value + 2, singleMarkerZoom), minZoom, maxZoom));
  };

  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) {
      return undefined;
    }

    const updateWidth = () => setMapWidth(mapElement.clientWidth || 360);
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const direction = event.deltaY > 0 ? -1 : 1;
      setZoom((value) => clamp(value + direction, minZoom, maxZoom));
    };

    updateWidth();
    mapElement.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', updateWidth);

    return () => {
      mapElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  useEffect(() => {
    let active = true;
    setWaterAreasLoading(true);

    fetchWaterAreas()
      .then((areas) => {
        if (active) {
          setWaterAreas(areas);
        }
      })
      .finally(() => {
        if (active) {
          setWaterAreasLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        className="relative h-[280px] touch-none overflow-hidden rounded-lg border border-slate-800 bg-slate-900"
        onPointerDown={(event) => {
          if (isControlTarget(event.target)) {
            return;
          }

          if (event.button !== 0) {
            return;
          }

          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            centerX: centerWorld.x,
            centerY: centerWorld.y,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) {
            return;
          }

          const deltaX = event.clientX - drag.startX;
          const deltaY = event.clientY - drag.startY;
          drag.moved = drag.moved || Math.abs(deltaX) + Math.abs(deltaY) > 6;
          moveCenterByPixels(drag.centerX - deltaX, drag.centerY - deltaY);
        }}
        onPointerUp={(event) => {
          if (isControlTarget(event.target)) {
            return;
          }

          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) {
            return;
          }

          dragRef.current = null;
          if (drag.moved) {
            suppressClusterClickRef.current = true;
            window.setTimeout(() => {
              suppressClusterClickRef.current = false;
            }, 0);
            return;
          }

          if (isWaterMarkerTarget(event.target)) {
            return;
          }

          const location = pointToLocation(event.clientX, event.clientY);
          setSelectedPoint(location);
          onSelect({ ...location, label: locationLabel(location.lat, location.lng) });
        }}
        onPointerCancel={(event) => {
          const drag = dragRef.current;
          if (drag?.pointerId === event.pointerId) {
            dragRef.current = null;
          }
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          const location = pointToLocation(event.clientX, event.clientY);
          setMapCenter(location);
          setSelectedPoint(location);
          changeZoom(1);
          onSelect({ ...location, label: locationLabel(location.lat, location.lng) });
        }}
        role="button"
        tabIndex={0}
        aria-label="Standort auf Karte auswählen"
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            onSelect({ ...selectedPoint, label: locationLabel(selectedPoint.lat, selectedPoint.lng) });
          }
        }}
      >
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            className="absolute h-64 w-64 select-none"
            draggable={false}
            loading="eager"
            style={{ left: tile.left, top: tile.top }}
          />
        ))}
        <div className="pointer-events-none absolute inset-0 bg-slate-950/5"></div>
        <div className="absolute inset-0">
          {waterClusters.map((cluster) => {
            const area = cluster.areas[0];
            const isSingle = cluster.count === 1;
            const markerStyle = getMarkerStyle(cluster);
            const markerSize = isSingle ? 18 : clamp(22 + Math.log10(cluster.count + 1) * 10, 24, 38);

            return (
              <button
                key={cluster.key}
                type="button"
                data-water-marker="true"
                onClick={(event) => {
                  event.stopPropagation();
                  if (suppressClusterClickRef.current) {
                    suppressClusterClickRef.current = false;
                    return;
                  }

                  openWaterCluster(cluster);
                }}
                className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border font-black shadow-md shadow-slate-950/40 transition-transform hover:scale-110 ${
                  isSingle
                    ? 'border-cyan-200/80 bg-cyan-400/90 text-slate-950'
                    : 'border-blue-200/80 bg-blue-500/95 text-white'
                }`}
                style={{
                  ...markerStyle,
                  width: markerSize,
                  height: markerSize,
                }}
                title={isSingle ? waterLabel(area) : `${cluster.count} Gewaesser`}
                aria-label={isSingle ? `${waterLabel(area)} auswaehlen` : `${cluster.count} Gewaesser anzeigen`}
              >
                <span className={isSingle ? 'h-1.5 w-1.5 rounded-full bg-slate-950' : 'text-[10px] leading-none'}>
                  {isSingle ? '' : cluster.count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/85 bg-slate-950/20 shadow-lg shadow-slate-950/60">
          <span className="absolute left-1/2 top-1/2 h-0.5 w-10 -translate-x-1/2 -translate-y-1/2 bg-white/85"></span>
          <span className="absolute left-1/2 top-1/2 h-10 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-white/85"></span>
        </div>
        <div
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-400 bg-blue-400/25 shadow-lg shadow-blue-950"
          style={selectedMarkerStyle}
        ></div>
        <div className="absolute right-2 top-2 flex flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-950/90 shadow-lg shadow-slate-950/40">
          <button
            type="button"
            data-map-control="true"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              changeZoom(1);
            }}
            className="h-10 w-10 border-b border-slate-700 text-lg font-black text-slate-100 transition-colors hover:bg-slate-800"
            aria-label="Karte reinzoomen"
          >
            +
          </button>
          <button
            type="button"
            data-map-control="true"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              changeZoom(-1);
            }}
            className="h-10 w-10 text-lg font-black text-slate-100 transition-colors hover:bg-slate-800"
            aria-label="Karte rauszoomen"
          >
            -
          </button>
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
          <div className="pointer-events-none rounded bg-slate-950/85 px-2 py-1 text-[9px] font-bold text-slate-300">
            {waterAreasLoading
              ? 'Gewaesser laden...'
              : `${visibleWaterAreas.length} sichtbar - ${zoom >= singleMarkerZoom ? 'Marker' : 'Cluster'}`}
          </div>
          <button
            type="button"
            data-map-control="true"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              selectCenter();
            }}
            className="rounded-lg border border-blue-500/40 bg-blue-500/90 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white shadow-lg shadow-blue-950/40"
          >
            Punkt setzen
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-2 py-1.5">
        <p className="text-[9px] font-semibold text-slate-500">
          OpenStreetMap - Zoom {zoom}
        </p>
        <p className="text-[9px] font-semibold text-slate-500">
          {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
        </p>
      </div>
    </div>
  );
};

export default LocationPickerMap;
