import React from 'react'
import { StatusBadge } from '../common/Badge'
import { Clock, DollarSign, Utensils, ShoppingBag, Truck } from 'lucide-react'

// Helper function to format relative time
const formatTimeAgo = (isoDate) => {
  if (!isoDate) return ''
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))

  if (diffMins < 1) return 'Az önce'
  if (diffMins === 1) return '1 dk önce'
  if (diffMins < 60) return `${diffMins} dk önce`
  const diffHours = Math.floor(diffMins / 60)
  return `${diffHours} sa önce`
}

export const OrderCard = ({ order, isSelected, onSelect }) => {
  const timeAgo = formatTimeAgo(order.createdAt)
  const isPending = order.status === 'pending_payment'

  const getOrderTypeIcon = () => {
    switch (order.orderType) {
      case 'Takeaway':
        return <ShoppingBag className="w-3 h-3 text-purple-600" />
      case 'Delivery':
        return <Truck className="w-3 h-3 text-blue-600" />
      default:
        return <Utensils className="w-3 h-3 text-emerald-600" />
    }
  }

  return (
    <div
      onClick={() => onSelect(order.id)}
      className={`p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer relative group text-left ${
        isSelected
          ? 'bg-white border-brand-500 shadow-md ring-2 ring-brand-500/20'
          : 'bg-white/80 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
      }`}
    >
      {/* Pending Payment subtle indicator bar */}
      {isPending && (
        <div className="absolute top-0 left-4 right-4 h-1 bg-amber-400 rounded-b-full" />
      )}

      {/* Top Row: Order Number & Status Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900 text-base tracking-tight">
            Sipariş #{order.orderNumber}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-700">
            {getOrderTypeIcon()}
            {order.table}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeAgo}</span>
        </div>
      </div>

      {/* Middle Row: Items preview summary */}
      <p className="text-xs text-slate-500 line-clamp-1 mb-2.5 font-medium">
        {order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
      </p>

      {/* Bottom Row: Amount & Status Label */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-slate-400 font-medium">Tutar:</span>
          <span className="font-bold text-slate-900 text-sm font-mono">
            {order.total.toFixed(2)} {order.currency || 'PLN'}
          </span>
        </div>

        <StatusBadge status={order.status} />
      </div>
    </div>
  )
}
