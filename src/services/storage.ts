type JsonGuard<T> = (value: unknown) => value is T;

const memoryStorage = new Map<string, string>();

export interface StorageWriteResult {
  ok: boolean;
  persisted: boolean;
  error?: unknown;
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isQuotaError(error: unknown) {
  return error instanceof DOMException
    && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
}

export function readStorageItem(key: string): string | null {
  const storage = getLocalStorage();

  if (storage) {
    try {
      const value = storage.getItem(key);
      if (value !== null) {
        memoryStorage.set(key, value);
        return value;
      }
    } catch {
      // Fall back to memory storage below.
    }
  }

  return memoryStorage.get(key) ?? null;
}

export function writeStorageItem(key: string, value: string): StorageWriteResult {
  memoryStorage.set(key, value);

  const storage = getLocalStorage();
  if (!storage) {
    return { ok: true, persisted: false };
  }

  try {
    storage.setItem(key, value);
    return { ok: true, persisted: true };
  } catch (error) {
    return {
      ok: !isQuotaError(error),
      persisted: false,
      error,
    };
  }
}

export function removeStorageItem(key: string): StorageWriteResult {
  memoryStorage.delete(key);

  const storage = getLocalStorage();
  if (!storage) {
    return { ok: true, persisted: false };
  }

  try {
    storage.removeItem(key);
    return { ok: true, persisted: true };
  } catch (error) {
    return { ok: false, persisted: false, error };
  }
}

export function removeStorageItemsByPrefix(prefix: string): StorageWriteResult {
  let ok = true;
  let persisted = false;
  let firstError: unknown;

  for (const key of Array.from(memoryStorage.keys())) {
    if (key.startsWith(prefix)) {
      memoryStorage.delete(key);
    }
  }

  const storage = getLocalStorage();
  if (!storage) {
    return { ok: true, persisted: false };
  }

  const keysToRemove: string[] = [];
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => storage.removeItem(key));
    persisted = true;
  } catch (error) {
    ok = false;
    firstError = error;
  }

  return { ok, persisted, error: firstError };
}

export function readJson<T>(key: string, fallback: T, guard?: JsonGuard<T>): T {
  const raw = readStorageItem(key);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return guard && !guard(parsed) ? fallback : parsed as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): StorageWriteResult {
  try {
    return writeStorageItem(key, JSON.stringify(value));
  } catch (error) {
    return { ok: false, persisted: false, error };
  }
}

export function createResilientStorage() {
  return {
    getItem: (key: string) => readStorageItem(key),
    setItem: (key: string, value: string) => {
      writeStorageItem(key, value);
    },
    removeItem: (key: string) => {
      removeStorageItem(key);
    },
  };
}
