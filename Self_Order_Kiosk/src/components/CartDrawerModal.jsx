import React, { useState } from 'react';
import { useKiosk } from '../context/KioskContext';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import PaymentSelectionModal from './PaymentSelectionModal';

export default function CartDrawerModal() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    cartSummary,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    completeOrder,
    currency,
    t,
    l,
  } = useKiosk();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!isCartOpen) return null;

  const currencyCode = currency || t('currency') || 'PLN';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-stone-950/70 backdrop-blur-sm animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={() => setIsCartOpen(false)} />

      {/* Drawer Sheet */}
      <div className="relative w-full max-w-xl mx-auto max-h-[85vh] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden border-t border-stone-200">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#C2410C] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#292524]">{t('order_summary')}</h2>
              <span className="text-xs font-bold text-stone-400">
                {cartSummary.totalItems} {t('items')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-black flex items-center gap-1 touch-press cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('clear_cart')}</span>
              </button>
            )}

            <button
              onClick={() => setIsCartOpen(false)}
              className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 touch-press cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="font-extrabold text-lg text-[#292524]">{t('empty_cart')}</h3>
              <p className="text-sm text-stone-400 mt-1 max-w-xs">{t('empty_cart_desc')}</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-stone-50/80 rounded-2xl p-3.5 border border-stone-200/80 flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={item.product?.image || item.product?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'}
                      alt={l(item.product?.name)}
                      className="w-14 h-14 rounded-xl object-cover border border-stone-200"
                    />
                    <div>
                      <h4 className="font-black text-[#292524] text-sm sm:text-base leading-tight">
                        {l(item.product?.name)}
                      </h4>
                      <span className="text-xs font-bold text-[#C2410C] block mt-0.5 font-mono">
                        {Number(item.unitPrice).toFixed(2)} {currencyCode} / adet
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg touch-press cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Customizations tags */}
                {(item.selectedOptions?.length > 0 || item.sauces?.length > 0 || item.removals?.length > 0 || item.addons?.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-stone-200/60 text-[11px]">
                    {item.selectedOptions?.map((opt, oIdx) => (
                      <span
                        key={opt.optionId || opt.name || oIdx}
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          opt.price > 0
                            ? 'bg-amber-100/80 text-amber-900 border border-amber-200'
                            : 'bg-orange-50 text-orange-900 border border-orange-200'
                        }`}
                      >
                        + {opt.name} {opt.price > 0 ? `(+${Number(opt.price).toFixed(2)} ${currencyCode})` : ''}
                      </span>
                    ))}
                    {item.sauces?.map((s, sIdx) => (
                      <span
                        key={s.id || s || sIdx}
                        className="px-2 py-0.5 rounded-md bg-orange-100/70 text-orange-950 font-bold"
                      >
                        + {l(s.name) || s}
                      </span>
                    ))}
                    {item.removals?.map((r, rIdx) => (
                      <span
                        key={r.id || r || rIdx}
                        className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold line-through"
                      >
                        {t(r.label || r)}
                      </span>
                    ))}
                    {item.addons?.map((a, aIdx) => (
                      <span
                        key={a.id || a.label || aIdx}
                        className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold"
                      >
                        + {t(a.label || a.name)} (+{Number(a.price).toFixed(2)} ${currencyCode})
                      </span>
                    ))}
                  </div>
                )}

                {/* Quantity Controls & Subtotal */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                  <div className="flex items-center bg-white p-1 rounded-xl border border-stone-200 shadow-2xs">
                    <button
                      onClick={() => updateCartQuantity(item.id, -1)}
                      className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 touch-press cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <span className="w-8 text-center font-black text-sm text-[#292524] font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.id, 1)}
                      className="w-8 h-8 rounded-lg bg-[#C2410C] text-white flex items-center justify-center touch-press cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>

                  <span className="font-black text-base sm:text-lg text-[#292524] font-mono">
                    {Number(item.unitPrice * item.quantity).toFixed(2)} {currencyCode}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Total and Confirm Order */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-white flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-stone-500">{t('total')}</span>
              <span className="text-2xl sm:text-3xl font-black text-[#292524] font-mono">
                {Number(cartSummary.totalPrice).toFixed(2)} <span className="text-lg font-bold text-stone-600">{currencyCode}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="w-full py-4 sm:py-4.5 rounded-2xl bg-[#C2410C] hover:bg-orange-700 active:bg-orange-800 text-white font-black text-lg shadow-xl shadow-[#C2410C]/25 flex items-center justify-center gap-3 touch-press cursor-pointer transition-all"
            >
              <span>{t('confirm_and_order')}</span>
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        )}
      </div>

      <PaymentSelectionModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
        onPayCashier={() => {
          setShowPaymentModal(false);
          completeOrder();
        }} 
      />
    </div>
  );
}
