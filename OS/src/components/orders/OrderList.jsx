import React from 'react'
import { OrderCard } from './OrderCard'
import { Search, Filter, Layers, Clock, ChefHat, CheckCircle2 } from 'lucide-react'

const TABS = [
  { id: 'all', label: 'Tümü', icon: Layers },
  { id: 'pending_payment', label: 'Ödeme Bekleyen', icon: Clock, highlight: true },
  { id: 'preparing', label: 'Mutfakta', icon: ChefHat },
  { id: 'ready', label: 'Hazır', icon: CheckCircle2 }
]

export const OrderList = ({
  orders,
  selectedOrderId,
  onSelectOrder,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
  counts
}) => {
  return (
    <div className="w-full lg:w-[32%] xl:w-[28%] h-full flex flex-col bg-slate-50/70 border-r border-slate-200/90 select-none">
      {/* Top Controls: Search Bar */}
      <div className="p-4 pb-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Sipariş no (#142), masa veya ürün ara..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Horizontal Tabs */}
      <div className="px-4 py-2 border-b border-slate-200/60 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        {TABS.map((tab) => {
          const isActive = statusFilter === tab.id
          const count = counts[tab.id] ?? 0

          return (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : tab.highlight && count > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Orders Count Summary */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>
          Toplam <strong className="text-slate-800">{orders.length}</strong> sipariş listeleniyor
        </span>
      </div>

      {/* Scrollable Order Cards List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
        {orders.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Filter className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Eşleşen Sipariş Yok</p>
            <p className="text-xs text-slate-400 max-w-[200px]">
              Arama kriterlerinize veya seçili filtreye uygun sipariş bulunamadı.
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isSelected={order.id === selectedOrderId}
              onSelect={onSelectOrder}
            />
          ))
        )}
      </div>
    </div>
  )
}
