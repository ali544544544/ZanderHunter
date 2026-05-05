import React, { useMemo, useState } from 'react';

interface LocationPickerMapProps {
  center: {
    lat: number;
    lng: number;
  };
  onSelect: (location: { lat: number; lng: number; label: string }) => void;
}

const tileSize = 256;
const zoomLevels = [11, 12, 13, 14, 15];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lngToTileX(lng: number, zoom: number) {
  return ((lng + 180) / 360) * Math.pow(2, zoom);
}

function latToTileY(lat: number, zoom: number) {
  const latRad = lat * Math.PI / 180;
  return (
    (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) /
    2 *
    Math.pow(2, zoom)
  );
}

function tileXToLng(x: number, zoom: number) {
  return x / Math.pow(2, zoom) * 360 - 180;
}

function tileYToLat(y: number, zoom: number) {
  const n = Math.PI - 2 * Math.PI * y / Math.pow(2, zoom);
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ center, onSelect }) => {
  const [zoomIndex, setZoomIndex] = useState(2);
  const zoom = zoomLevels[zoomIndex];

  const mapData = useMemo(() => {
    const centerX = lngToTileX(center.lng, zoom);
    const centerY = latToTileY(center.lat, zoom);
    const baseTileX = Math.floor(centerX) - 1;
    const baseTileY = Math.floor(centerY) - 1;
    const offsetX = (centerX - Math.floor(centerX)) * tileSize;
    const offsetY = (centerY - Math.floor(centerY)) * tileSize;

    return {
      centerX,
      centerY,
      baseTileX,
      baseTileY,
      offsetX,
      offsetY,
    };
  }, [center.lat, center.lng, zoom]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const tileX = mapData.centerX + (localX - rect.width / 2) / tileSize;
    const tileY = mapData.centerY + (localY - rect.height / 2) / tileSize;
    const lat = Number(tileYToLat(tileY, zoom).toFixed(5));
    const lng = Number(tileXToLng(tileX, zoom).toFixed(5));

    onSelect({
      lat,
      lng,
      label: `Kartenpunkt ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    });
  };

  const tiles = [];
  for (let x = 0; x < 3; x += 1) {
    for (let y = 0; y < 3; y += 1) {
      const tileX = mapData.baseTileX + x;
      const tileY = mapData.baseTileY + y;
      tiles.push({
        key: `${tileX}-${tileY}`,
        src: `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`,
        left: x * tileSize - mapData.offsetX,
        top: y * tileSize - mapData.offsetY,
      });
    }
  }

  return (
    <div className="space-y-2">
      <div
        className="relative h-48 overflow-hidden rounded-lg border border-slate-800 bg-slate-900"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Standort auf Karte auswahlen"
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            onSelect({
              lat: center.lat,
              lng: center.lng,
              label: `Kartenpunkt ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`,
            });
          }
        }}
      >
        <div className="absolute left-1/2 top-1/2 h-0 w-0">
          {tiles.map((tile) => (
            <img
              key={tile.key}
              src={tile.src}
              alt=""
              className="absolute h-64 w-64 select-none"
              draggable={false}
              style={{ left: tile.left - tileSize, top: tile.top - tileSize }}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-slate-950/5"></div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-400 bg-blue-400/20 shadow-lg shadow-blue-950"></div>
        <div className="absolute bottom-2 left-2 rounded bg-slate-950/80 px-2 py-1 text-[9px] font-bold text-slate-300">
          In die Karte tippen
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-semibold text-slate-500">
          Karte: OpenStreetMap
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setZoomIndex((value) => clamp(value - 1, 0, zoomLevels.length - 1))}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-black text-slate-200"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => setZoomIndex((value) => clamp(value + 1, 0, zoomLevels.length - 1))}
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
