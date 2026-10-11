/**
 * Smart Caching Layer for Nearby Explorer
 * Strict 30-minute Time-To-Live (TTL) inside localStorage
 * Keys:
 * - cache_places_{lat}_{lon}_{radius}_{category}
 * - cache_detail_{placeId}
 * - cache_gemini_{placeId}
 * - cache_route_{fromLat}_{fromLon}_{toLat}_{toLon}
 */

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const { timestamp, data } = parsed;
    if (!timestamp || Date.now() - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`[Cache] Error reading key "${key}":`, err);
    return null;
  }
}

export function setCache(key, data) {
  try {
    const payload = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.warn(`[Cache] Error saving key "${key}":`, err);
    // If quota exceeded, clean up old cache entries
    try {
      cleanupOldCaches();
      localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (e) {
      // Ignore fallback failure
    }
  }
}

export function cleanupOldCaches() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('cache_') || key.startsWith('cache_gemini_'))) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (!item.timestamp || Date.now() - item.timestamp > CACHE_TTL_MS) {
            keysToRemove.push(key);
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('[Cache] Cleanup error:', e);
  }
}
