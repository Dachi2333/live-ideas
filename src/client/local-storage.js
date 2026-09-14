export const CAPTURE_KEY = "live-ideas:capture:v1";
export const FRAGMENTS_KEY = "live-ideas:fragments:v1";

const LEGACY_CAPTURE_KEY = "live-lyrics:capture:v1";
const LEGACY_FRAGMENTS_KEY = "live-lyrics:fragments:v1";

function safeParse(raw, fallback) {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function validCapture(value) {
  return value && typeof value.id === "string" && typeof value.text === "string";
}

function migrateKey(storage, { legacyKey, nextKey, isValid }) {
  const nextRaw = storage.getItem(nextKey);
  if (nextRaw != null) {
    storage.removeItem(legacyKey);
    return;
  }

  const legacyRaw = storage.getItem(legacyKey);
  if (legacyRaw == null) return;

  const legacyValue = safeParse(legacyRaw, null);
  if (!isValid(legacyValue)) return;

  storage.setItem(nextKey, legacyRaw);
  storage.removeItem(legacyKey);
}

function migrateLegacyStorage(storage) {
  migrateKey(storage, {
    legacyKey: LEGACY_CAPTURE_KEY,
    nextKey: CAPTURE_KEY,
    isValid: validCapture,
  });
  migrateKey(storage, {
    legacyKey: LEGACY_FRAGMENTS_KEY,
    nextKey: FRAGMENTS_KEY,
    isValid: Array.isArray,
  });
}

export function createBrowserPersistence(storage) {
  migrateLegacyStorage(storage);

  return {
    loadCapture() {
      const value = safeParse(storage.getItem(CAPTURE_KEY), null);
      return validCapture(value) ? value : null;
    },
    saveCapture(capture) {
      storage.setItem(CAPTURE_KEY, JSON.stringify(capture));
    },
    clearCapture() {
      storage.removeItem(CAPTURE_KEY);
    },
    fragments: {
      read() {
        const value = safeParse(storage.getItem(FRAGMENTS_KEY), []);
        return Array.isArray(value) ? value : [];
      },
      write(items) {
        storage.setItem(FRAGMENTS_KEY, JSON.stringify(items));
      },
    },
  };
}
