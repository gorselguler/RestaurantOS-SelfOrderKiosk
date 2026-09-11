import React, { useRef } from 'react';
import { useKiosk } from '../context/KioskContext';
import {
  UtensilsCrossed,
  CookingPot,
  Flame,
  CupSoda,
  CakeSlice,
  Sparkles,
  Layers,
  Coffee,
  Utensils,
  ChefHat,
} from 'lucide-react';

const iconMap = {
  UtensilsCrossed,
  CookingPot,
  Flame,
  CupSoda,
  CakeSlice,
  Sparkles,
  Layers,
  Coffee,
  Utensils,
  ChefHat,
};

export default function TopCategoryBar() {
  const { categories, selectedCategory, setSelectedCategory, l, t } = useKiosk();
  const scrollRef = useRef(null);

  const isAllSelected = !selectedCategory || selectedCategory === 'ALL';

  return (
    <div className="sticky top-[65px] z-20 bg-[#FAFAF9] border-b border-stone-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)]">
      {/* Fade edges hint for scroll */}
      <div className="relative">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#FAFAF9] to-transparent z-10 pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#FAFAF9] to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          className="flex items-center gap-2.5 overflow-x-auto no-scrollbar px-4 py-3 scroll-smooth"
        >
          {/* All Products Pill */}
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`
              flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full
              font-bold text-sm tracking-tight transition-all duration-200 touch-press
              ${isAllSelected
                ? 'bg-[#C2410C] text-white shadow-md shadow-[#C2410C]/30'
                : 'bg-white text-[#292524] border border-stone-200 hover:border-[#C2410C]/40 hover:bg-orange-50'
              }
            `}
          >
            <Sparkles className={`w-4 h-4 shrink-0 ${isAllSelected ? 'text-white' : 'text-[#C2410C]'}`} />
            <span className="whitespace-nowrap">{t('all_products')}</span>
          </button>

          {/* Category Pills */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const IconComponent = iconMap[cat.icon] || UtensilsCrossed;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full
                  font-bold text-sm tracking-tight transition-all duration-200 touch-press
                  ${isSelected
                    ? 'bg-[#C2410C] text-white shadow-md shadow-[#C2410C]/30'
                    : 'bg-white text-[#292524] border border-stone-200 hover:border-[#C2410C]/40 hover:bg-orange-50'
                  }
                `}
              >
                <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#C2410C]'}`} />
                <span className="whitespace-nowrap">{l(cat.name)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
