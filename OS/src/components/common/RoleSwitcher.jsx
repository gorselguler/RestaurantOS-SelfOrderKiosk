import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { ShieldCheck, UserCheck, RefreshCw } from 'lucide-react'

export const RoleSwitcher = ({ compact = false }) => {
  const { role, switchRole, toggleRole } = useAuth()

  if (compact) {
    return (
      <button
        onClick={toggleRole}
        title="Rolü Değiştir (Admin / Kasiyer)"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 active:scale-95 ${
          role === 'admin'
            ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 shadow-sm'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-sm'
        }`}
      >
        {role === 'admin' ? (
          <>
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Admin Modu</span>
          </>
        ) : (
          <>
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kasiyer Modu</span>
          </>
        )}
        <RefreshCw className="w-3 h-3 ml-1 opacity-60" />
      </button>
    )
  }

  return (
    <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 w-full">
      <button
        onClick={() => switchRole('admin')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
          role === 'admin'
            ? 'bg-white text-purple-700 shadow-sm border border-purple-100'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Admin</span>
      </button>
      <button
        onClick={() => switchRole('cashier')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
          role === 'cashier'
            ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <UserCheck className="w-3.5 h-3.5" />
        <span>Kasiyer</span>
      </button>
    </div>
  )
}
