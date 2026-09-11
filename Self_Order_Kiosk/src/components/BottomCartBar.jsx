import React from 'react';
import { useKiosk } from '../context/KioskContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function BottomCartBar() {
  const { cartSummary, setIsCartOpen, currency, t } = useKiosk();

  if (cartSummary.totalItems === 0) return null;

  const currencyCode = currency || t('currency') || 'PLN';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-stone-200/80 px-4 py-3 sm:py-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
        {/* Left Side: Cart Icon & Total info (Clickable to open drawer) */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-stone-100/80 touch-press text-left cursor-pointer transition-colors"
        >
          {/* Badge Cart Icon */}
          <div className="relative w-12 h-12 rounded-2xl bg-[#292524] flex items-center justify-center shadow-md">
            <ShoppingBag className="w-6 h-6 text-orange-400" />
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 rounded-full bg-[#C2410C] text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white">
              {cartSummary.totalItems}
            </span>
          </div>

          <div>
            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
              <span>{t('cart')}</span>
              <span className="text-stone-300">•</span>
              <span className="text-[#C2410C] font-extrabold">{t('view_cart')}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#292524] tracking-tight leading-none mt-0.5 font-mono">
              {cartSummary.totalPrice.toFixed(2)}{' '}
              <span className="text-sm font-bold text-stone-500">{currencyCode}</span>
            </div>
          </div>
        </button>

        {/* Right Side: Open Order Summary Drawer Button */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="flex-1 max-w-[240px] sm:max-w-[280px] h-13 sm:h-14 px-6 rounded-2xl bg-[#C2410C] hover:bg-orange-700 active:bg-orange-800 text-white font-black text-base shadow-lg shadow-[#C2410C]/30 flex items-center justify-center gap-2.5 touch-press transition-all cursor-pointer"
        >
          <span>{t('order_summary') || t('view_cart')}</span>
          <ArrowRight className="w-5 h-5 stroke-[3]" />
        </button>
      </div>
    </div>
  );
}
