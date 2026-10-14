import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { getGeoapifyKey } from '../services/apiKeys';
import { fetchReverseGeocodeResponse } from '../services/geoapify';
import { getPlaceHomepageDetails } from '../services/homepageDetails';

export function AiLocalInsight({ place }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshRequest, setRefreshRequest] = useState(0);

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
  }, [place?.id, place?.lat, place?.lon, apiKey, refreshRequest]);

  return (
    <div className="w-full relative apple-intelligence-glow p-5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl bg-slate-900/40 border border-white/20">
      {/* Background ambient gradient glow */}
      <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-gradient-to-tr from-blue-500/20 to-teal-500/10 blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-0.5 shadow-md shadow-purple-500/20">
            <div className="w-full h-full bg-slate-950/70 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                A Little Local Insight
              </h3>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Local Guide
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Insights for {place?.name || 'this place'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshRequest((request) => request + 1)}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            title="Refresh local place details"
            aria-label="Refresh local place details"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
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
            {details?.lines?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {details.lines.map((line, index) => (
                  <span
                    key={`${line}-${index}`}
                    className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-medium text-white/90 border border-white/15"
                  >
                    {String(line)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
