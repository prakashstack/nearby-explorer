import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { getGeoapifyKey } from '../services/apiKeys';
import { fetchReverseGeocodeResponse } from '../services/geoapify';
import { getPlaceHomepageDetails } from '../services/homepageDetails';

export function AiLocalInsight({ place }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiKey = getGeoapifyKey();

  useEffect(() => {
    let isMounted = true;

    async function loadPlaceDetails() {
      if (
        !place?.id ||
        place.lat == null ||
        place.lon == null ||
        !Number.isFinite(Number(place.lat)) ||
        !Number.isFinite(Number(place.lon))
      ) {
        setDetails(null);
        setError('Location coordinates are not available for this place.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const reverseGeocodeResponse = await fetchReverseGeocodeResponse({
          lat: place.lat,
          lon: place.lon,
          apiKey,
        });
        const placeDetails = await getPlaceHomepageDetails(reverseGeocodeResponse);
        if (isMounted) setDetails(placeDetails);
      } catch (err) {
        console.error('Failed to load place-specific local details:', err);
        if (isMounted) setError('Could not load local details for this place at this time.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPlaceDetails();
    return () => {
      isMounted = false;
    };
  }, [place?.id, place?.lat, place?.lon, apiKey]);

  return (
    <div className="w-full relative apple-intelligence-glow p-5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl bg-slate-900/40 border border-white/20">
      {/* Background ambient gradient glow */}
      <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-gradient-to-tr from-blue-500/20 to-teal-500/10 blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-0.5 shadow-md shadow-purple-500/20">
            <div className="w-full h-full bg-slate-950/70 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-white">
                AI Local Insights
              </h3>
              <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/15 text-purple-200 border border-purple-400/30 shadow-sm shadow-purple-500/10">
                <Sparkles className="w-3 h-3 text-purple-300" />
                AI Place Guide
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Insights for {place?.name || 'this place'}</p>
          </div>
        </div>
      </div>

      {/* Insight Content */}
      <div className="relative z-10 mt-2">
        {loading ? (
          /* Shimmer Skeleton Loader */
          <div className="space-y-2.5 py-1">
            <div className="h-4 rounded-xl animate-shimmer w-full" />
            <div className="h-4 rounded-xl animate-shimmer w-5/6" />
            <div className="h-4 rounded-xl animate-shimmer w-3/4" />
          </div>
        ) : error ? (
          <p className="text-xs text-rose-300">{error}</p>
        ) : (
          <div className="space-y-3 text-sm sm:text-base font-normal text-slate-100 leading-relaxed tracking-normal selection:bg-purple-500/40">
            <p>{details?.summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}
