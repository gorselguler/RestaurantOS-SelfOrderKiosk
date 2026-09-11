import React, { useEffect, useState } from 'react';
import { useKiosk } from '../context/KioskContext';
import confetti from 'canvas-confetti';
import { CheckCircle2, RotateCcw, Utensils, ShoppingBag, Receipt, Sparkles } from 'lucide-react';

export default function OrderSuccessModal() {
  const { orderSuccessData, resetToWelcome, t, l } = useKiosk();
  const [countdown, setCountdown] = useState(12);

  useEffect(() => {
    if (!orderSuccessData) return;

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'],
      });
    } catch (e) {
      console.error(e);
    }

    setCountdown(12);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          resetToWelcome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [orderSuccessData]);

  if (!orderSuccessData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col items-center text-center p-6 sm:p-8">
        {/* Top Success Badge */}
        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mb-4 animate-bounce">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>

        {/* Order Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {t('order_success_title')}
        </h2>

        {/* Large Order Number Box */}
        <div className="my-5 w-full bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border-2 border-brand-500 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <span className="text-xs font-black uppercase tracking-widest text-brand-400 block mb-1">
            {t('order_number')}
          </span>
          <div className="text-6xl sm:text-7xl font-black tracking-widest text-amber-400 my-1 font-mono drop-shadow-lg">
            #{orderSuccessData.orderNumber}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-bold mt-2">
            {orderSuccessData.orderType === 'dine_in' ? (
              <>
                <Utensils className="w-3.5 h-3.5 text-brand-400" />
                <span>{t('dine_in')}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-brand-400" />
                <span>{t('takeaway')}</span>
              </>
            )}
            <span>•</span>
            <span>{orderSuccessData.itemsCount} {t('items')}</span>
          </div>
        </div>

        {/* Cashier Payment Instruction (Big & Clear) */}
        <div className="w-full bg-amber-50 rounded-2xl p-4 border border-amber-200/80 mb-5">
          <p className="text-lg sm:text-xl font-black text-amber-900 leading-snug">
            👉 {t('order_cashier_instruction')}
          </p>
          <p className="text-xs font-semibold text-amber-700 mt-1">
            {t('order_cashier_subnote')}
          </p>
        </div>

        {/* Mini Receipt Summary */}
        <div className="w-full bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70 mb-5 text-left text-xs text-slate-600">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 font-bold">
            <span className="flex items-center gap-1.5 text-slate-700 font-extrabold">
              <Receipt className="w-4 h-4 text-slate-500" />
              <span>{t('order_summary')}</span>
            </span>
            <span className="font-black text-slate-900 text-sm">
              {t('total')}: {orderSuccessData.total} {t('currency')}
            </span>
          </div>
          <div className="pt-2 max-h-24 overflow-y-auto space-y-1 custom-scrollbar text-[11px]">
            {orderSuccessData.items.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="truncate pr-2 font-medium">
                  {item.quantity}x {l(item.product.name)}
                </span>
                <span className="font-bold whitespace-nowrap">
                  {item.unitPrice * item.quantity} {t('currency')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Auto Return Countdown Bar */}
        <div className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-400 mb-4">
          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-700">
            {countdown}
          </span>
          <span>{t('auto_return_notice')}</span>
        </div>

        {/* Manual Reset Button */}
        <button
          onClick={resetToWelcome}
          className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-base shadow-lg touch-press flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>{t('new_order')}</span>
        </button>
      </div>
    </div>
  );
}
