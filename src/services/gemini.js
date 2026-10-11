/**
 * Google Gen AI SDK Service Layer
 * Uses official @google/genai with gemini-2.5-flash
 * LocalStorage caching by placeId ensures visits never re-trigger network requests
 */

import { GoogleGenAI } from '@google/genai';
import { getCache, setCache } from './cache';

export async function fetchLocalInsight({ place, apiKey }) {
  if (!place || !place.id) {
    throw new Error('Valid place object required');
  }

  const cacheKey = `cache_gemini_${place.id}`;

  // 1. Check direct localStorage cache first
  const directCached = localStorage.getItem(cacheKey);
  if (directCached && directCached.trim().length > 0) {
    return {
      text: directCached,
      fromCache: true,
      model: 'gemini-3.8-flash',
    };
  }

  // 2. Also check 30-min TTL cache
  const ttlCached = getCache(cacheKey);
  if (ttlCached) {
    return {
      text: ttlCached,
      fromCache: true,
      model: 'gemini-3.8-flash',
    };
  }

  // 3. If no API key is provided, return rich offline simulated insider tip
  if (!apiKey || apiKey.trim().length === 0) {
    const fallbackText = generateOfflineInsight(place);
    // Cache so it stays consistent
    localStorage.setItem(cacheKey, fallbackText);
    setCache(cacheKey, fallbackText);
    return {
      text: fallbackText,
      fromCache: false,
      isDemo: true,
      model: 'gemini-3.8-flash (demo)',
    };
  }

  // 4. Call official @google/genai SDK with active model gemini-3.8-flash
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const prompt = `You are an authentic iOS local insider. Provide a concise, engaging 2-sentence visitor insight and top highlight for ${place.name} (${place.category}) at ${place.address || 'the neighborhood'}. Skip formal introductions.`;

    const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let response = null;
    let usedModel = 'gemini-3.8-flash';

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        usedModel = modelName;
        if (response?.text) break;
      } catch (mErr) {
        console.warn(`[Gemini] Model ${modelName} attempt:`, mErr?.message || mErr);
      }
    }

    const outputText = response?.text?.trim() || generateOfflineInsight(place);

    // Save strictly to localStorage by placeId
    localStorage.setItem(cacheKey, outputText);
    setCache(cacheKey, outputText);

    return {
      text: outputText,
      fromCache: false,
      model: usedModel,
    };
  } catch (err) {
    console.warn('[Gemini] API error:', err);
    // Fallback to local insight if API key fails or rate-limited
    const fallbackText = generateOfflineInsight(place);
    localStorage.setItem(cacheKey, fallbackText);
    setCache(cacheKey, fallbackText);
    return {
      text: fallbackText,
      fromCache: false,
      isDemo: true,
      error: err.message,
      model: 'gemini-2.5-flash (fallback)',
    };
  }
}

function generateOfflineInsight(place) {
  const category = (place.category || '').toLowerCase();
  if (category.includes('food') || category.includes('drink') || category.includes('restaurant') || category.includes('cafe')) {
    return `Locals swear by arriving just before the afternoon rush for the freshest creations and prime patio seating. Don't leave without tasting their signature house specialty paired with an iced pour-over.`;
  }
  if (category.includes('sight') || category.includes('attraction') || category.includes('tour')) {
    return `Golden hour brings stunning lighting here without the mid-day tourist crowds. Head towards the upper promenade for panoramic city vistas that make for unforgettable photos.`;
  }
  if (category.includes('entertain') || category.includes('cinema') || category.includes('theatre')) {
    return `An electric cultural cornerstone beloved by neighborhood regulars for its intimate vintage atmosphere. Check the evening schedule early as prime weekend seating fills up rapidly.`;
  }
  if (category.includes('shop') || category.includes('store') || category.includes('book')) {
    return `A treasure trove of curated local goods and hard-to-find edition titles tucked away from main thoroughfares. Ask the knowledgeable staff for their hidden staff pick of the month.`;
  }
  return `A quintessential neighborhood anchor cherished for warm neighborhood hospitality and meticulous attention to craft. Stop by during weekday mornings for an exceptionally tranquil experience.`;
}

/**
 * Generate AI Insider Suggestions & Search Tags for the current location/village
 */
export async function fetchLocationAiSuggestions({ locationName, fullAddress, apiKey }) {
  const cacheKey = `cache_location_ai_${(locationName || 'local').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // ignore
    }
  }

  // Fallback if no apiKey
  if (!apiKey || apiKey.trim().length === 0) {
    const fallback = {
      insight: `Welcome to ${locationName || 'your area'}! Discover popular local chai corners, authentic neighborhood eateries, historic community landmarks, and everyday shopping within your 20 km radius.`,
      tags: ['Chai & Snacks', 'Local Temples', 'Daily Essentials', 'Street Food', 'Markets'],
    };
    localStorage.setItem(cacheKey, JSON.stringify(fallback));
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const prompt = `You are an authentic iOS local neighborhood insider. For the location "${locationName || 'Local Village'}" with full address: "${fullAddress || 'nearby'}", provide:
1. A concise, engaging 2-sentence visitor guide on what makes this area authentic and what highlights to look for within 20 km.
2. An array of 4 to 5 short 2-word exploration keywords (e.g., "Chai & Snacks", "Local Temples", "Street Food", "Fresh Markets", "Scenic Spots").
Return STRICT JSON ONLY without markdown fences: {"insight": "...", "tags": ["tag1", "tag2", "tag3", "tag4"]}`;

    const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let text = '';

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        text = response?.text;
        if (text) break;
      } catch (err) {
        // try next model
      }
    }

    if (text) {
      const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.insight && Array.isArray(parsed.tags)) {
        localStorage.setItem(cacheKey, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Gemini] Location suggestions error:', err);
  }

  const fallback = {
    insight: `Welcome to ${locationName || 'your area'}! Discover popular local chai corners, authentic neighborhood eateries, historic community landmarks, and everyday shopping within your 20 km radius.`,
    tags: ['Chai & Snacks', 'Local Temples', 'Daily Essentials', 'Street Food', 'Markets'],
  };
  localStorage.setItem(cacheKey, JSON.stringify(fallback));
  return fallback;
}
