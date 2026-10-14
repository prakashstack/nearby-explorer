import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Compass,
  MapPin,
  LocateFixed,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowUpDown,
  RefreshCw,
  X,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ModernHeroBanner } from '../components/ModernHeroBanner';
import { CategoryFilter } from '../components/CategoryFilter';
import { PlaceCard } from '../components/PlaceCard';
import { AlertBanner } from '../components/AlertBanner';
import { ApiKeysModal } from '../components/ApiKeysModal';
import {
  fetchNearbyPlaces,
  reverseGeocode,
  extractCategoriesFromPlaces,
} from '../services/geoapify';
import { getGeoapifyKey, getGeminiKey, subscribeKeys } from '../services/apiKeys';

const SEARCH_CATEGORY_ALIASES = {
  'street food': ['food', 'fast food', 'restaurant', 'cafe', 'bakery', 'catering'],
};

const normalizeSearchText = (value = '') =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function HomePage({ favorites = [], onToggleFavorite, onUserCoordsChange }) {
  // Coordinates (default to user's location, fallback initially)
  const [coords, setCoords] = useState({ lat: 22.8841, lon: 72.6738 }); // Barejadi default coords
  const [cityName, setCityName] = useState('Barejadi');
  const [locationInfo, setLocationInfo] = useState({
    displayName: 'Barejadi',
    village: 'Barejadi',
    city: 'Ahmedabad',
    district: 'Ahmedabad District',
    state: 'Gujarat',
    postcode: '382435',
    country: 'India',
    formattedAddress: 'Barejadi, Daskroi, Ahmedabad District, Gujarat, 382435, India',
  });
  const [locating, setLocating] = useState(false);
  const [reverseGeocodeLoading, setReverseGeocodeLoading] = useState(true);
  const [gpsError, setGpsError] = useState(null);

  // Search & Filter controls: Default 20 km radius!
  const [radiusKm, setRadiusKm] = useState(20);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'rating'
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Places state
  const [places, setPlaces] = useState([]);
  const [reverseGeocodeResponse, setReverseGeocodeResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Keys modal
  const [isKeysModalOpen, setIsKeysModalOpen] = useState(false);
  const [keys, setKeys] = useState({
    geoapifyKey: getGeoapifyKey(),
    geminiKey: getGeminiKey(),
  });

  // Subscribe to API key changes
  useEffect(() => {
    const unsubscribe = subscribeKeys((newKeys) => {
      setKeys(newKeys);
    });
    return unsubscribe;
  }, []);

  // Request browser Geolocation on load as FIRST PRIORITY
  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      setReverseGeocodeLoading(false);
      return;
    }

    setLocating(true);
    setReverseGeocodeLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        setCoords(newCoords);
        onUserCoordsChange?.(newCoords);
        setLocating(false);

        // Reverse geocode to find exact village, pincode, full address
        const { locationInfo: detectedInfo, thirdPartyApiResponse } = await reverseGeocode({
          lat: newCoords.lat,
          lon: newCoords.lon,
          apiKey: keys.geoapifyKey,
        });

        setLocationInfo(detectedInfo);
        setCityName(detectedInfo.displayName || 'Current Location');
        setReverseGeocodeResponse(thirdPartyApiResponse);
        setReverseGeocodeLoading(false);
      },
      (err) => {
        console.warn('Geolocation denied or timed out:', err);
        setLocating(false);
        setReverseGeocodeLoading(false);
        setGpsError('GPS access denied. Using detected location.');
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    requestGeolocation();
  }, [keys.geoapifyKey]);

  // Fetch places from Geoapify API when location, radius, or API key changes
  const loadPlaces = async () => {
    setLoading(true);
    setApiError(null);

    try {
      const res = await fetchNearbyPlaces({
        lat: coords.lat,
        lon: coords.lon,
        radiusKm,
        apiKey: keys.geoapifyKey,
      });
      setPlaces(res.places || []);
      setPlaces(res.places || []);
      setIsDemoData(Boolean(res.isDemo));
      if (res.error) setApiError(res.error);
    } catch (err) {
      console.error('Failed to load places:', err);
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaces();
  }, [coords.lat, coords.lon, radiusKm, keys.geoapifyKey]);

  // Extract dynamic categories directly from the API response
  const dynamicCategories = useMemo(() => {
    return extractCategoriesFromPlaces(places);
  }, [places]);

  // Reset selected category to 'all' if category no longer exists in current response
  useEffect(() => {
    if (
      selectedCategory !== 'all' &&
      !dynamicCategories.some((c) => c.id === selectedCategory)
    ) {
      setSelectedCategory('all');
    }
  }, [dynamicCategories, selectedCategory]);

  // Filter & sort places in-memory from cached API response
  const displayedPlaces = useMemo(() => {
    let list = showOnlyFavorites ? favorites : places;

    // Filter by dynamic category derived from API response
    if (selectedCategory !== 'all') {
      list = list.filter(
        (p) =>
          p.categorySlug === selectedCategory ||
          (p.rawCategories && p.rawCategories.includes(selectedCategory))
      );
    }

    // Filter by text search query
    if (searchQuery.trim()) {
      const q = normalizeSearchText(searchQuery);
      const categoryTerms = SEARCH_CATEGORY_ALIASES[q] || [];
      list = list.filter(
        (p) => {
          const searchableText = normalizeSearchText([
            p.name,
            p.category,
            p.categorySlug,
            p.address,
            ...(p.rawCategories || []),
          ].join(' '));
          return searchableText.includes(q) || categoryTerms.some((term) =>
            searchableText.includes(normalizeSearchText(term))
          );
        }
      );
    }

    // Sort by distance or rating
    return [...list].sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });
  }, [places, favorites, showOnlyFavorites, selectedCategory, searchQuery, sortBy]);

  const hasKeys = Boolean(keys.geoapifyKey && keys.geminiKey);
  const activeCategoryObj = dynamicCategories.find((c) => c.id === selectedCategory);
  const villageName = locationInfo.village || locationInfo.displayName || cityName;
  const hasSearchQuery = Boolean(searchQuery.trim());

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16 selection:bg-blue-600/40">
      {/* Background iOS blurred wallpaper orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-purple-600/15 blur-[130px]" />
        <div className="absolute bottom-10 left-1/4 w-80 h-80 rounded-full bg-teal-500/10 blur-[100px]" />
      </div>

      {/* Top iOS Frosted Navbar (Shows village below Nearby Explorer without iOS badge) */}
      <Navbar
        cityName={cityName}
        villageName={villageName}
        onOpenSettings={() => setIsKeysModalOpen(true)}
        hasKeysConfigured={hasKeys}
      />

      {/* Alert banner if keys not provided */}
      <AlertBanner
        hasGeoapify={Boolean(keys.geoapifyKey)}
        hasGemini={Boolean(keys.geminiKey)}
        onOpenSettings={() => setIsKeysModalOpen(true)}
      />

      <main className="relative z-10 max-w-4xl mx-auto px-4 pt-4 space-y-5">
        {/* Modern Hero Banner with Full Current Address, Pincode, and AI Local Suggestions */}
        <ModernHeroBanner
          locationInfo={locationInfo}
          coords={coords}
          radiusKm={radiusKm}
          reverseGeocodeResponse={reverseGeocodeResponse}
          reverseGeocodeLoading={reverseGeocodeLoading}
          onSelectSuggestionTag={(tag) => setSearchQuery(tag)}
          onRefreshGps={requestGeolocation}
          locating={locating}
        />

        {/* Frosted Search Capsule & 20km Radius Control */}
        <div className="p-3 sm:p-4 rounded-3xl bg-white/10 dark:bg-white/5 backdrop-blur-2xl border border-white/20 shadow-xl space-y-3">
          {/* Top row: search venue text */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search local venues, food, temples, markets, or street..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/15 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded-full bg-white/10"
              >
                Clear
              </button>
            )}
          </div>

          {/* Bottom row: Kilometer Radius Capsule (Default 20km) */}
          <div className="flex flex-col gap-2.5 pt-1 border-t border-white/10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                Radius:
              </span>

              {/* Number Input with Stepper */}
              <div className="flex items-center bg-white/10 border border-white/20 rounded-full px-2 py-0.5 shadow-inner">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Math.max(1, Number(e.target.value) || 1))}
                  className="w-12 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                />
                <span className="text-xs text-slate-300 font-medium pr-1">km</span>
              </div>

            </div>

            {/* Keep every preset visible on narrow screens instead of overflowing. */}
            <div className="grid w-full grid-cols-5 gap-1 sm:flex sm:w-auto sm:items-center">
              {[5, 10, 20, 30, 50].map((km) => (
                <button
                  key={km}
                  onClick={() => setRadiusKm(km)}
                  className={`w-full rounded-full px-1.5 py-1 text-[11px] font-medium transition-all sm:w-auto sm:px-2 sm:py-0.5 ${
                    radiusKm === km
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>

            {/* iOS System Blue Search Button */}
            <button
              onClick={loadPlaces}
              disabled={loading}
              className="flex self-start items-center gap-2 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Search Radius</span>
            </button>
          </div>
        </div>

        {/* Dynamic Category Filter Carousel (Derived from API response) */}
        {dynamicCategories.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
                Categories in this area ({dynamicCategories.length})
              </span>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                >
                  <X className="w-3 h-3" />
                  Show All
                </button>
              )}
            </div>
            <CategoryFilter
              categories={dynamicCategories}
              selectedCategory={selectedCategory}
              totalCount={places.length}
              onSelectCategory={(catId) => setSelectedCategory(catId)}
            />
          </div>
        )}

        {/* Listing Header: Count, Filter Tabs, and Sort */}
        <div className="flex items-center justify-between pt-2 px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowOnlyFavorites(false);
                setSelectedCategory('all');
              }}
              className={`text-xs font-semibold px-3 py-1 rounded-full transition-all cursor-pointer ${
                !showOnlyFavorites && selectedCategory === 'all'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Places ({places.length})
            </button>

            {selectedCategory !== 'all' && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center gap-1.5">
                <span>{activeCategoryObj?.label || selectedCategory}</span>
                <span className="text-[10px] bg-blue-500/40 px-1.5 py-0.2 rounded-full">
                  {displayedPlaces.length}
                </span>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="hover:text-white"
                  aria-label="Clear category filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={() => setShowOnlyFavorites(true)}
              className={`text-xs font-semibold px-3 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                showOnlyFavorites
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Favorites ({favorites.length})
            </button>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1 text-xs text-slate-300">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="distance" className="bg-slate-900 text-white">Distance</option>
              <option value="rating" className="bg-slate-900 text-white">Rating</option>
            </select>
          </div>
        </div>

        {/* Places Listing Grid */}
        <div className="space-y-3">
          {loading ? (
            /* Loading skeletons */
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-3.5 bg-white/5 border border-white/10 flex items-center gap-3.5"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/5 animate-shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded-lg w-1/3 animate-shimmer" />
                  <div className="h-5 bg-white/15 rounded-lg w-2/3 animate-shimmer" />
                  <div className="h-3 bg-white/10 rounded-lg w-1/2 animate-shimmer" />
                </div>
              </div>
            ))
          ) : displayedPlaces.length === 0 ? (
            /* Empty State for current location */
            <div className="text-center py-12 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">
                {hasSearchQuery
                  ? `No places match "${searchQuery.trim()}"`
                  : selectedCategory !== 'all'
                  ? `No venues in category "${activeCategoryObj?.label || selectedCategory}"`
                  : `No places found within ${radiusKm} km of ${villageName}`}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                {hasSearchQuery
                  ? places.length > 0
                    ? `${places.length} places are available in this area, but none match your search.`
                    : `No places are currently available within ${radiusKm} km of ${villageName}.`
                  : selectedCategory !== 'all'
                  ? 'Switch back to "All" to view all available places or widen your search radius.'
                  : showOnlyFavorites
                  ? "You haven't saved any favorites yet. Tap the heart on any place card to add it."
                  : 'Try expanding your radius to 30 km or 50 km to discover more surrounding venues.'}
              </p>
              {hasSearchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setShowOnlyFavorites(false);
                  }}
                  className="mt-4 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold"
                >
                  View All Places ({places.length})
                </button>
              ) : selectedCategory !== 'all' ? (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="mt-4 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold"
                >
                  View All Places ({places.length})
                </button>
              ) : showOnlyFavorites ? (
                <button
                  onClick={() => setShowOnlyFavorites(false)}
                  className="mt-4 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold"
                >
                  View All Places
                </button>
              ) : (
                <button
                  onClick={() => {
                    setRadiusKm(30);
                  }}
                  className="mt-4 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/25"
                >
                  Expand to 30 km
                </button>
              )}
            </div>
          ) : (
            displayedPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                isFavorite={favorites.some((f) => f.id === place.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))
          )}
        </div>
      </main>

      {/* API Keys Configuration Modal */}
      <ApiKeysModal
        isOpen={isKeysModalOpen}
        onClose={() => setIsKeysModalOpen(false)}
      />
    </div>
  );
}
