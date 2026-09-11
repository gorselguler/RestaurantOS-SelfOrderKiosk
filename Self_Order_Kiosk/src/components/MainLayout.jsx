import React, { useEffect, useState } from 'react';
import { useKiosk } from '../context/KioskContext';
import WelcomeScreen from './WelcomeScreen';
import KioskHeader from './KioskHeader';
import TopCategoryBar from './TopCategoryBar';
import ProductGrid from './ProductGrid';
import BottomCartBar from './BottomCartBar';
import ProductCustomizerModal from './ProductCustomizerModal';
import CartDrawerModal from './CartDrawerModal';
import OrderSuccessModal from './OrderSuccessModal';
import KioskDeviceLogin from './KioskDeviceLogin';
import SecretKioskSettingsModal from './SecretKioskSettingsModal';

// ── Splash / Loading Screen ────────────────────────────────────────────────────
// Shown after login while KioskContext is fetching menu data from Supabase.
// This fills the transition gap so the user never sees a blank screen.
function MenuLoadingSplash() {
  const { displayRestaurantName, restaurantLogoUrl } = useKiosk();
  const [dots, setDots] = useState('');

  // Animated ellipsis
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center select-none">

      {/* Background subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-6 px-8 text-center">

        {/* Logo or icon */}
        {restaurantLogoUrl ? (
          <img
            src={restaurantLogoUrl}
            alt={displayRestaurantName}
            className="w-24 h-24 rounded-2xl object-contain border border-white/10 shadow-2xl"
          />
        ) : (
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-2xl shadow-orange-500/30">
            <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 16C8 11.582 11.582 8 16 8h16c4.418 0 8 3.582 8 8v16c0 4.418-3.582 8-8 8H16c-4.418 0-8-3.582-8-8V16Z" fill="white" fillOpacity="0.2"/>
              <path d="M16 24h16M24 16v16" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
        )}

        {/* Restaurant name */}
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none">
            {displayRestaurantName || 'Restaurant OS'}
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-2">
            Self-Order Kiosk
          </p>
        </div>

        {/* Spinner + message */}
        <div className="flex flex-col items-center gap-3 mt-2">
          {/* Ring spinner */}
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-white/10" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" />
          </div>
          <p className="text-sm font-bold text-slate-300">
            Menü Yükleniyor{dots}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full animate-[loading-bar_2s_ease-in-out_infinite]" />
        </div>

      </div>

      {/* Bottom version tag */}
      <div className="absolute bottom-6 text-[11px] font-bold text-slate-600 tracking-widest uppercase">
        Restaurant OS · Kiosk
      </div>

      <style>{`
        @keyframes loading-bar {
          0%   { width: 10%; margin-left: 0%; }
          50%  { width: 60%; margin-left: 30%; }
          100% { width: 10%; margin-left: 80%; }
        }
      `}</style>
    </div>
  );
}

// ── Main Layout ────────────────────────────────────────────────────────────────
export default function MainLayout() {
  const {
    currentStep,
    restaurantId,
    menuLoading,
    showSecretSettings,
    setShowSecretSettings,
    setRestaurantId,
    setRestaurantName: setCtxRestaurantName,
    setCurrency: setCtxCurrency,
  } = useKiosk();

  const [showDeviceSetup, setShowDeviceSetup] = useState(false);

  // ── Login success handler ──────────────────────────────────────────────────
  // Called after KioskDeviceLogin finishes signInWithPassword + profile fetch.
  // We update the KioskContext restaurantId here so the context's useEffect
  // triggers fetchMenuFromSupabase automatically — no double-fetch.
  const handleLoginSuccess = (restaurantIdFromLogin) => {
    // KioskContext already reads from localStorage on mount; here we force-sync
    // the in-memory state to avoid waiting for initAuth() to re-run.
    if (restaurantIdFromLogin) {
      setCtxRestaurantName && setCtxRestaurantName(
        localStorage.getItem('kiosk_restaurant_name') || 'Restaurant OS'
      );
      setCtxCurrency && setCtxCurrency(
        localStorage.getItem('kiosk_currency') || 'PLN'
      );
      setRestaurantId(restaurantIdFromLogin);
    }
    setShowDeviceSetup(false);
  };

  // ── Show login screen if no restaurant linked ──────────────────────────────
  if (!restaurantId || showDeviceSetup) {
    return (
      <KioskDeviceLogin
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // ── Show splash screen while menu is being fetched ─────────────────────────
  if (menuLoading) {
    return <MenuLoadingSplash />;
  }

  // ── Main Kiosk UI ──────────────────────────────────────────────────────────
  return (
    <div className="w-full h-screen bg-slate-100 flex items-center justify-center p-0 md:p-4 overflow-hidden relative">
      <main className="relative w-full h-full max-w-[800px] bg-white md:rounded-[32px] md:shadow-2xl md:border-4 md:border-slate-300 flex flex-col overflow-hidden">

        {currentStep === 'welcome' ? (
          <WelcomeScreen />
        ) : (
          <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-50">
            {/* 1. Header (Sticky) */}
            <KioskHeader />

            {/* 2. Horizontal Scrollable Category Bar (Sticky) */}
            <TopCategoryBar />

            {/* 3. 2-Column Touch Grid (Scrollable) */}
            <ProductGrid />

            {/* 4. Fixed Bottom Cart Bar */}
            <BottomCartBar />
          </div>
        )}

        {/* Global Modals & Drawers — always mounted so they can animate out */}
        <ProductCustomizerModal />
        <CartDrawerModal />
        <OrderSuccessModal />
        <SecretKioskSettingsModal
          isOpen={showSecretSettings}
          onClose={() => setShowSecretSettings(false)}
        />

      </main>
    </div>
  );
}
