import { FallbackProvider } from '../providers/FallbackProvider';
import { FischInfoNRWProvider } from '../providers/FischInfoNRWProvider';
import { HejfishAreasProvider } from '../providers/HejfishAreasProvider';
import { WaterAPIProvider } from '../providers/WaterAPIProvider';
import type { DataQuality, FishSpecies, SpeciesConfidence, WaterBodyProfile, WaterDataProvider } from '../types/waterData';
import { WaterDataCache } from './waterDataCache';

const qualityRank: Record<DataQuality, number> = {
  high: 4,
  medium: 3,
  low: 2,
  unknown: 1,
};

export class WaterDataService {
  private cache: WaterDataCache;
  private providers: WaterDataProvider[];
  private initialized = false;

  constructor(providers?: WaterDataProvider[]) {
    this.cache = new WaterDataCache();
    this.providers = (providers || [
      new HejfishAreasProvider(),
      new WaterAPIProvider(),
      new FischInfoNRWProvider(),
      new FallbackProvider(),
    ]).sort((a, b) => a.priority - b.priority);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await this.cache.init();
    await this.cache.clearExpired();
    this.initialized = true;
  }

  async getWaterProfile(lat: number, lng: number, forceRefresh: boolean = false): Promise<WaterBodyProfile> {
    await this.init();

    if (!forceRefresh) {
      const cached = await this.cache.get(lat, lng);
      if (cached) return cached;
    }

    const matches: WaterBodyProfile[] = [];

    for (const provider of this.providers) {
      if (!provider.canHandleRegion(lat, lng)) continue;

      try {
        const profile = await provider.getWaterBodyProfile(lat, lng);
        if (profile) {
          matches.push(profile);
          if (profile.dataQuality === 'high') break;
        }
      } catch (error) {
        console.error(`WaterDataService: ${provider.name} failed`, error);
      }
    }

    const profile = this.mergeProfiles(matches, lat, lng);
    await this.cache.set(lat, lng, profile);
    return profile;
  }

  async getBulkProfiles(positions: Array<{ lat: number; lng: number }>): Promise<WaterBodyProfile[]> {
    const results = await Promise.allSettled(
      positions.map((position) => this.getWaterProfile(position.lat, position.lng))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<WaterBodyProfile> => result.status === 'fulfilled')
      .map((result) => result.value);
  }

  async searchWaterBodies(query: string, region?: string): Promise<WaterBodyProfile[]> {
    const allResults: WaterBodyProfile[] = [];

    for (const provider of this.providers) {
      try {
        const results = await provider.searchWaterBodies(query, region);
        allResults.push(...results);
      } catch (error) {
        console.error(`WaterDataService search failed for ${provider.name}`, error);
      }
    }

    const unique = new Map<string, WaterBodyProfile>();
    for (const profile of allResults) {
      const key = `${profile.name}-${profile.latitude.toFixed(2)}-${profile.longitude.toFixed(2)}`;
      const existing = unique.get(key);
      if (!existing || qualityRank[profile.dataQuality] > qualityRank[existing.dataQuality]) {
        unique.set(key, profile);
      }
    }

    return Array.from(unique.values());
  }

  getSpeciesConfidence(profile: WaterBodyProfile, species: string): number {
    return profile.species.find((entry) => entry.species === species)?.confidence ?? 0;
  }

  getTopSpecies(profile: WaterBodyProfile, limit: number = 3): SpeciesConfidence[] {
    return [...profile.species]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  isInClosedSeason(profile: WaterBodyProfile, species: string, date: Date = new Date()): boolean {
    if (!profile.regulations?.closed_seasons) return false;

    return profile.regulations.closed_seasons.some((season) => (
      season.species === species && this.isDateInMonthDayWindow(date, season.start, season.end)
    ));
  }

  private mergeProfiles(profiles: WaterBodyProfile[], lat: number, lng: number): WaterBodyProfile {
    if (profiles.length === 0) {
      return {
        id: `fallback-${lat.toFixed(3)}-${lng.toFixed(3)}`,
        name: 'Unbekanntes Gewaesser',
        type: 'lake',
        latitude: lat,
        longitude: lng,
        region: 'Deutschland',
        species: [],
        dataQuality: 'unknown',
        sources: ['unknown'],
        lastUpdated: new Date(),
      };
    }

    const sorted = [...profiles].sort((a, b) => qualityRank[b.dataQuality] - qualityRank[a.dataQuality]);
    const primary = sorted[0];
    const species = new Map<FishSpecies, SpeciesConfidence>();

    for (const profile of sorted) {
      for (const entry of profile.species) {
        const existing = species.get(entry.species);
        if (!existing || entry.confidence > existing.confidence) {
          species.set(entry.species, entry);
        }
      }
    }

    return {
      ...primary,
      species: Array.from(species.values()),
      sources: Array.from(new Set(sorted.flatMap((profile) => profile.sources))),
      dataQuality: sorted.some((profile) => profile.dataQuality === 'high') ? 'high' : primary.dataQuality,
      lastUpdated: new Date(),
    };
  }

  private isDateInMonthDayWindow(date: Date, start: string, end: string): boolean {
    const [startMonth, startDay] = start.split('-').map(Number);
    const [endMonth, endDay] = end.split('-').map(Number);
    const value = (date.getMonth() + 1) * 100 + date.getDate();
    const startValue = startMonth * 100 + startDay;
    const endValue = endMonth * 100 + endDay;

    if (startValue <= endValue) {
      return value >= startValue && value <= endValue;
    }
    return value >= startValue || value <= endValue;
  }
}

export const waterDataService = new WaterDataService();
