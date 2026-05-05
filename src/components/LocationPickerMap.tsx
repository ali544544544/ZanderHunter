import React, { useMemo, useRef, useState } from 'react';

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

const tileSize = 256;
const zoomLevels = [11, 12, 13, 14, 15, 16];
const mapHeight = 224;

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

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ center, onSelect }) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [zoomIndex, setZoomIndex] = useState(2);
  const zoom = zoomLevels[zoomIndex];
  const [mapCenter, setMapCenter] = useState(center);
  const [selectedPoint, setSelectedPoint] = useState(center);

  const centerWorld = useMemo(
    () => ({
      x: lngToWorldX(mapCenter.lng, zoom),
      y: latToWorldY(mapCenter.lat, zoom),
    }),
    [mapCenter.lat, mapCenter.lng, zoom]
  );

  const tiles = useMemo(() => {
    const width = mapRef.current?.clientWidth || 360;
    const topLeftX = centerWorld.x - width / 2;
    const topLeftY = centerWorld.y - mapHeight / 2;
    const startTileX = Math.floor(topLeftX / tileSize);
    const endTileX = Math.floor((topLeftX + width) / tileSize);
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
  }, [centerWorld.x, centerWorld.y, zoom]);

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

  const changeZoom = (direction: number) => {
    setZoomIndex((value) => clamp(value + direction, 0, zoomLevels.length - 1));
  };

  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        className="relative h-56 touch-none overflow-hidden rounded-lg border border-slate-800 bg-slate-900"
        onPointerDown={(event) => {
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
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) {
            return;
          }

          dragRef.current = null;
          if (drag.moved) {
            return;
          }

          const location = pointToLocation(event.clientX, event.clientY);
          setSelectedPoint(location);
          onSelect({ ...location, label: locationLabel(location.lat, location.lng) });
        }}
        onWheel={(event) => {
          event.preventDefault();
          changeZoom(event.deltaY > 0 ? -1 : 1);
        }}
        role="button"
        tabIndex={0}
        aria-label="Standort auf Karte auswaehlen"
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
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-400 bg-blue-400/20 shadow-lg shadow-blue-950"></div>
        <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-slate-950/85 px-2 py-1 text-[9px] font-bold text-slate-300">
          Ziehen, zoomen, tippen
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-semibold text-slate-500">
          Karte: OpenStreetMap - Zoom {zoom}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => changeZoom(-1)}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-black text-slate-200"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => changeZoom(1)}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-black text-slate-200"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerMap;
