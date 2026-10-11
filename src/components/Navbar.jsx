import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Heart, MapPin, Check } from 'lucide-react';
import { getShareUrl } from '../services/shareUrl';

export function Navbar({
  title,
  subtitle,
  isDetail = false,
  isFavorite = false,
  onToggleFavorite,
  place = null,
  cityName = '',
  villageName = '',
}) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!place && !isDetail) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Nearby Explorer',
            text: 'Discover hidden gems and venues near you with Apple iOS glass design!',
            url: getShareUrl(),
          });
          return;
        } catch (e) {
          // ignore abort
        }
      }
      return;
    }

    const shareData = {
      title: place?.name || 'Nearby Explorer',
      text: `Check out ${place?.name || 'this venue'} on Nearby Explorer! ${place?.category ? `(${place.category})` : ''}`,
      url: getShareUrl(),
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-slate-950/70 border-b border-white/10 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left Side: Back Chevron or App Brand */}
        <div className="flex items-center gap-3">
          {isDetail ? (
            <>
              <button
                onClick={() => navigate('/')}
                className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20 transition-transform active:scale-95"
                aria-label="Go to Nearby Explorer home"
                title="Nearby Explorer home"
              >
                <MapPin className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => navigate(-1)}
                className="group flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors active:scale-95 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
                aria-label="Back to Explore"
              >
                <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
                <span className="text-sm font-semibold tracking-tight">Explore</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white">
                  Nearby Explorer
                </h1>
                {(villageName || cityName) && (
                  <p className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{villageName || cityName}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Center Title in Detail Mode */}
        {isDetail && title && (
          <div className="hidden sm:block max-w-[240px] truncate text-center">
            <h2 className="text-sm font-semibold text-white/90 truncate">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
          </div>
        )}

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2">
          {isDetail && (
            <>
              {/* Favorite Button */}
              <button
                onClick={onToggleFavorite}
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 active:scale-90 ${
                  isFavorite
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-sm shadow-rose-500/30'
                    : 'bg-white/10 border-white/15 text-white/80 hover:text-white hover:bg-white/15'
                }`}
                title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                aria-label="Toggle favorite"
              >
                <Heart
                  className={`w-4 h-4 transition-transform ${isFavorite ? 'fill-rose-500 text-rose-500 scale-110' : ''}`}
                />
              </button>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-white/10 border border-white/15 text-white/80 hover:text-white hover:bg-white/15 flex items-center justify-center transition-all duration-200 active:scale-90"
                title="Share place"
                aria-label="Share place"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </div>

      {copied && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 mt-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-300 text-xs font-medium shadow-xl backdrop-blur-xl animate-fade-in flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" />
          Link copied to clipboard!
        </div>
      )}
    </header>
  );
}
