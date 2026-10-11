import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Star, Heart } from 'lucide-react';

export function PlaceCard({ place, isFavorite = false, onToggleFavorite }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/place/${encodeURIComponent(place.id)}`, { state: { place } });
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(place);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative cursor-pointer rounded-2xl p-3.5 bg-white/5 hover:bg-white/10 backdrop-blur-2xl border border-white/15 hover:border-white/25 transition-all duration-200 active:scale-[0.99] shadow-lg shadow-black/20"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="flex items-center gap-3.5">
        {/* Left: Rounded squircle photo with floating distance tag */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-800 border border-white/15">
          <img
            src={place.image}
            alt={place.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          
          {/* Floating distance tag */}
          <div className="absolute bottom-1.5 left-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-semibold text-white/95 text-center truncate">
            {place.distanceKm !== undefined ? `${place.distanceKm} km` : 'Nearby'}
          </div>
        </div>

        {/* Middle: Title, star rating, category, open status */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10 truncate">
              {place.category || 'Spot'}
            </span>
            {place.openNow !== undefined && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-tight"
                style={{ color: place.openNow ? '#34C759' : '#FF3B30' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: place.openNow ? '#34C759' : '#FF3B30' }}
                />
                {place.openNow ? 'Open Now' : 'Closed'}
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight truncate group-hover:text-blue-300 transition-colors">
            {place.name}
          </h3>

          <p className="text-xs text-slate-400 truncate mt-0.5 mb-1.5">
            {place.address || place.address_line1 || 'Local Area'}
          </p>

          <div className="flex items-center gap-2 text-xs">
            {place.rating && (
              <div className="flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{place.rating}</span>
                {place.reviewsCount && (
                  <span className="text-slate-400 font-normal text-[11px]">
                    ({place.reviewsCount})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick actions & Chevron */}
        <div className="flex flex-col items-center justify-between self-stretch py-1 flex-shrink-0">
          <button
            onClick={handleFavoriteClick}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              isFavorite
                ? 'text-rose-500 fill-rose-500'
                : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Favorite"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
          </button>
          
          <div className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
