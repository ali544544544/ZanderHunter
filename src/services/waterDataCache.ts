import type { WaterBodyProfile } from '../types/waterData';

type StoredProfile = {
  id: string;
  profile: WaterBodyProfile;
  cachedAt: number;
  expiresAt: number;
};

const DB_NAME = 'zanderhunter-water-data-cache';
const STORE_NAME = 'profiles';
const DB_VERSION = 1;
const CACHE_KEY_VERSION = 'v12';

function restoreProfileDates(profile: WaterBodyProfile): WaterBodyProfile {
  return {
    ...profile,
    lastUpdated: new Date(profile.lastUpdated),
    species: profile.species.map((species) => ({
      ...species,
      lastUpdated: new Date(species.lastUpdated),
    })),
  };
}

export class WaterDataCache {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private memoryCache = new Map<string, StoredProfile>();
  private readonly cacheDurationDays = 30;

  async init(): Promise<void> {
    if (!this.dbPromise) {
      this.dbPromise = this.openDatabase();
    }
    await this.dbPromise;
  }

  private async openDatabase(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') {
      return null;
    }

    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by-expiry', 'expiresAt');
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    });
  }

  private getCacheKey(lat: number, lng: number): string {
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLng = Math.round(lng * 1000) / 1000;
    return `${CACHE_KEY_VERSION}:${roundedLat},${roundedLng}`;
  }

  private async getDb(): Promise<IDBDatabase | null> {
    if (!this.dbPromise) {
      this.dbPromise = this.openDatabase();
    }
    return this.dbPromise;
  }

  private async withStore<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>
  ): Promise<T | null> {
    const db = await this.getDb();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const result = action(store);

      if (result instanceof IDBRequest) {
        result.onsuccess = () => resolve(result.result);
        result.onerror = () => resolve(null);
        return;
      }

      Promise.resolve(result).then(resolve).catch(() => resolve(null));
    });
  }

  async get(lat: number, lng: number): Promise<WaterBodyProfile | null> {
    const key = this.getCacheKey(lat, lng);
    const memoryEntry = this.memoryCache.get(key);
    const entry = memoryEntry || await this.withStore<StoredProfile>('readonly', (store) => store.get(key));

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      await this.delete(key);
      return null;
    }

    return restoreProfileDates(entry.profile);
  }

  async set(lat: number, lng: number, profile: WaterBodyProfile): Promise<void> {
    const key = this.getCacheKey(lat, lng);
    const now = Date.now();
    const entry: StoredProfile = {
      id: key,
      profile,
      cachedAt: now,
      expiresAt: now + this.cacheDurationDays * 24 * 60 * 60 * 1000,
    };

    this.memoryCache.set(key, entry);
    await this.withStore<IDBValidKey>('readwrite', (store) => store.put(entry));
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.withStore<undefined>('readwrite', (store) => store.delete(key));
  }

  async clearExpired(): Promise<void> {
    const now = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }

    const db = await this.getDb();
    if (!db) return;

    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('by-expiry');
      const request = index.openCursor(IDBKeyRange.upperBound(now));

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        cursor.delete();
        cursor.continue();
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  }
}
