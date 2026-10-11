import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Sparkles,
  LocateFixed,
  Compass,
  CheckCircle2,
  Tag,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { fetchLocationAiSuggestions } from '../services/gemini';
import { getGeminiKey } from '../services/apiKeys';

export function ModernHeroBanner({
  locationInfo = {},
  coords = {},
  radiusKm = 20,
  nearbyPlaces = [],
  placesLoading = false,
  onSelectSuggestionTag,
  onRefreshGps,
  locating = false,
}) {
  const [aiData, setAiData] = useState(null);
  const [loadingAi, setLoadingAi] = useState(true);

  const apiKey = getGeminiKey();
  const village = locationInfo.village || locationInfo.displayName || 'Current Location';
  const fullAddress = locationInfo.formattedAddress || 'Detecting address...';
  const pincode = locationInfo.postcode;
  const nearbyPlaceContext = useMemo(
    () =>
      nearbyPlaces
        .slice()
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
        .slice(0, 12)
        .map(({ name, category, distanceKm }) => ({ name, category, distanceKm })),
    [nearbyPlaces]
  );
  const nearbyPlaceContextKey = JSON.stringify(nearbyPlaceContext);

  useEffect(() => {
    let isMounted = true;

    async function loadAi() {
      if (placesLoading) {
        setLoadingAi(true);
        return;
      }

      if (!village || village === 'Current Location') {
        setLoadingAi(false);
        return;
      }

      setLoadingAi(true);
      try {
        const res = await fetchLocationAiSuggestions({
          locationName: village,
          fullAddress,
          nearbyPlaces: nearbyPlaceContext,
          radiusKm,
          apiKey,
        });

        if (isMounted) {
          setAiData(res);
          setLoadingAi(false);
        }
      } catch (e) {
        if (isMounted) setLoadingAi(false);
      }
    }

    loadAi();

    return () => {
      isMounted = false;
    };
  }, [village, fullAddress, nearbyPlaceContext, nearbyPlaceContextKey, radiusKm, placesLoading, apiKey]);

  return (
    <section className="relative rounded-3xl p-5 sm:p-7 bg-white/10 dark:bg-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white transition-all">
      {/* Background ambient gradient orbs */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-500/20 blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-purple-500/20 blur-[100px] pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Meta Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live GPS Location
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 border border-white/15 text-slate-300 backdrop-blur-md">
              <Compass className="w-3 h-3 text-blue-400" />
              {radiusKm} km radius
            </span>
          </div>

          <div className="flex items-center gap-2">
            {coords.lat && coords.lon && (
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                {coords.lat.toFixed(4)}°, {coords.lon.toFixed(4)}°
              </span>
            )}

            <button
              onClick={onRefreshGps}
              disabled={locating}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-xs text-white/90 border border-white/15 backdrop-blur-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Refresh GPS"
            >
              <LocateFixed className={`w-3.5 h-3.5 ${locating ? 'animate-spin text-blue-400' : ''}`} />
              <span>{locating ? 'Locating...' : 'Refresh GPS'}</span>
            </button>
          </div>
        </div>

        {/* Large SF-style Heading */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Explore {village}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Current location is your primary discovery base. Discover local venues and spots within {radiusKm} km.
          </p>
        </div>

        {/* Full Current Address Card with Pincode */}
        <div className="rounded-2xl p-4 bg-black/40 backdrop-blur-xl border border-white/15 shadow-inner flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/25 border border-white/20">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 block">
                Current Registered Address
              </span>
              <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed break-words">
                {fullAddress}
              </p>
            </div>
          </div>

          {/* Pincode and GPS status tag */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
            {pincode ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 shadow-sm">
                <span className="text-[10px] uppercase font-semibold text-blue-400">Pincode:</span>
                <span className="text-xs font-bold font-mono tracking-wider text-white">{pincode}</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                GPS Verified
              </div>
            )}
          </div>
        </div>

        {/* Current location introduction and nearby highlights */}
        <div className="apple-intelligence-glow p-4 rounded-2xl bg-slate-900/40 border border-white/15 backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-0.5 shadow-sm">
                <div className="w-full h-full bg-slate-950/80 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                About {village}
                <span className="text-[9px] uppercase font-semibold px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini 2.5 Flash
                </span>
              </h3>
            </div>
          </div>

          {loadingAi ? (
            <div className="space-y-2 py-1">
              <div className="h-3.5 rounded-lg animate-shimmer w-full" />
              <div className="h-3.5 rounded-lg animate-shimmer w-4/5" />
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {aiData?.insight || `Explore ${village} and its surroundings within ${radiusKm} km. Local highlights are being prepared from nearby places.`}
              </p>

              {/* Interactive AI Suggestion Tags */}
              {aiData?.tags && aiData.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mr-1">
                    Try searching:
                  </span>
                  {aiData.tags.map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectSuggestionTag && onSelectSuggestionTag(tag)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-medium text-white/90 border border-white/15 transition-all active:scale-95 cursor-pointer shadow-sm hover:border-purple-400/50"
                    >
                      <Tag className="w-2.5 h-2.5 text-purple-300" />
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
