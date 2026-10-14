import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Sparkles,
  LocateFixed,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { getPlaceHomepageDetails } from '../services/homepageDetails';

export function ModernHeroBanner({
  locationInfo = {},
  coords = {},
  radiusKm = 20,
  reverseGeocodeResponse,
  reverseGeocodeLoading = false,
  onRefreshGps,
  locating = false,
}) {
  const [homepageDetails, setHomepageDetails] = useState(null);
  const [loadingAi, setLoadingAi] = useState(true);
  const [detailsError, setDetailsError] = useState(null);
  const village = locationInfo.village || locationInfo.displayName || 'Current Location';
  const fullAddress = locationInfo.formattedAddress || 'Detecting address...';
  const pincode = locationInfo.postcode;

  useEffect(() => {
    let isMounted = true;

    async function loadHomepageDetails() {
      if (reverseGeocodeLoading) {
        setHomepageDetails(null);
        setDetailsError(null);
        setLoadingAi(true);
        return;
      }

      if (!reverseGeocodeResponse) {
        setHomepageDetails(null);
        setDetailsError(
          'Local area details are unavailable. Enable location access and configure your Geoapify API key.'
        );
        setLoadingAi(false);
        return;
      }

      setLoadingAi(true);
      setDetailsError(null);
      try {
        const details = await getPlaceHomepageDetails(reverseGeocodeResponse);

        if (isMounted) {
          setHomepageDetails(details);
          setLoadingAi(false);
        }
      } catch (e) {
        if (isMounted) {
          console.error('Failed to fetch homepage details:', e);
          setDetailsError('Could not load local area details at this time.');
          setLoadingAi(false);
        }
      }
    }

    loadHomepageDetails();

    return () => {
      isMounted = false;
    };
  }, [reverseGeocodeResponse, reverseGeocodeLoading]);

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
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 shrink-0 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-0.5 shadow-md shadow-purple-500/20">
              <div className="w-full h-full bg-slate-950/80 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                About {village}
              </h3>
              <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/15 text-purple-200 border border-purple-400/30 shadow-sm shadow-purple-500/10">
                <Sparkles className="w-3 h-3 text-purple-300" />
                AI Local Guide
              </span>
            </div>
          </div>

          {loadingAi ? (
            <div className="space-y-2 py-1">
              <div className="h-3.5 rounded-lg animate-shimmer w-full" />
              <div className="h-3.5 rounded-lg animate-shimmer w-4/5" />
            </div>
          ) : (
            <div className="space-y-2.5">
              {detailsError ? (
                <p className="text-xs sm:text-sm text-rose-300">{detailsError}</p>
              ) : (
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {homepageDetails?.summary || `Explore ${village} and its surroundings within ${radiusKm} km. Local highlights are being prepared from nearby places.`}
                </p>
              )}

            </div>
          )}
        </div>
      </div>
    </section>
  );
}
