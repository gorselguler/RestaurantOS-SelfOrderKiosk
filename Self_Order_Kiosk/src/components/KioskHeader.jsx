import React from 'react';
import { useKiosk } from '../context/KioskContext';
import useLongPress from '../hooks/useLongPress';
import { Flame, Utensils, ShoppingBag, RotateCcw } from 'lucide-react';

export default function KioskHeader() {
  const { orderType, setOrderType, resetToWelcome, t, restaurantLogoUrl, setShowSecretSettings, displayRestaurantName } = useKiosk();

  const secretPressProps = useLongPress(() => {
    setShowSecretSettings(true);
  }, null, { delay: 3000 });

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm flex items-center justify-between gap-3">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2.5">
        <div 
          {...secretPressProps}
          className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center shadow-md shadow-brand-500/20 overflow-hidden touch-none select-none cursor-pointer"
        >
          {restaurantLogoUrl ? (
            <img src={restaurantLogoUrl} alt="Logo" className="w-full h-full object-cover" draggable={false} />
          ) : (
            <Flame className="w-6 h-6 text-white fill-white" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-900 leading-none uppercase">
              {displayRestaurantName}
            </h1>
            {/* Order Type Badge */}
            <button
              onClick={() => setOrderType(orderType === 'dine_in' ? 'takeaway' : 'dine_in')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 font-extrabold text-[11px] touch-press"
            >
              {orderType === 'dine_in' ? (
                <>
                  <Utensils className="w-3.5 h-3.5 text-brand-600" />
                  <span>{t('dine_in_badge')}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-brand-600" />
                  <span>{t('takeaway_badge')}</span>
                </>
              )}
            </button>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Self-Order Kiosk Terminal</span>
        </div>
      </div>

      {/* Right Controls: Reset */}
      <div className="flex items-center gap-2">

        {/* Reset / Return to Start */}
        <button
          onClick={resetToWelcome}
          className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 flex items-center justify-center touch-press"
          title="Başa Dön"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
