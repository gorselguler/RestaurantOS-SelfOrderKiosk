import React from 'react';
import { useKiosk } from '../context/KioskContext';
import {
  UtensilsCrossed,
  CookingPot,
  Flame,
  CupSoda,
  CakeSlice,
  Sparkles,
} from 'lucide-react';

const iconMap = {
  UtensilsCrossed,
  CookingPot,
  Flame,
  CupSoda,
  CakeSlice,
  Sparkles,
};

export default function TopCategoryBar() {
  const { categories, selectedCategory, setSelectedCategory, l } = useKiosk();

  return (
    <div className="sticky top-[65px] z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-1 scroll-smooth">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const IconComponent = iconMap[cat.icon] || UtensilsCrossed;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-sm tracking-tight transition-all duration-200 touch-press ${
                isSelected
                  ? 'bg-gradient-to-r from-brand-600 to-amber-500 text-white shadow-lg shadow-brand-500/30 scale-[1.02] border-transparent ring-2 ring-brand-400/40'
                  : 'bg-slate-100/90 hover:bg-slate-200/90 text-slate-700 border border-slate-200/60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-700 shadow-xs'
                }`}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <span className="whitespace-nowrap font-extrabold">{l(cat.name)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
