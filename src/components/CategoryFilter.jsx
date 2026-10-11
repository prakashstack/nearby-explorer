import React from 'react';
import {
  Layers,
  Coffee,
  Utensils,
  Wine,
  Pizza,
  Croissant,
  Store,
  ShoppingBag,
  Landmark,
  Film,
  Trees,
  HeartPulse,
  Briefcase,
  MapPin,
  Tag,
} from 'lucide-react';

const ICON_MAP = {
  Layers,
  Coffee,
  Utensils,
  Wine,
  Pizza,
  Croissant,
  Store,
  ShoppingBag,
  Landmark,
  Film,
  Trees,
  HeartPulse,
  Briefcase,
  MapPin,
  Tag,
};

export function CategoryFilter({
  categories = [],
  selectedCategory = 'all',
  totalCount = 0,
  onSelectCategory,
}) {
  return (
    <div className="w-full overflow-x-auto scrollbar-none py-1.5 px-0.5">
      <div className="flex items-center gap-2 min-w-max pb-1">
        {/* "All" dynamic capsule */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 active:scale-95 cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-white text-slate-950 shadow-md shadow-white/10 ring-1 ring-white'
              : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/15 backdrop-blur-md'
          }`}
        >
          <Layers
            className={`w-3.5 h-3.5 ${
              selectedCategory === 'all' ? 'text-blue-600' : 'text-slate-300'
            }`}
          />
          <span>All</span>
          {totalCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === 'all'
                  ? 'bg-slate-200 text-slate-900'
                  : 'bg-white/15 text-white/90'
              }`}
            >
              {totalCount}
            </span>
          )}
        </button>

        {/* Dynamic Category Capsules derived strictly from the API response */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const IconComponent = ICON_MAP[cat.icon] || Tag;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-white text-slate-950 shadow-md shadow-white/10 ring-1 ring-white'
                  : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/15 backdrop-blur-md'
              }`}
            >
              <IconComponent
                className={`w-3.5 h-3.5 transition-colors ${
                  isSelected ? 'text-blue-600' : 'text-slate-300'
                }`}
              />
              <span>{cat.label}</span>
              {cat.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-slate-200 text-slate-900'
                      : 'bg-white/15 text-white/90'
                  }`}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
