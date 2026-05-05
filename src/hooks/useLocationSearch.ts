import { useCallback, useState } from 'react';

export interface SearchLocation {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export function useLocationSearch() {
  const [results, setResults] = useState<SearchLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setError('Bitte mindestens 3 Zeichen eingeben.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(trimmed)}`,
      );

      if (!response.ok) {
        throw new Error('Standortsuche fehlgeschlagen.');
      }

      const json = await response.json() as NominatimResult[];
      setResults(json.map((item) => ({
        id: String(item.place_id),
        label: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
      })));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Standortsuche fehlgeschlagen.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clear };
}
