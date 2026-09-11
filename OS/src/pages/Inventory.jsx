import React, { useState } from 'react'
import { Boxes, AlertTriangle, Plus, Search, Filter, CheckCircle2, RefreshCw } from 'lucide-react'

export function Inventory() {
  const [items, setItems] = useState([
    { id: 'inv_1', name: 'Dana Döner Eti (Kg)', category: 'Hammadde', stock: 45, unit: 'Kg', minStock: 20, status: 'in_stock' },
    { id: 'inv_2', name: 'Tavuk Döner Eti (Kg)', category: 'Hammadde', stock: 28, unit: 'Kg', minStock: 15, status: 'in_stock' },
    { id: 'inv_3', name: 'Lavaş Ekmeği (Paket)', category: 'Unlu Mamul', stock: 120, unit: 'Adet', minStock: 50, status: 'in_stock' },
    { id: 'inv_4', name: 'Patates Kızartması (Koli)', category: 'Dondurulmuş', stock: 6, unit: 'Koli', minStock: 10, status: 'low_stock' },
    { id: 'inv_5', name: 'Sarımsaklı Mayonez (Litre)', category: 'Soslar', stock: 2, unit: 'Litre', minStock: 5, status: 'critical' },
    { id: 'inv_6', name: 'Kutu Kola 330ml', category: 'İçecek', stock: 180, unit: 'Kutu', minStock: 40, status: 'in_stock' }
  ])

  const [searchTerm, setSearchTerm] = useState('')

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleStockUpdate = (id, delta) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newStock = Math.max(0, item.stock + delta)
        let status = 'in_stock'
        if (newStock === 0) status = 'out_of_stock'
        else if (newStock <= item.minStock / 2) status = 'critical'
        else if (newStock <= item.minStock) status = 'low_stock'
        return { ...item, stock: newStock, status }
      }
      return item
    }))
  }

  return (
    <div className="p-8 space-y-8 bg-[#FAFAF9] min-h-full overflow-y-auto">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#C2410C] flex items-center justify-center border border-orange-200">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#292524]">Stok & Envanter Yönetimi</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Hammadde ve porsiyon seviyesinde gerçek zamanlı stok takibi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ürün veya kategori ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-xs outline-none focus:ring-2 focus:ring-[#C2410C] transition-all w-64"
            />
          </div>

          <button
            onClick={() => alert('Yeni stok kalemi ekleme penceresi')}
            className="px-4 py-2.5 bg-[#C2410C] hover:bg-[#EA580C] text-white rounded-xl font-bold text-xs shadow-md shadow-[#C2410C]/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Stok Kalemi Ekle</span>
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs font-bold text-stone-400 uppercase bg-stone-50 border-b border-stone-100">
            <tr>
              <th className="px-6 py-4">Ürün Adı</th>
              <th className="px-6 py-4">Kategori</th>
              <th className="px-6 py-4">Mevcut Stok</th>
              <th className="px-6 py-4">Kritik Eşik</th>
              <th className="px-6 py-4">Durum</th>
              <th className="px-6 py-4 text-right">Hızlı Güncelle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                <td className="px-6 py-4 font-bold text-[#292524]">{item.name}</td>
                <td className="px-6 py-4 text-stone-600">{item.category}</td>
                <td className="px-6 py-4 font-extrabold text-base text-[#292524]">
                  {item.stock} <span className="text-xs text-stone-400 font-normal">{item.unit}</span>
                </td>
                <td className="px-6 py-4 text-stone-500 font-medium">{item.minStock} {item.unit}</td>
                <td className="px-6 py-4">
                  {item.status === 'in_stock' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                      Yeterli
                    </span>
                  )}
                  {item.status === 'low_stock' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                      Azalıyor
                    </span>
                  )}
                  {item.status === 'critical' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                      Kritik Stok
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => handleStockUpdate(item.id, -1)}
                    className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 transition-all text-xs"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => handleStockUpdate(item.id, 5)}
                    className="w-8 h-8 rounded-lg bg-orange-50 hover:bg-orange-100 font-bold text-[#C2410C] transition-all text-xs"
                  >
                    +5
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
