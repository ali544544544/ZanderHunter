import React, { useEffect, useMemo, useRef, useState } from 'react';

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
const minZoom = 5;
const maxZoom = 17;
const mapHeight = 280;

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
  return target instanceof Element && Boolean(target.closest('button'));
}

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ center, onSelect }) => {
  const centerLat = center.lat;
  const centerLng = center.lng;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [mapWidth, setMapWidth] = useState(360);
  const [zoom, setZoom] = useState(12);
  const [mapCenter, setMapCenter] = useState(center);
  const [selectedPoint, setSelectedPoint] = useState(center);

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

  const selectedMarkerStyle = useMemo(() => {
    const selectedWorldX = lngToWorldX(selectedPoint.lng, zoom);
    const selectedWorldY = latToWorldY(selectedPoint.lat, zoom);

    return {
      left: selectedWorldX - centerWorld.x + mapWidth / 2,
      top: selectedWorldY - centerWorld.y + mapHeight / 2,
    };
  }, [centerWorld.x, centerWorld.y, mapWidth, selectedPoint.lat, selectedPoint.lng, zoom]);

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
            return;
          }

          const location = pointToLocation(event.clientX, event.clientY);
          setSelectedPoint(location);
          onSelect({ ...location, label: locationLabel(location.lat, location.lng) });
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
            Ziehen, Mausrad, Doppelklick
          </div>
          <button
            type="button"
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
