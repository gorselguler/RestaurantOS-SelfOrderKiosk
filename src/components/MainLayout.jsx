import React from 'react';
import { useKiosk } from '../context/KioskContext';
import WelcomeScreen from './WelcomeScreen';
import KioskHeader from './KioskHeader';
import TopCategoryBar from './TopCategoryBar';
import ProductGrid from './ProductGrid';
import BottomCartBar from './BottomCartBar';
import ProductCustomizerModal from './ProductCustomizerModal';
import CartDrawerModal from './CartDrawerModal';
import OrderSuccessModal from './OrderSuccessModal';

export default function MainLayout() {
  const { currentStep } = useKiosk();

  return (
    <div className="w-full h-screen bg-slate-950 flex items-center justify-center p-0 md:p-4 overflow-hidden">
      {/* 
        Portrait Tablet Kiosk Container 
        Standard vertical tablet aspect ratio: max-w-md / max-w-lg (e.g., 768px x 1024px)
      */}
      <main className="relative w-full h-full max-w-[800px] bg-slate-50 md:rounded-[32px] md:shadow-2xl md:border-4 md:border-slate-800 flex flex-col overflow-hidden">
        {currentStep === 'welcome' ? (
          <WelcomeScreen />
        ) : (
          <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-50">
            {/* 1. Header (Sticky) */}
            <KioskHeader />

            {/* 2. Horizontal Scrollable Categories (Sticky) */}
            <TopCategoryBar />

            {/* 3. 2-Column Touch Grid Products (Scrollable) */}
            <ProductGrid />

            {/* 4. Fixed Bottom Cart Bar */}
            <BottomCartBar />
          </div>
        )}

        {/* Global Modals & Drawers */}
        <ProductCustomizerModal />
        <CartDrawerModal />
        <OrderSuccessModal />
      </main>
    </div>
  );
}
