import React, { useState } from 'react';
import { useKiosk } from '../context/KioskContext';
import { Plus, SlidersHorizontal, Flame, Star, Sparkles, Ban } from 'lucide-react';

// ── Fallback image placeholder (food gradient + icon) ─────────────────────────
function ImagePlaceholder() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200 flex flex-col items-center justify-center gap-2">
      <div className="w-12 h-12 rounded-2xl bg-stone-300/60 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25C3 7.007 4.007 6 5.25 6h13.5C19.993 6 21 7.007 21 8.25v7.5C21 16.993 19.993 18 18.75 18H5.25C4.007 18 3 16.993 3 15.75v-7.5Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75h4.5M9.75 12h4.5" />
        </svg>
      </div>
    </div>
  );
}

export default function ProductCard({ product }) {
  const { addToCart, setCustomizingProduct, t, l } = useKiosk();
  const [imgError, setImgError] = useState(false);

  const isOutOfStock = product.isAvailable === false;

  const handleCardClick = () => {
    if (isOutOfStock) return;
    setCustomizingProduct(product);
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    setCustomizingProduct(product);
  };

  const productName = (() => {
    const n = product.name;
    if (!n) return '';
    if (typeof n === 'string') return n;
    if (typeof n === 'object') return n.tr || n.en || n.pl || Object.values(n)[0] || '';
    return '';
  })();

  const productDesc = (() => {
    const d = product.description;
    if (!d) return '';
    if (typeof d === 'string') return d;
    if (typeof d === 'object') return d.tr || d.en || d.pl || Object.values(d)[0] || '';
    return '';
  })();

  return (
    <article
      onClick={handleCardClick}
      className={`
        group relative flex flex-col bg-white rounded-3xl overflow-hidden
        border border-stone-100
        shadow-[0_2px_12px_-2px_rgba(0,0,0,0.07),0_1px_3px_-1px_rgba(0,0,0,0.05)]
        transition-all duration-300
        ${isOutOfStock
          ? 'opacity-60 cursor-not-allowed grayscale-[40%]'
          : 'cursor-pointer hover:shadow-[0_12px_32px_-4px_rgba(194,65,12,0.18),0_4px_12px_-2px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 touch-press'
        }
      `}
    >
      {/* ── Image Area — dominant 58% of card ── */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-stone-100 shrink-0">
        {!imgError && product.image ? (
          <img
            src={product.image}
            alt={productName}
            loading="lazy"
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              !isOutOfStock ? 'group-hover:scale-[1.06]' : ''
            }`}
          />
        ) : (
          <ImagePlaceholder />
        )}

        {/* Subtle vignette at bottom for text contrast */}
        {!isOutOfStock && (
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-stone-900/55 backdrop-blur-[2px] flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-600 text-white font-black text-xs shadow-lg uppercase tracking-wider">
              <Ban className="w-3.5 h-3.5" />
              Tükendi
            </span>
          </div>
        )}

        {/* ── Badges ── */}
        {!isOutOfStock && (
          <>
            {product.badge === 'chef' && (
              <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C2410C] text-white font-black text-[10px] shadow-md shadow-[#C2410C]/40 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>Şefin Seçimi</span>
              </div>
            )}
            {product.badge === 'popular' && (
              <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white font-black text-[10px] shadow-md shadow-amber-500/40 uppercase tracking-wider">
                <Star className="w-3 h-3 fill-white" />
                <span>Popüler</span>
              </div>
            )}
            {product.badge === 'spicy' && (
              <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 text-white font-black text-[10px] shadow-md shadow-red-500/40 uppercase tracking-wider">
                <Flame className="w-3 h-3 fill-white" />
                <span>Acılı</span>
              </div>
            )}

            {/* Customizable badge — bottom right of image */}
            {product.customizable && (
              <div className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#292524]/75 text-white font-bold text-[10px] backdrop-blur-sm">
                <SlidersHorizontal className="w-3 h-3" />
                <span>{t('customize')}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Content Area ── */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Product name */}
        <h3 className="font-extrabold text-base leading-snug text-[#292524] line-clamp-2 flex-1">
          {productName}
        </h3>

        {/* Description — optional, only if present */}
        {productDesc ? (
          <p className="text-xs text-stone-400 font-medium line-clamp-2 leading-relaxed -mt-1">
            {productDesc}
          </p>
        ) : null}

        {/* ── Price & CTA Row ── */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-stone-100">

          {/* Price */}
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Fiyat</span>
            <span className="text-xl font-black text-[#C2410C] font-mono tracking-tight mt-0.5">
              {Number(product.price || 0).toFixed(2)}
              <span className="text-xs font-bold ml-1 text-[#C2410C]/70">{t('currency')}</span>
            </span>
          </div>

          {/* Add / Customize Button */}
          {isOutOfStock ? (
            <div className="w-11 h-11 rounded-full bg-stone-200 flex items-center justify-center cursor-not-allowed">
              <Ban className="w-4 h-4 text-stone-400" />
            </div>
          ) : product.customizable ? (
            <button
              onClick={handleAddClick}
              aria-label={t('customize')}
              className="flex items-center gap-1.5 pl-3 pr-4 h-11 rounded-full bg-[#C2410C]/10 hover:bg-[#C2410C]/20 text-[#C2410C] font-black text-xs border border-[#C2410C]/20 transition-all duration-200 touch-press"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span>{t('customize')}</span>
            </button>
          ) : (
            <button
              onClick={handleAddClick}
              aria-label={t('add')}
              className="w-11 h-11 rounded-full bg-[#C2410C] hover:bg-[#C2410C]/90 text-white flex items-center justify-center shadow-md shadow-[#C2410C]/35 hover:scale-105 active:scale-95 transition-all duration-200 touch-press shrink-0"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
