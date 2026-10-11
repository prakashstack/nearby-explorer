import React from 'react';
import {
  Wifi,
  Accessibility,
  Car,
  Sun,
  ShoppingBag,
  CreditCard,
  Check,
  Minus,
} from 'lucide-react';

export function IconCardGrid({ amenities = {} }) {
  const items = [
    {
      id: 'wifi',
      title: 'WiFi Access',
      icon: Wifi,
      available: Boolean(amenities.wifi),
      color: '#007AFF', // Apple Blue
    },
    {
      id: 'accessibility',
      title: 'Wheelchair Friendly',
      icon: Accessibility,
      available: Boolean(amenities.wheelchair),
      color: '#34C759', // Apple Green
    },
    {
      id: 'parking',
      title: 'Parking Available',
      icon: Car,
      available: Boolean(amenities.parking),
      color: '#AF52DE', // Apple Purple
    },
    {
      id: 'outdoor',
      title: 'Outdoor Seating',
      icon: Sun,
      available: Boolean(amenities.outdoor_seating),
      color: '#FF9500', // Apple Orange
    },
    {
      id: 'takeaway',
      title: 'Takeaway / Delivery',
      icon: ShoppingBag,
      available: Boolean(amenities.takeaway),
      color: '#FF2D55', // Apple Pink
    },
    {
      id: 'contactless',
      title: 'Contactless Pay',
      icon: CreditCard,
      available: Boolean(amenities.contactless_payment),
      color: '#5856D6', // Apple Indigo
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Facilities & Amenities
        </h3>
        <span className="text-[11px] text-slate-500">Live verified</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {items.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              className="rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/10 p-3.5 flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 hover:border-white/25 hover:bg-white/10"
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border border-white/15 shadow-sm transition-transform group-hover:scale-105"
                style={{
                  backgroundColor: item.available ? `${item.color}20` : 'rgba(255,255,255,0.05)',
                  color: item.available ? item.color : '#94a3b8',
                }}
              >
                <IconComponent className="w-5 h-5" />
              </div>

              <span className="text-xs font-medium text-white/90 leading-tight">
                {item.title}
              </span>

              <div className="flex items-center gap-1 mt-0.5">
                {item.available ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Check className="w-2.5 h-2.5" />
                    Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                    <Minus className="w-2.5 h-2.5" />
                    Unspecified
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
