import React, { useMemo, useState } from 'react';

interface LocationPickerMapProps {
  center: {
    lat: number;
    lng: number;
  };
  onSelect: (location: { lat: number; lng: number; label: string }) => void;
}

const zoomLevels = [
  { label: 'Weit', latSpan: 0.18, lngSpan: 0.28 },
  { label: 'Stadt', latSpan: 0.09, lngSpan: 0.14 },
  { label: 'Spot', latSpan: 0.045, lngSpan: 0.07 },
  { label: 'Nah', latSpan: 0.022, lngSpan: 0.035 },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ center, onSelect }) => {
  const [zoomIndex, setZoomIndex] = useState(1);
  const zoom = zoomLevels[zoomIndex];

  const bounds = useMemo(() => {
    const west = center.lng - zoom.lngSpan / 2;
    const east = center.lng + zoom.lngSpan / 2;
    const south = center.lat - zoom.latSpan / 2;
    const north = center.lat + zoom.latSpan / 2;

    return { west, east, south, north };
  }, [center.lat, center.lng, zoom.latSpan, zoom.lngSpan]);

  const mapUrl = useMemo(() => {
    const bbox = [bounds.west, bounds.south, bounds.east, bounds.north]
      .map((value) => value.toFixed(5))
      .join(',');

    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${center.lat.toFixed(5)},${center.lng.toFixed(5)}`;
  }, [bounds, center.lat, center.lng]);

  const selectFromPointer = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const xRatio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const yRatio = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const lng = Number((bounds.west + (bounds.east - bounds.west) * xRatio).toFixed(5));
    const lat = Number((bounds.north - (bounds.north - bounds.south) * yRatio).toFixed(5));

    onSelect({
      lat,
      lng,
      label: `Kartenpunkt ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    });
  };

  return (
    <div className="space-y-2">
      <div className="relative h-56 overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
        <iframe
          title="Standortkarte"
          src={mapUrl}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
        />
        <div
          className="absolute inset-0 cursor-crosshair"
          onClick={selectFromPointer}
          role="button"
          tabIndex={0}
          aria-label="Standort auf Karte auswaehlen"
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              onSelect({
                lat: center.lat,
                lng: center.lng,
                label: `Kartenpunkt ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`,
              });
            }
          }}
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-400 bg-blue-400/20 shadow-lg shadow-blue-950"></div>
        <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-slate-950/85 px-2 py-1 text-[9px] font-bold text-slate-300">
          In die Karte tippen
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-semibold text-slate-500">
          Karte: OpenStreetMap - {zoom.label}
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
