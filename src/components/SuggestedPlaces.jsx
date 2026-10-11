import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronRight, Compass } from 'lucide-react';

export function SuggestedPlaces({ places = [], currentPlaceId, category = '' }) {
  const navigate = useNavigate();

  // Filter out the current place
  const filtered = places.filter((p) => p.id !== currentPlaceId);
  const displayPlaces = filtered.slice(0, 6);

  if (!displayPlaces.length) return null;

  const handleCardClick = (place) => {
    navigate(`/place/${encodeURIComponent(place.id)}`, { state: { place } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full mt-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            You Might Also Like
          </h3>
          <p className="text-xs text-slate-400">
            Similar venues in {category || 'this area'}
          </p>
        </div>
        <span className="text-[11px] text-blue-400 font-medium">Scroll to explore</span>
      </div>

      <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {displayPlaces.map((item) => (
          <div
            key={item.id}
            onClick={() => handleCardClick(item)}
            className="group flex-shrink-0 w-64 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/15 hover:border-white/25 p-3 cursor-pointer transition-all duration-200 active:scale-[0.98] shadow-lg shadow-black/20"
          >
            {/* Thumbnail */}
            <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-800 mb-2.5">
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Distance pill */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-white">
                {item.distanceKm !== undefined ? `${item.distanceKm} km` : 'Nearby'}
              </div>

              {/* Status indicator */}
              {item.openNow !== undefined && (
                <div
                  className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md border border-white/20"
                  style={{
                    backgroundColor: item.openNow ? 'rgba(52, 199, 89, 0.25)' : 'rgba(255, 59, 48, 0.25)',
                    color: item.openNow ? '#34C759' : '#FF3B30',
                  }}
                >
                  {item.openNow ? 'Open Now' : 'Closed'}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                {item.category}
              </span>
              <h4 className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                {item.name}
              </h4>
              <p className="text-xs text-slate-400 truncate">
                {item.address || item.address_line1 || 'Local Area'}
              </p>

              <div className="flex items-center justify-between pt-1 text-xs">
                {item.rating ? (
                  <div className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{item.rating}</span>
                  </div>
                ) : (
                  <span />
                )}
                <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-[11px] font-medium">
                  View <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
