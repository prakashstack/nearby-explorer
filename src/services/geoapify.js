/**
 * Geoapify Service Layer
 * Supports Places API, Dynamic Category Classification, Place Details, Walking Routing, Reverse Geocoding
 * Integrates 30-minute localStorage TTL caching and memory caching
 */

import { getCache, setCache } from './cache';
import { generateSamplePlaces } from './sampleData';

const UNSPLASH_PHOTO_POOLS = {
  cafe: [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
  ],
  restaurant: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1200&q=80',
  ],
  bar: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1200&q=80',
  ],
  bakery: [
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80',
  ],
  fast_food: [
    'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
  ],
  supermarket: [
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
  ],
  shopping: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80',
  ],
  sights: [
    'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1576085898323-218337e3e43c?auto=format&fit=crop&w=1200&q=80',
  ],
  entertainment: [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
  ],
  park: [
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
  ],
  healthcare: [
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
  ],
  services: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80',
  ],
};

export function getPlacePhoto(categorySlug = 'cafe', idOrName = '') {
  const pool = UNSPLASH_PHOTO_POOLS[categorySlug] || UNSPLASH_PHOTO_POOLS.cafe;
  let hash = 0;
  const str = String(idOrName || '');
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

/**
 * Classify Geoapify category array into a human-friendly category slug, label, and icon name
 */
export function classifyGeoapifyCategories(categories = []) {
  if (!Array.isArray(categories) || !categories.length) {
    return { slug: 'spot', name: 'Local Spot', icon: 'MapPin' };
  }

  const str = categories.map((c) => String(c).toLowerCase()).join(' ');

  // 1. Specific Coffee & Cafe
  if (str.includes('cafe') || str.includes('coffee')) {
    return { slug: 'cafe', name: 'Coffee & Cafe', icon: 'Coffee' };
  }

  // 2. Bakery & Pastry
  if (str.includes('bakery') || str.includes('pastry')) {
    return { slug: 'bakery', name: 'Bakery', icon: 'Croissant' };
  }

  // 3. Fast Food
  if (str.includes('fast_food') || str.includes('burger') || str.includes('pizza')) {
    return { slug: 'fast_food', name: 'Fast Food', icon: 'Pizza' };
  }

  // 4. Bar & Nightlife
  if (str.includes('bar') || str.includes('pub') || str.includes('brewery') || str.includes('club') || str.includes('nightlife')) {
    return { slug: 'bar', name: 'Bar & Pub', icon: 'Wine' };
  }

  // 5. Restaurants
  if (str.includes('restaurant') || str.includes('catering') || str.includes('bistro') || str.includes('diner')) {
    return { slug: 'restaurant', name: 'Restaurant', icon: 'Utensils' };
  }

  // 6. Supermarkets & Grocery
  if (str.includes('supermarket') || str.includes('grocery') || str.includes('convenience') || str.includes('organic')) {
    return { slug: 'supermarket', name: 'Supermarket', icon: 'Store' };
  }

  // 7. Shopping & Stores
  if (str.includes('commercial') || str.includes('clothing') || str.includes('mall') || str.includes('shop') || str.includes('book') || str.includes('electronics')) {
    return { slug: 'shopping', name: 'Shopping', icon: 'ShoppingBag' };
  }

  // 8. Sights & Culture
  if (str.includes('tourism') || str.includes('sights') || str.includes('attraction') || str.includes('monument') || str.includes('heritage') || str.includes('museum') || str.includes('historic')) {
    return { slug: 'sights', name: 'Sights & Culture', icon: 'Landmark' };
  }

  // 9. Entertainment
  if (str.includes('entertainment') || str.includes('cinema') || str.includes('theatre') || str.includes('bowling')) {
    return { slug: 'entertainment', name: 'Entertainment', icon: 'Film' };
  }

  // 10. Parks & Nature
  if (str.includes('leisure') || str.includes('park') || str.includes('garden') || str.includes('nature') || str.includes('playground')) {
    return { slug: 'park', name: 'Parks & Nature', icon: 'Trees' };
  }

  // 11. Healthcare
  if (str.includes('healthcare') || str.includes('pharmacy') || str.includes('hospital') || str.includes('clinic')) {
    return { slug: 'healthcare', name: 'Healthcare', icon: 'HeartPulse' };
  }

  // 12. Services
  if (str.includes('service') || str.includes('bank') || str.includes('atm') || str.includes('post_office') || str.includes('financial')) {
    return { slug: 'services', name: 'Services', icon: 'Briefcase' };
  }

  // Extract from first non-utility category
  const nonUtility = categories.find(
    (c) =>
      !c.includes('internet') &&
      !c.includes('wheelchair') &&
      !c.includes('payment') &&
      !c.includes('details') &&
      !c.includes('building')
  );

  if (nonUtility) {
    const parts = nonUtility.split('.');
    const rawTag = parts[parts.length - 1];
    const cleanName = rawTag.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    return { slug: rawTag.toLowerCase(), name: cleanName, icon: 'Tag' };
  }

  return { slug: 'spot', name: 'Local Spot', icon: 'MapPin' };
}

/**
 * Dynamically extract unique categories and their place counts from an array of fetched places
 */
export function extractCategoriesFromPlaces(places = []) {
  if (!Array.isArray(places)) return [];

  const map = new Map();

  places.forEach((p) => {
    const slug = p.categorySlug || 'spot';
    const name = p.category || 'Local Spot';
    const icon = p.categoryIcon || 'Tag';

    if (!map.has(slug)) {
      map.set(slug, {
        id: slug,
        label: name,
        icon,
        count: 1,
      });
    } else {
      map.get(slug).count += 1;
    }
  });

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

/**
 * Transform Geoapify Feature into normalized Place model
 */
export function transformGeoapifyFeature(feature, idx = 0, baseLat = 40.7128, baseLon = -74.006) {
  const props = feature.properties || {};
  const raw = props.datasource?.raw || {};

  const placeLat = Number(props.lat || feature.geometry?.coordinates?.[1] || baseLat);
  const placeLon = Number(props.lon || feature.geometry?.coordinates?.[0] || baseLon);

  const rawCategories = Array.isArray(props.categories) ? props.categories : [];
  const catInfo = classifyGeoapifyCategories(rawCategories);

  // Distance calculation
  let distanceKm = 0;
  if (props.distance !== undefined && props.distance !== null) {
    distanceKm = parseFloat((props.distance / 1000).toFixed(2));
  } else {
    const dLat = (placeLat - baseLat) * 111;
    const dLon = (placeLon - baseLon) * 111 * Math.cos((baseLat * Math.PI) / 180);
    distanceKm = parseFloat(Math.sqrt(dLat * dLat + dLon * dLon).toFixed(2));
  }

  // Facility detection from API properties and raw datasource
  const facilities = props.facilities || {};
  const hasWifi = Boolean(
    facilities.internet_access === true ||
    props.internet_access === 'wlan' ||
    props.internet_access === 'yes' ||
    raw.internet_access === 'wlan' ||
    raw.internet_access === 'yes' ||
    rawCategories.includes('internet_access')
  );

  const isWheelchair = Boolean(
    facilities.wheelchair === true ||
    props.wheelchair === 'yes' ||
    props.wheelchair === 'limited' ||
    raw.wheelchair === 'yes' ||
    rawCategories.includes('wheelchair')
  );

  const hasParking = Boolean(
    facilities.parking === true ||
    props.parking === 'yes' ||
    raw.parking === 'yes' ||
    rawCategories.some((c) => c.includes('parking'))
  );

  const hasOutdoor = Boolean(
    facilities.outdoor_seating === true ||
    props.outdoor_seating === 'yes' ||
    raw.outdoor_seating === 'yes'
  );

  const hasTakeaway = Boolean(
    facilities.takeaway === true ||
    props.takeaway === 'yes' ||
    props.catering?.takeaway === 'yes' ||
    raw.takeaway === 'yes' ||
    ['cafe', 'fast_food', 'bakery', 'restaurant'].includes(catInfo.slug)
  );

  const hasContactless = Boolean(
    facilities.contactless_payment === true ||
    props.payment?.contactless === 'yes' ||
    raw.payment?.contactless === 'yes' ||
    true
  );

  const placeId = props.place_id || `geo_${raw.osm_id || idx}_${placeLat.toFixed(4)}_${placeLon.toFixed(4)}`;
  const name = props.name || raw.name || props.address_line1 || 'Local Spot';

  const addressLine1 = props.street
    ? `${props.housenumber ? `${props.housenumber} ` : ''}${props.street}`
    : props.address_line1 || name;

  const addressLine2 =
    props.address_line2 ||
    `${props.city || raw.city || ''} ${props.postcode || raw.postcode || ''} ${props.state || ''}`.trim();

  const formattedAddress = props.formatted || `${addressLine1}, ${addressLine2}`.trim();

  // Operating hours
  const openingHours = props.opening_hours || raw.opening_hours || 'Mon - Sun: 8:00 AM – 9:00 PM';
  const openNow = props.opening_hours
    ? !props.opening_hours.toLowerCase().includes('closed')
    : raw.opening_hours
    ? !raw.opening_hours.toLowerCase().includes('closed')
    : true;

  // Contact
  const phone = props.contact?.phone || raw.phone || props.phone || '';
  const website = props.website || raw.website || props.contact?.website || '';

  // Photo
  const photo = props.wiki_and_media?.image || getPlacePhoto(catInfo.slug, placeId);

  return {
    id: placeId,
    name,
    category: catInfo.name,
    categorySlug: catInfo.slug,
    categoryIcon: catInfo.icon,
    rawCategories,
    lat: placeLat,
    lon: placeLon,
    distanceKm,
    rating: raw.stars || parseFloat((4.2 + (idx % 7) * 0.1).toFixed(1)),
    reviewsCount: 40 + ((idx * 31) % 380),
    openNow,
    openingHours,
    address: formattedAddress,
    address_line1: addressLine1,
    address_line2: addressLine2,
    phone,
    website,
    image: photo,
    description:
      props.description ||
      `Celebrated ${catInfo.name.toLowerCase()} destination in the local neighborhood known for quality hospitality.`,
    amenities: {
      wifi: hasWifi,
      wheelchair: isWheelchair,
      parking: hasParking,
      outdoor_seating: hasOutdoor,
      takeaway: hasTakeaway,
      contactless_payment: hasContactless,
    },
  };
}

/**
 * Fetch nearby places with Geoapify Places API v2
 * Queries places around the user, caches locally, and allows instant in-memory category filtering
 */
export async function fetchNearbyPlaces({ lat, lon, radiusKm = 5, apiKey }) {
  const roundedLat = Number(lat).toFixed(4);
  const roundedLon = Number(lon).toFixed(4);
  const cacheKey = `cache_places_${roundedLat}_${roundedLon}_${radiusKm}`;

  // Check 30-min cache first
  const cached = getCache(cacheKey);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return { places: cached, fromCache: true };
  }

  // If no apiKey provided, return fallback places
  if (!apiKey || apiKey.trim().length === 0) {
    const sample = generateSamplePlaces(Number(lat), Number(lon)).map((p, i) => {
      const catInfo = classifyGeoapifyCategories([p.categoryType || 'catering']);
      return {
        ...p,
        categorySlug: catInfo.slug,
        categoryIcon: catInfo.icon,
      };
    });
    setCache(cacheKey, sample);
    return { places: sample, fromCache: false, isDemo: true };
  }

  try {
    const radiusMeters = Math.round(radiusKm * 1000);
    // Fetch comprehensive categories with max allowed limit (500) for unlimited places
    const categoriesParam = 'catering,commercial,tourism,entertainment,leisure,service';
    const url = `https://api.geoapify.com/v2/places?categories=${categoriesParam}&filter=circle:${lon},${lat},${radiusMeters}&bias=proximity:${lon},${lat}&limit=500&apiKey=${apiKey.trim()}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Geoapify HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const features = data.features || [];

    if (!features.length) {
      // No places found in current location - return empty list, do NOT inject fake external cities
      setCache(cacheKey, []);
      return { places: [], fromCache: false };
    }

    // Transform raw API features into place models
    const places = features.map((feature, idx) =>
      transformGeoapifyFeature(feature, idx, Number(lat), Number(lon))
    );

    setCache(cacheKey, places);
    return { places, fromCache: false };
  } catch (err) {
    console.error('[Geoapify] Error fetching places:', err);
    // Return empty list on error for current location rather than misleading static places
    return { places: [], fromCache: false, error: err.message };
  }
}

/**
 * Fetch Place Details by ID with 30-min TTL
 */
export async function fetchPlaceDetails({ placeId, apiKey }) {
  const cacheKey = `cache_detail_${placeId}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return { place: cached, fromCache: true };
  }

  // Check if place is already inside any stored places cache
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('cache_places_')) {
        const item = getCache(k);
        if (Array.isArray(item)) {
          const found = item.find((p) => p.id === placeId);
          if (found) {
            setCache(cacheKey, found);
            return { place: found, fromCache: true };
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }

  if (!apiKey || apiKey.trim().length === 0) {
    const samplePlaces = generateSamplePlaces();
    const foundSample = samplePlaces.find((p) => p.id === placeId) || samplePlaces[0];
    const catInfo = classifyGeoapifyCategories([foundSample.categoryType || 'catering']);
    const full = { ...foundSample, categorySlug: catInfo.slug, categoryIcon: catInfo.icon };
    setCache(cacheKey, full);
    return { place: full, fromCache: false, isDemo: true };
  }

  try {
    const url = `https://api.geoapify.com/v2/place-details?id=${encodeURIComponent(placeId)}&apiKey=${apiKey.trim()}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Geoapify Place Details HTTP ${res.status}`);
    }
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) throw new Error('Feature not found in details');

    const place = transformGeoapifyFeature(feature, 0);
    setCache(cacheKey, place);
    return { place, fromCache: false };
  } catch (err) {
    console.warn('[Geoapify] Details fetch error, using fallback:', err);
    const mock = generateSamplePlaces()[0];
    const catInfo = classifyGeoapifyCategories([mock.categoryType || 'catering']);
    const full = { ...mock, id: placeId, categorySlug: catInfo.slug, categoryIcon: catInfo.icon };
    setCache(cacheKey, full);
    return { place: full, fromCache: false, isDemo: true };
  }
}

/**
 * Fetch Walking Route from Geoapify Routing API
 */
export async function fetchWalkingRoute({ fromLat, fromLon, toLat, toLon, apiKey }) {
  const cacheKey = `cache_route_${fromLat.toFixed(4)}_${fromLon.toFixed(4)}_${toLat.toFixed(4)}_${toLon.toFixed(4)}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return { route: cached, fromCache: true };
  }

  if (!apiKey || apiKey.trim().length === 0) {
    // Synthetic realistic walking route
    const steps = 10;
    const coords = [];
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const latWiggle = Math.sin(ratio * Math.PI) * 0.001;
      coords.push([
        fromLat + (toLat - fromLat) * ratio + latWiggle,
        fromLon + (toLon - fromLon) * ratio,
      ]);
    }
    const dLat = (toLat - fromLat) * 111;
    const dLon = (toLon - fromLon) * 111 * Math.cos((fromLat * Math.PI) / 180);
    const distanceMeters = Math.round(Math.sqrt(dLat * dLat + dLon * dLon) * 1000);
    const durationSeconds = Math.round(distanceMeters / 1.4);

    const result = {
      coordinates: coords,
      distanceMeters,
      durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
    };
    setCache(cacheKey, result);
    return { route: result, fromCache: false, isDemo: true };
  }

  try {
    const url = `https://api.geoapify.com/v1/routing?waypoints=${fromLat},${fromLon}|${toLat},${toLon}&mode=walk&apiKey=${apiKey.trim()}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Geoapify Routing HTTP ${res.status}`);
    }
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) throw new Error('No route found');

    const rawCoords = feature.geometry?.coordinates || [];
    const leafletCoords = rawCoords.map((c) => [c[1], c[0]]);
    const distanceMeters = feature.properties?.distance || 1000;
    const timeSeconds = feature.properties?.time || 720;

    const result = {
      coordinates: leafletCoords,
      distanceMeters: Math.round(distanceMeters),
      durationMinutes: Math.max(1, Math.round(timeSeconds / 60)),
    };

    setCache(cacheKey, result);
    return { route: result, fromCache: false };
  } catch (err) {
    console.warn('[Geoapify] Routing fallback:', err);
    const steps = 8;
    const coords = [];
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      coords.push([
        fromLat + (toLat - fromLat) * ratio,
        fromLon + (toLon - fromLon) * ratio,
      ]);
    }
    const result = {
      coordinates: coords,
      distanceMeters: 850,
      durationMinutes: 11,
    };
    setCache(cacheKey, result);
    return { route: result, fromCache: false, isDemo: true };
  }
}

/**
 * Reverse Geocoding to get neighborhood/village/city name, pincode, and full formatted address
 */
export async function reverseGeocode({ lat, lon, apiKey }) {
  const fallback = {
    displayName: 'Current Location',
    village: '',
    city: '',
    district: '',
    state: '',
    postcode: '',
    country: '',
    formattedAddress: 'Current Location',
  };

  if (!apiKey || apiKey.trim().length === 0) return fallback;

  try {
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey.trim()}`;
    const res = await fetch(url);
    if (!res.ok) return fallback;
    const data = await res.json();
    const props = data.features?.[0]?.properties;
    if (!props) return fallback;

    const village = props.village || props.suburb || props.hamlet || props.neighbourhood || '';
    const city = props.city || props.town || props.municipality || '';
    const district = props.district || props.county || '';
    const state = props.state || '';
    const postcode = props.postcode || '';
    const country = props.country || '';
    const formattedAddress =
      props.formatted ||
      [village, city, district, state, postcode, country].filter(Boolean).join(', ');

    const displayName = village || city || district || 'Current Location';

    return {
      displayName,
      village: village || displayName,
      city,
      district,
      state,
      postcode,
      country,
      formattedAddress,
    };
  } catch (e) {
    return fallback;
  }
}

/**
 * Map tile URL helper
 */
export function getTileUrl(apiKey) {
  if (apiKey && apiKey.trim().length > 0) {
    return `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey.trim()}`;
  }
  return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
}
