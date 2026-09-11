import React from 'react'
import { STATUS_CONFIG } from '../../data/mockOrders'

export const StatusBadge = ({ status, className = '' }) => {
  const config = STATUS_CONFIG[status] || {
    label: status,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badgeClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  )
}

export const PillBadge = ({ children, color = 'slate', className = '' }) => {
  const colorMap = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200'
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${colorMap[color] || colorMap.slate} ${className}`}
    >
      {children}
    </span>
  )
}
