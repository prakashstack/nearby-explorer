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

  const cacheKey = `cache_gemini_guide_v3_${place.id}`;

  // 1. Read the TTL cache, and migrate any older plain-text cache entries.
  const ttlCached = getCache(cacheKey);
  if (ttlCached) {
    return {
      text: normalizeInsightText(ttlCached),
      fromCache: true,
      model: 'gemini-2.5-flash',
    };
  }

  const legacyCached = localStorage.getItem(cacheKey);
  if (legacyCached && !legacyCached.trim().startsWith('{')) {
    return {
      text: normalizeInsightText(legacyCached),
      fromCache: true,
      model: 'gemini-2.5-flash',
    };
  }

  // 2. Without a key, provide clearly labeled general guidance.
  if (!apiKey || apiKey.trim().length === 0) {
    const fallbackText = generateOfflineInsight(place);
    setCache(cacheKey, fallbackText);
    return {
      text: fallbackText,
      fromCache: false,
      isDemo: true,
      model: 'gemini-2.5-flash (demo)',
    };
  }

  // 3. Ask Gemini for a useful, grounded guide in a short paragraph format.
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const prompt = `Write a practical local visitor guide for this place.
Known place details:
- Name: ${place.name || 'Unknown'}
- Category: ${place.category || 'Unknown'}
- Address: ${place.address || 'Not provided'}

Write exactly 2 or 3 concise paragraphs, with 2 to 4 sentences per paragraph. Do not use numbering, bullets, headings, JSON, or markdown fences. Give practical visitor guidance that feels specific to the supplied place name, category, and location. Ground statements only in supplied details and general visitor advice; do not invent opening hours, prices, facilities, history, popularity, views, signature items, or nearby attractions. If a detail needs confirmation, say to check with the venue.`;

    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let response = null;
    let usedModel = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        usedModel = modelName;
        if (response?.text?.trim()) break;
        response = null;
      } catch (mErr) {
        console.warn(`[Gemini] Model ${modelName} attempt:`, mErr?.message || mErr);
      }
    }

    const outputText = response?.text?.trim();
    if (!outputText) {
      throw new Error('Gemini did not return a guide from any supported model');
    }

    const normalizedText = normalizeInsightText(outputText);
    setCache(cacheKey, normalizedText);

    return {
      text: normalizedText,
      fromCache: false,
      model: usedModel,
    };
  } catch (err) {
    console.warn('[Gemini] API error:', err);
    const fallbackText = generateOfflineInsight(place);
    setCache(cacheKey, fallbackText);
    return {
      text: fallbackText,
      fromCache: false,
      isDemo: true,
      error: err.message,
      model: 'Local guide (fallback)',
    };
  }
}

function normalizeInsightText(value) {
  let text = typeof value === 'string' ? value.trim() : '';

  for (let depth = 0; depth < 3 && text; depth += 1) {
    const unfencedText = text.replace(/^```(?:json|text)?\s*/i, '').replace(/\s*```$/, '').trim();
    if (unfencedText !== text) {
      text = unfencedText;
      continue;
    }

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'string') {
        text = parsed.trim();
        continue;
      }
      if (typeof parsed?.data === 'string') {
        text = parsed.data.trim();
        continue;
      }
      if (typeof parsed?.text === 'string') {
        text = parsed.text.trim();
        continue;
      }
      if (Array.isArray(parsed?.guide)) {
        text = parsed.guide.join('\n').trim();
        continue;
      }
      if (typeof parsed?.insight === 'string') {
        text = parsed.insight.trim();
        continue;
      }
    } catch {
      // The response is plain text rather than a JSON wrapper.
    }

    text = unfencedText.replace(/^["']|["']$/g, '').trim();
    break;
  }

  return text;
}

function generateOfflineInsight(place) {
  const name = place.name || 'This place';
  const category = place.category || 'local venue';
  const address = place.address || 'the listed address';
  return [
    `Before visiting ${name}, confirm its current opening hours and any visitor requirements with the venue. The available listing identifies it as a ${category.toLowerCase()} at ${address}, which can help you verify the correct destination and entrance.`,
    `Plan your transport and allow time to find the entrance when you arrive. Check locally for current services, accessibility, and any photography or access restrictions, since these details can change.`,
  ].join('\n\n');
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
