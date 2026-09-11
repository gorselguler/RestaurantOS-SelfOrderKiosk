import React, { useState, useEffect, useMemo } from 'react';
import { useKiosk } from '../context/KioskContext';
import { X, Plus, Minus, Check, Sparkles, AlertCircle, ShoppingBag } from 'lucide-react';

/**
 * ProductCustomizerModal — self-contained, crash-proof.
 *
 * Data flow:
 *   Supabase row → KioskContext.fetchMenuFromSupabase (normalizes to plain
 *   objects with string ids, string names, number prices) → customizingProduct
 *   → this modal.
 *
 * This component trusts that normalization and adds only light guards.
 */
export default function ProductCustomizerModal() {
  const {
    customizingProduct,
    setCustomizingProduct,
    addToCart,
    t,
    currency,
  } = useKiosk();

  const [selectedGroupOptions, setSelectedGroupOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [validationError, setValidationError] = useState('');
  const [renderError, setRenderError] = useState(null);

  // ── Resolve groups from already-normalized data ──
  const groups = useMemo(() => {
    try {
      if (!customizingProduct) return [];
      const raw = customizingProduct.customizations;
      if (Array.isArray(raw)) return raw;
      return [];
    } catch {
      return [];
    }
  }, [customizingProduct]);

  // ── Initialize selections when product changes ──
  useEffect(() => {
    setRenderError(null);
    setValidationError('');

    if (!customizingProduct) {
      setSelectedGroupOptions({});
      setQuantity(1);
      return;
    }

    try {
      const initial = {};
      groups.forEach((group) => {
        if (!group?.id) return;
        if (group.type === 'single' && group.required && Array.isArray(group.options) && group.options.length > 0) {
          const first = group.options[0];
          initial[group.id] = [{
            groupId: group.id,
            groupName: group.name || '',
            optionId: first.id,
            name: first.name || '',
            price: parseFloat(first.price || 0) || 0,
          }];
        } else {
          initial[group.id] = [];
        }
      });
      setSelectedGroupOptions(initial);
      setQuantity(1);
    } catch (e) {
      console.error('ProductCustomizerModal init error:', e);
      setRenderError(String(e?.message || e));
    }
  }, [customizingProduct, groups]);

  // ── Guard: if no product, render nothing ──
  if (!customizingProduct) return null;

  // ── If init threw, show inline recovery ──
  if (renderError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 mb-2">Ürün yüklenemedi</h3>
          <p className="text-xs text-slate-500 mb-5 font-mono break-words">{renderError}</p>
          <button
            onClick={() => setCustomizingProduct(null)}
            className="w-full py-3 rounded-2xl bg-brand-500 text-white font-black"
          >
            Kapat
          </button>
        </div>
      </div>
    );
  }

  // ── Helpers ──
  const handleToggle = (group, option) => {
    setValidationError('');
    const groupId = group?.id;
    const current = selectedGroupOptions[groupId] || [];
    const alreadySelected = current.some((o) => o.optionId === option.id);

    if (group.type === 'single') {
      setSelectedGroupOptions((prev) => ({
        ...prev,
        [groupId]: (alreadySelected && !group.required)
          ? []
          : [{
              groupId,
              groupName: group.name || '',
              optionId: option.id,
              name: option.name || '',
              price: parseFloat(option.price || 0) || 0,
            }],
      }));
    } else {
      const max = parseInt(group.maxSelections, 10) || 10;
      if (alreadySelected) {
        setSelectedGroupOptions((prev) => ({
          ...prev,
          [groupId]: current.filter((o) => o.optionId !== option.id),
        }));
      } else if (current.length < max) {
        setSelectedGroupOptions((prev) => ({
          ...prev,
          [groupId]: [...current, {
            groupId,
            groupName: group.name || '',
            optionId: option.id,
            name: option.name || '',
            price: parseFloat(option.price || 0) || 0,
          }],
        }));
      }
    }
  };

  // ── Price ──
  const extraPrice = Object.values(selectedGroupOptions).flat()
    .reduce((sum, o) => sum + (parseFloat(o?.price) || 0), 0);
  const basePrice = parseFloat(customizingProduct?.price || 0);
  const unitPrice = basePrice + extraPrice;
  const totalPrice = unitPrice * quantity;

  const allSelectedOptions = Object.values(selectedGroupOptions).flat();

  // ── Add to Cart ──
  const handleApply = () => {
    for (const group of groups) {
      if (group.required) {
        const sel = selectedGroupOptions[group.id] || [];
        if (sel.length === 0) {
          setValidationError(`"${group.name}" için bir seçim yapmanız zorunludur.`);
          return;
        }
      }
    }
    addToCart(customizingProduct, {
      selectedOptions: allSelectedOptions,
      sauces: [],
      removals: [],
      addons: [],
      unitPrice,
      quantity,
    });
    // addToCart calls setCustomizingProduct(null) automatically
  };

  // ── String values (product name was normalized in context) ──
  const productName = (() => {
    const n = customizingProduct?.name;
    if (!n) return 'Ürün';
    if (typeof n === 'string') return n;
    if (typeof n === 'object') return n.tr || n.en || n.pl || Object.values(n).find(v => typeof v === 'string') || 'Ürün';
    return 'Ürün';
  })();

  const productDesc = (() => {
    const d = customizingProduct?.description;
    if (!d) return '';
    if (typeof d === 'string') return d;
    if (typeof d === 'object') return d.tr || d.en || d.pl || Object.values(d).find(v => typeof v === 'string') || '';
    return '';
  })();

  const productImage = customizingProduct?.image || customizingProduct?.image_url
    || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';

  // Use PLN from actual currency state, not from translations (which is hardcoded ₺)
  const currencyDisplay = currency || 'PLN';

  // F12 debug info
  console.log('🎨 Modal opened for:', productName, '| groups count:', groups.length, '| customizations:', customizingProduct?.customizations);

  return (
    <div
      onClick={() => setCustomizingProduct(null)}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 cursor-default"
      >

        {/* ── Header ── */}
        <div className="relative p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex gap-3.5 items-center min-w-0">
            <img
              src={productImage}
              alt={productName}
              className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-slate-200 shrink-0"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';
              }}
            />
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-[10px] font-black uppercase text-brand-700 tracking-wider mb-0.5">
                <Sparkles className="w-3 h-3 text-brand-600 shrink-0" />
                <span>{t('customize') || 'Özelleştir'}</span>
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight line-clamp-2">{productName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-400 font-bold">Başlangıç:</span>
                <span className="text-sm font-black text-brand-600 font-mono">
                  {Number(basePrice).toFixed(2)} {currencyDisplay}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCustomizingProduct(null)}
            className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Validation alert ── */}
        {validationError && (
          <div className="px-5 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">

          {productDesc ? (
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-600 font-medium leading-relaxed">
              {productDesc}
            </div>
          ) : null}

          {groups.length > 0 ? (
            groups.map((group) => {
              if (!group?.id) return null;

              const current = selectedGroupOptions[group.id] || [];
              const isSingle = group.type === 'single';
              const max = parseInt(group.maxSelections, 10) || (isSingle ? 1 : 10);
              const opts = Array.isArray(group.options) ? group.options : [];

              return (
                <div key={group.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                  {/* Group header */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900">{group.name || 'Seçenek Grubu'}</h4>
                        {group.required && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider">
                            Zorunlu
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        {isSingle
                          ? 'Bir seçenek belirleyiniz'
                          : `En fazla ${max} seçim — ${current.length}/${max}`}
                      </p>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                      current.length > 0
                        ? 'bg-brand-50 text-brand-700 border border-brand-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {current.length} Seçildi
                    </span>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {opts.map((opt) => {
                      if (!opt?.id) return null;
                      const isSelected = current.some((o) => o.optionId === opt.id);
                      const optPrice = parseFloat(opt.price || 0) || 0;
                      const atLimit = !isSingle && !isSelected && current.length >= max;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={atLimit}
                          onClick={() => handleToggle(group, opt)}
                          className={`p-3 rounded-xl flex items-center justify-between border-2 text-left transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50/80 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                              isSelected ? 'bg-brand-500 text-white' : 'border border-slate-300 bg-slate-50'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className={`text-xs font-bold truncate ${isSelected ? 'text-brand-950 font-black' : 'text-slate-800'}`}>
                              {opt.name || 'Seçenek'}
                            </span>
                          </div>

                          {optPrice > 0 ? (
                            <span className={`text-xs font-black px-2 py-0.5 rounded-lg font-mono shrink-0 ml-1 ${
                              isSelected ? 'bg-brand-500 text-white' : 'bg-slate-100 text-brand-600'
                            }`}>
                              +{Number(optPrice).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-1">Ücretsiz</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 px-4 text-center bg-white rounded-2xl border border-slate-200">
              <ShoppingBag className="w-8 h-8 text-brand-500 mx-auto mb-2 opacity-80" />
              <h4 className="text-sm font-bold text-slate-800">Standart Porsiyon</h4>
              <p className="text-xs text-slate-400 mt-1">
                Özelleştirme seçeneği yok. Adet seçerek sepete ekleyebilirsiniz.
              </p>
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center gap-3 shadow-xl shrink-0">

          {/* Quantity controls */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-xl bg-white text-slate-800 shadow-sm flex items-center justify-center disabled:opacity-40 cursor-pointer"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>
            <span className="w-10 text-center font-black text-base text-slate-900 font-mono">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-10 h-10 rounded-xl bg-brand-500 text-white shadow-sm flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Add to Cart button */}
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 active:scale-[0.98] text-white font-black text-sm sm:text-base shadow-lg shadow-brand-500/25 flex items-center justify-between transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>{t('apply') || 'Sepete Ekle'}</span>
            </span>
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-xl font-mono">
              <span className="text-base font-black">{Number(totalPrice).toFixed(2)}</span>
              <span className="text-xs font-extrabold">{currencyDisplay}</span>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}
