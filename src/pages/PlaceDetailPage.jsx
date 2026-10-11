import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Navigation,
  Phone,
  Globe,
  Share2,
  Clock,
  MapPin,
  Star,
  Sparkles,
  ArrowLeft,
  ChevronLeft,
  Heart,
  Check,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { MapView } from '../components/MapView';
import { IconCardGrid } from '../components/IconCardGrid';
import { AiLocalInsight } from '../components/AiLocalInsight';
import { SuggestedPlaces } from '../components/SuggestedPlaces';
import { fetchPlaceDetails, fetchNearbyPlaces } from '../services/geoapify';
import { getGeoapifyKey } from '../services/apiKeys';

export function PlaceDetailPage({ favorites = [], onToggleFavorite, userCoords }) {
  const { placeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [place, setPlace] = useState(location.state?.place || null);
  const [loading, setLoading] = useState(!location.state?.place);
  const [error, setError] = useState(null);
  const [nearbySuggestions, setNearbySuggestions] = useState([]);
  const [copied, setCopied] = useState(false);

  const apiKey = getGeoapifyKey();
  const isFavorite = favorites.some((f) => f.id === (place?.id || placeId));

  // Fetch venue details if not in location.state or to enrich details
  useEffect(() => {
    let isMounted = true;

    async function loadDetails() {
      if (!placeId) return;

      // If already provided via router state and matches current ID
      if (location.state?.place && location.state.place.id === placeId) {
        setPlace(location.state.place);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const { place: fetchedPlace } = await fetchPlaceDetails({
          placeId,
          apiKey,
        });

        if (isMounted) {
          setPlace((prev) => ({ ...(prev || {}), ...fetchedPlace }));
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load place details:', err);
        if (isMounted && !place) {
          setError('Could not load place details.');
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [placeId, apiKey]);

  // Load similar places for "You Might Also Like"
  useEffect(() => {
    async function loadSimilar() {
      if (!place?.lat || !place?.lon) return;

      try {
        const { places } = await fetchNearbyPlaces({
          lat: place.lat,
          lon: place.lon,
          radiusKm: 6,
          apiKey,
        });
        // Filter similar category in memory from cached API response
        const sameCategory = places.filter(
          (p) => p.id !== place.id && (p.categorySlug === place.categorySlug || p.category === place.category)
        );
        setNearbySuggestions(sameCategory.length > 0 ? sameCategory : places.filter((p) => p.id !== place.id));
      } catch (e) {
        // ignore
      }
    }

    if (place) {
      loadSimilar();
    }
  }, [place?.id, place?.lat, place?.lon, place?.categorySlug, apiKey]);

  // Quick Actions Handlers
  const handleDirections = () => {
    if (!place) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCall = () => {
    if (!place?.phone) return;
    window.location.href = `tel:${place.phone.replace(/[^0-9+]/g, '')}`;
  };

  const handleWebsite = () => {
    if (!place?.website) return;
    window.open(place.website, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    const shareData = {
      title: place?.name || 'Nearby Venue',
      text: `Check out ${place?.name || 'this venue'} on Nearby Explorer!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {
        // fallback
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar isDetail title="Loading venue..." />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="space-y-4 max-w-md w-full">
            <div className="h-64 rounded-3xl bg-white/5 animate-shimmer" />
            <div className="h-8 rounded-xl bg-white/10 w-2/3 animate-shimmer" />
            <div className="h-4 rounded-lg bg-white/5 w-1/2 animate-shimmer" />
            <div className="h-32 rounded-2xl bg-white/5 animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar isDetail title="Venue" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-4 text-rose-400">
            <MapPin className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Venue Not Found</h2>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6">
            We couldn't retrieve the requested place details. It may have moved or the ID is invalid.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 active:scale-95"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16 relative selection:bg-blue-600/40">
      {/* Background iOS blurred wallpaper orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 right-0 w-96 h-96 rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-purple-600/15 blur-[130px]" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-pink-500/10 blur-[100px]" />
      </div>

      {/* Top Frosted Navigation Bar */}
      <Navbar
        isDetail
        title={place.name}
        subtitle={place.category}
        isFavorite={isFavorite}
        onToggleFavorite={() => onToggleFavorite(place)}
        place={place}
      />

      <main className="relative z-10 max-w-3xl mx-auto px-4 pt-4 space-y-6">
        {/* 1. Parallax Hero Banner */}
        <section className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900">
          {/* Hero Image */}
          <div className="relative h-72 sm:h-96 w-full overflow-hidden">
            <img
              src={place.image}
              alt={place.name}
              className="w-full h-full object-cover"
            />
            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-transparent" />

            {/* Top Badge overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-md">
                {place.category || 'Spot'}
              </span>

              {place.openNow !== undefined && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border border-white/20 shadow-md inline-flex items-center gap-1.5"
                  style={{
                    backgroundColor: place.openNow
                      ? 'rgba(52, 199, 89, 0.25)'
                      : 'rgba(255, 59, 48, 0.25)',
                    color: place.openNow ? '#34C759' : '#FF3B30',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: place.openNow ? '#34C759' : '#FF3B30' }}
                  />
                  {place.openNow ? 'Open Now' : 'Closed'}
                </span>
              )}
            </div>

            {/* Content pinned to bottom of banner */}
            <div className="absolute bottom-5 left-5 right-5 space-y-2">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                {place.rating && (
                  <div className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{place.rating}</span>
                    {place.reviewsCount && (
                      <span className="text-slate-300 font-normal text-[11px]">
                        ({place.reviewsCount} reviews)
                      </span>
                    )}
                  </div>
                )}
                {place.distanceKm !== undefined && (
                  <span className="bg-black/50 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-md text-slate-200 text-[11px]">
                    {place.distanceKm} km away
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
                {place.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-200/90 flex items-center gap-1.5 drop-shadow">
                <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span>{place.address || place.address_line1}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Row: Circular glass buttons */}
          <div className="p-4 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-around gap-2">
            {/* Directions - Apple Blue */}
            <button
              onClick={handleDirections}
              className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-blue-600/90 group-hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/20 transition-all">
                <Navigation className="w-5 h-5 fill-white text-white" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200">Directions</span>
            </button>

            {/* Call - Green */}
            <button
              onClick={handleCall}
              className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-600/90 group-hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-white/20 transition-all">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200">Call</span>
            </button>

            {/* Website - Purple */}
            <button
              onClick={handleWebsite}
              className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-purple-600/90 group-hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 border border-white/20 transition-all">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200">Website</span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-white/15 group-hover:bg-white/25 text-white flex items-center justify-center shadow-md border border-white/20 transition-all">
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
              </div>
              <span className="text-[11px] font-semibold text-slate-200">
                {copied ? 'Copied' : 'Share'}
              </span>
            </button>
          </div>
        </section>

        {/* 2. MapView Component with Geoapify walking route */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Location & Walking Route
            </h3>
            <span className="text-[11px] text-blue-400 font-medium">OSM Bright Tiles</span>
          </div>

          <MapView place={place} userCoords={userCoords} />
        </section>

        {/* 3. Facility & Amenity Icon Cards (Grid) */}
        <section>
          <IconCardGrid amenities={place.amenities} />
        </section>

        {/* 4. "A little local insight" AI Guide Card (Gemini 2.5 Flash) */}
        <section>
          <AiLocalInsight place={place} />
        </section>

        {/* Venue About & Hours Card */}
        <section className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-1.5">About this Place</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {place.description ||
                'A premier neighborhood spot offering curated experiences, warm ambience, and authentic local flair.'}
            </p>
          </div>

          <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-white block">Operating Hours</span>
                <span className="text-slate-400">{place.openingHours || 'Daily: 8:00 AM – 9:00 PM'}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-white block">Full Address</span>
                <span className="text-slate-400">{place.address}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Similar & Suggested Places Carousel ("You Might Also Like") */}
        <section>
          <SuggestedPlaces
            places={nearbySuggestions}
            currentPlaceId={place.id}
            category={place.category}
          />
        </section>
      </main>
    </div>
  );
}
