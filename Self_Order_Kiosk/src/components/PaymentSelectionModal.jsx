import React, { useState } from 'react';
import { X, CreditCard, Banknote, Store } from 'lucide-react';
import { useKiosk } from '../context/KioskContext';

export default function PaymentSelectionModal({ isOpen, onClose, onPayCashier }) {
  const [showToast, setShowToast] = useState(false);
  const { t } = useKiosk();

  if (!isOpen) return null;

  const handleCardClick = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl p-8 flex flex-col items-center animate-slideUp">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center touch-press"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-20 h-20 rounded-3xl bg-brand-50 border-2 border-brand-100 flex items-center justify-center mb-6 text-brand-600">
          <Banknote className="w-10 h-10" />
        </div>

        <h2 className="text-3xl font-black text-slate-900 mb-2">Ödeme Yöntemi</h2>
        <p className="text-slate-500 font-medium text-center mb-8 max-w-sm">
          Siparişinizi tamamlamak için lütfen ödeme yönteminizi seçiniz.
        </p>

        <div className="w-full flex flex-col gap-4">
          <button
            onClick={() => {
              onClose();
              onPayCashier();
            }}
            className="w-full flex items-center justify-start p-6 rounded-2xl border-2 border-brand-200 bg-brand-50 hover:bg-brand-100 hover:border-brand-300 text-brand-900 active:scale-[0.98] transition-all touch-press group"
          >
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mr-5 shadow-sm group-hover:scale-110 transition-transform">
              <Store className="w-7 h-7 text-brand-600" />
            </div>
            <div className="text-left flex-1">
              <span className="block text-2xl font-black leading-tight">Kasada Öde</span>
              <span className="block text-sm font-bold text-brand-600/80 mt-1">Nakit veya kart ile</span>
            </div>
          </button>

          <button
            onClick={handleCardClick}
            className="relative overflow-hidden w-full flex items-center justify-start p-6 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 active:scale-[0.98] transition-all touch-press group"
          >
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mr-5 shadow-sm">
              <CreditCard className="w-7 h-7 text-slate-500" />
            </div>
            <div className="text-left flex-1">
              <span className="block text-2xl font-black leading-tight">Kredi Kartı</span>
              <span className="block text-sm font-bold text-slate-400 mt-1">Kiosk üzerinden</span>
            </div>
            
            {showToast && (
              <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center animate-fadeIn rounded-2xl">
                <span className="text-white font-black text-xl flex items-center gap-2">
                  Yakında... (Coming Soon)
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
