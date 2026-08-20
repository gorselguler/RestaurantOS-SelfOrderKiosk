import React from 'react';
import { useKiosk } from '../context/KioskContext';
import { languages } from '../data/translations';
import { Utensils, ShoppingBag, Sparkles, Flame, ChevronRight } from 'lucide-react';

export default function WelcomeScreen() {
  const { language, setLanguage, startOrder, t } = useKiosk();

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-white text-slate-900 select-none">
      {/* Background Image with Soft Light Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop&q=80"
          alt="Delicious Kebab"
          className="w-full h-full object-cover object-center opacity-10 scale-105 transform animate-pulse-fast duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/70 via-white/80 to-white" />
      </div>

      {/* Middle Interactive Zone - Big Order Type Buttons */}
      <div className="relative z-10 px-8 py-6 flex flex-col items-center gap-6 w-full max-w-lg mx-auto mt-auto mb-4">
        <div className="w-full text-center flex flex-col items-center">
          {/* Logo Container (No Frame, for transparent PNG) */}
          <div className="w-full mb-8 flex items-center justify-center">
            <img
              src="/welcome.jpg"
              alt="Restaurant Logo"
              className="w-full max-w-md h-auto object-contain rounded-2xl drop-shadow-md"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 drop-shadow-sm mb-2">
            {t('welcome_title')}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-medium max-w-md mb-6">
            {t('welcome_subtitle')}
          </p>
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand-700 bg-brand-50 px-4 py-1.5 rounded-full border border-brand-200 shadow-sm">
            {t('select_order_type')}
          </span>
        </div>

        {/* Order Type Dual Choice (Orange Theme, Fits on Screen) */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full mt-2">
          {/* Dine In */}
          <button
            onClick={() => startOrder('dine_in')}
            className="group relative flex flex-col items-center justify-center p-5 sm:p-6 rounded-[28px] bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 border-b-4 border-orange-700 shadow-lg shadow-orange-500/30 active:translate-y-1 active:border-b-0 active:mt-1 touch-press transition-all duration-200"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-4 group-hover:scale-110 group-active:scale-95 transition-transform duration-200 shadow-sm">
              <Utensils className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-sm" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
              {t('dine_in')}
            </span>
            <span className="text-xs sm:text-sm text-orange-100 text-center mt-1.5 font-medium leading-tight">
              {t('dine_in_desc')}
            </span>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-white bg-white/20 px-4 py-1.5 rounded-full border border-white/20 shadow-sm">
              <span>{t('add')}</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </button>

          {/* Takeaway */}
          <button
            onClick={() => startOrder('takeaway')}
            className="group relative flex flex-col items-center justify-center p-5 sm:p-6 rounded-[28px] bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 border-b-4 border-orange-700 shadow-lg shadow-orange-500/30 active:translate-y-1 active:border-b-0 active:mt-1 touch-press transition-all duration-200"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-4 group-hover:scale-110 group-active:scale-95 transition-transform duration-200 shadow-sm">
              <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-sm" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
              {t('takeaway')}
            </span>
            <span className="text-xs sm:text-sm text-orange-100 text-center mt-1.5 font-medium leading-tight">
              {t('takeaway_desc')}
            </span>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-white bg-white/20 px-4 py-1.5 rounded-full border border-white/20 shadow-sm">
              <span>{t('add')}</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Language Selector Bar - Light Theme */}
      <div className="relative z-10 pb-14 px-6 pt-4 bg-gradient-to-t from-white via-white/95 to-transparent border-t border-slate-100">
        <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex-1 py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 touch-press transition-all duration-200 ${isSelected
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 scale-105 border-2 border-brand-500'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'
                  }`}
              >
                <span className="text-2xl leading-none">{lang.flag}</span>
                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                  {lang.short}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

