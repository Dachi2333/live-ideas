export const CAPTURE_KEY = "live-lyrics:capture:v1";
export const FRAGMENTS_KEY = "live-lyrics:fragments:v1";

function safeParse(raw, fallback) {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function createBrowserPersistence(storage) {
  return {
    loadCapture() {
      const value = safeParse(storage.getItem(CAPTURE_KEY), null);
      return value && typeof value.id === "string" && typeof value.text === "string" ? value : null;
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
