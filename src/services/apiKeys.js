/**
 * API Keys Management for Geoapify and Gemini
 * Reads from environment variables (import.meta.env) with user override support via localStorage
 */

const LISTENERS = new Set();

export function getGeoapifyKey() {
  const env = import.meta.env.VITE_GEOAPIFY_API_KEY;
  if (env && env.trim().length > 0) return env.trim();
  const custom = localStorage.getItem('custom_geoapify_key');
  if (custom && custom.trim().length > 0) return custom.trim();
  return '';
}

export function getGeminiKey() {
  const env = import.meta.env.VITE_GEMINI_API_KEY;
  if (env && env.trim().length > 0) return env.trim();
  const custom = localStorage.getItem('custom_gemini_key');
  if (custom && custom.trim().length > 0) return custom.trim();
  return '';
}

export function setCustomKeys(geoapifyKey, geminiKey) {
  if (geoapifyKey !== undefined) {
    if (geoapifyKey) localStorage.setItem('custom_geoapify_key', geoapifyKey.trim());
    else localStorage.removeItem('custom_geoapify_key');
  }
  if (geminiKey !== undefined) {
    if (geminiKey) localStorage.setItem('custom_gemini_key', geminiKey.trim());
    else localStorage.removeItem('custom_gemini_key');
  }
  notifyKeyChange();
}

export function subscribeKeys(callback) {
  LISTENERS.add(callback);
  return () => LISTENERS.delete(callback);
}

function notifyKeyChange() {
  const keys = {
    geoapifyKey: getGeoapifyKey(),
    geminiKey: getGeminiKey(),
  };
  LISTENERS.forEach((cb) => cb(keys));
}
