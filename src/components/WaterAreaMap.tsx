import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WaterBodyProfile, WaterMapPoint } from '../types/waterData';

interface WaterAreaMapProps {
  profile: WaterBodyProfile | null;
}

const tileSize = 256;
const minZoom = 5;
const maxZoom = 17;
const mapHeight = 220;
const mapPadding = 32;

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

function getBounds(points: WaterMapPoint[]) {
  return points.reduce(
    (bounds, point) => ({
      minLat: Math.min(bounds.minLat, point.lat),
      maxLat: Math.max(bounds.maxLat, point.lat),
      minLng: Math.min(bounds.minLng, point.lng),
      maxLng: Math.max(bounds.maxLng, point.lng),
    }),
    {
      minLat: points[0].lat,
      maxLat: points[0].lat,
      minLng: points[0].lng,
      maxLng: points[0].lng,
    }
  );
}

function getBestZoom(bounds: ReturnType<typeof getBounds>, width: number) {
  for (let zoom = maxZoom; zoom >= minZoom; zoom -= 1) {
    const worldWidth = Math.abs(lngToWorldX(bounds.maxLng, zoom) - lngToWorldX(bounds.minLng, zoom));
    const worldHeight = Math.abs(latToWorldY(bounds.minLat, zoom) - latToWorldY(bounds.maxLat, zoom));

    if (worldWidth <= width - mapPadding * 2 && worldHeight <= mapHeight - mapPadding * 2) {
      return zoom;
    }
  }

  return minZoom;
}

export function WaterAreaMap({ profile }: WaterAreaMapProps) {
  const geometry = profile?.areaDetails?.mapGeometry;
  const selectedLat = profile?.latitude;
  const selectedLng = profile?.longitude;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapWidth, setMapWidth] = useState(360);

  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return undefined;

    const updateWidth = () => setMapWidth(mapElement.clientWidth || 360);
    updateWidth();
    window.addEventListener('resize', updateWidth);

    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const selectedPoint = useMemo(
    () => (
      selectedLat !== undefined && selectedLng !== undefined
        ? { lat: selectedLat, lng: selectedLng }
        : null
    ),
    [selectedLat, selectedLng]
  );
  const allPoints = useMemo(() => {
    if (!geometry) return [];
    return [
      ...geometry.polygons.flat(),
      ...geometry.points,
      ...(selectedPoint ? [selectedPoint] : []),
    ];
  }, [geometry, selectedPoint]);

  const viewport = useMemo(() => {
    if (allPoints.length === 0) return null;

    const bounds = getBounds(allPoints);
    const zoom = allPoints.length === 1 ? 13 : getBestZoom(bounds, mapWidth);
    const center = {
      lat: (bounds.minLat + bounds.maxLat) / 2,
      lng: (bounds.minLng + bounds.maxLng) / 2,
    };
    const centerWorld = {
      x: lngToWorldX(center.lng, zoom),
      y: latToWorldY(center.lat, zoom),
    };

    return { centerWorld, zoom };
  }, [allPoints, mapWidth]);

  const tiles = useMemo(() => {
    if (!viewport) return [];

    const topLeftX = viewport.centerWorld.x - mapWidth / 2;
    const topLeftY = viewport.centerWorld.y - mapHeight / 2;
    const startTileX = Math.floor(topLeftX / tileSize);
    const endTileX = Math.floor((topLeftX + mapWidth) / tileSize);
    const startTileY = Math.floor(topLeftY / tileSize);
    const endTileY = Math.floor((topLeftY + mapHeight) / tileSize);
    const tileCount = Math.pow(2, viewport.zoom);
    const nextTiles = [];

    for (let x = startTileX; x <= endTileX; x += 1) {
      for (let y = startTileY; y <= endTileY; y += 1) {
        if (y < 0 || y >= tileCount) continue;

        const wrappedX = ((x % tileCount) + tileCount) % tileCount;
        nextTiles.push({
          key: `${viewport.zoom}-${x}-${y}`,
          src: `https://tile.openstreetmap.org/${viewport.zoom}/${wrappedX}/${y}.png`,
          left: x * tileSize - topLeftX,
          top: y * tileSize - topLeftY,
        });
      }
    }

    return nextTiles;
  }, [mapWidth, viewport]);

  const projectPoint = useCallback((point: WaterMapPoint) => {
    if (!viewport) return { x: 0, y: 0 };

    return {
      x: lngToWorldX(point.lng, viewport.zoom) - viewport.centerWorld.x + mapWidth / 2,
      y: latToWorldY(point.lat, viewport.zoom) - viewport.centerWorld.y + mapHeight / 2,
    };
  }, [mapWidth, viewport]);

  const polygonPaths = useMemo(() => {
    if (!geometry || !viewport) return [];

    return geometry.polygons.map((polygon) => polygon
      .map((point, index) => {
        const projected = projectPoint(point);
        return `${index === 0 ? 'M' : 'L'} ${projected.x.toFixed(1)} ${projected.y.toFixed(1)}`;
      })
      .join(' ')
    );
  }, [geometry, projectPoint, viewport]);

  const referencePoints = useMemo(() => {
    if (!geometry || !viewport) return [];
    return geometry.points.map(projectPoint);
  }, [geometry, projectPoint, viewport]);

  const selectedPointPosition = selectedPoint && viewport ? projectPoint(selectedPoint) : null;

  if (!profile?.sources.includes('hejfish') || !geometry || allPoints.length === 0 || !viewport) {
    return null;
  }

  const centerLat = worldYToLat(viewport.centerWorld.y, viewport.zoom);
  const centerLng = worldXToLng(viewport.centerWorld.x, viewport.zoom);

  return (
    <section className="card overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gewaesserkarte</p>
          <h2 className="truncate text-sm font-black text-slate-100">{profile.name}</h2>
        </div>
        <span className="shrink-0 text-[10px] font-black uppercase tracking-wide text-blue-300">
          hejfish
        </span>
      </div>
      <div
        ref={mapRef}
        className="relative h-[220px] overflow-hidden rounded-lg border border-slate-800 bg-slate-900"
      >
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            className="absolute h-64 w-64 select-none"
            draggable={false}
            loading="lazy"
            style={{ left: tile.left, top: tile.top }}
          />
        ))}
        <div className="pointer-events-none absolute inset-0 bg-slate-950/10" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
          {polygonPaths.map((path, index) => (
            <path
              key={`${path}-${index}`}
              d={`${path} Z`}
              className="fill-blue-400/25 stroke-blue-300"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {referencePoints.map((point, index) => (
            <circle
              key={`${point.x}-${point.y}-${index}`}
              cx={point.x}
              cy={point.y}
              r="3"
              className="fill-cyan-200 stroke-slate-950"
              strokeWidth="1.5"
            />
          ))}
          {selectedPointPosition && (
            <circle
              cx={selectedPointPosition.x}
              cy={selectedPointPosition.y}
              r="5"
              className="fill-yellow-300 stroke-slate-950"
              strokeWidth="2"
            />
          )}
        </svg>
        <div className="absolute bottom-2 left-2 rounded bg-slate-950/85 px-2 py-1 text-[9px] font-bold text-slate-300">
          {centerLat.toFixed(4)}, {centerLng.toFixed(4)}
        </div>
      </div>
    </section>
  );
}
