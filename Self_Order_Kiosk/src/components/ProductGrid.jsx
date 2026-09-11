import React from 'react';
import { useKiosk } from '../context/KioskContext';
import ProductCard from './ProductCard';
import { Utensils, Loader2 } from 'lucide-react';

export default function ProductGrid() {
  const { products, selectedCategory, categories, menuLoading, l, t } = useKiosk();

  const isAll = !selectedCategory || selectedCategory === 'ALL';

  const filteredProducts = products.filter(
    (p) => isAll || p.categoryId === selectedCategory
  );

  const currentCategory = isAll ? null : categories.find((c) => c.id === selectedCategory);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (menuLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[#FAFAF9] p-8">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-stone-200" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#C2410C] animate-spin" />
        </div>
        <p className="text-sm font-extrabold text-stone-500">Menü Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAF9] custom-scrollbar">
      <div className="px-4 pt-5 pb-36">

        {/* ── Section header ── */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-black text-[#292524] tracking-tight leading-none">
              {currentCategory ? l(currentCategory.name) : t('all_products')}
            </h2>
            <p className="text-xs font-bold text-stone-400 mt-1">
              {filteredProducts.length} ürün
            </p>
          </div>

          {/* Decorative accent line */}
          <div className="h-0.5 flex-1 mx-4 mb-2 bg-gradient-to-l from-stone-200 to-transparent rounded-full" />
        </div>

        {/* ── Empty state ── */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center bg-white rounded-3xl border border-stone-100 shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-stone-50 border border-stone-200 flex items-center justify-center mb-4">
              <Utensils className="w-9 h-9 text-stone-300" />
            </div>
            <h3 className="font-extrabold text-base text-[#292524]">
              Bu kategoride henüz ürün yok
            </h3>
            <p className="text-xs text-stone-400 font-medium mt-1.5 max-w-xs leading-relaxed">
              Yönetici panelinden (OS) yeni ürünler eklendiğinde burada anında görünecektir.
            </p>
          </div>
        ) : (
          /* ── 2-column grid — optimized for portrait kiosk tablets ── */
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
