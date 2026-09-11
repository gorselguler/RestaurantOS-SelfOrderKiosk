import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  BarChart3,
  CalendarCheck,
  Receipt,
  BookOpen,
  Boxes,
  Users2,
  History,
  TabletSmartphone,
  CreditCard,
  Building2,
  ChevronDown,
  ChevronRight,
  LogOut,
  Lock,
  UtensilsCrossed,
  ShieldCheck
} from 'lucide-react'

export const NAVIGATION_CATEGORIES = [
  {
    id: 'analyzes',
    label: 'Analyzes',
    labelTr: 'Analiz & Raporlama',
    icon: BarChart3,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'reports', label: 'Revenue & Reports', icon: BarChart3, badge: 'Ciro' },
      { id: 'shifts', label: 'Shift Summaries', icon: CalendarCheck }
    ]
  },
  {
    id: 'operation',
    label: 'Operation',
    labelTr: 'Operasyon & Sipariş',
    icon: UtensilsCrossed,
    items: [
      { id: 'live-orders', label: 'Live Orders (Cashier)', icon: Receipt, liveBadge: true },
      { id: 'menu', label: 'Menu Management', icon: BookOpen, syncBadge: 'Kiosk Sync' },
      { id: 'inventory', label: 'Inventory', icon: Boxes }
    ]
  },
  {
    id: 'management',
    label: 'Management',
    labelTr: 'Yönetim & Müşteri',
    icon: Users2,
    items: [
      { id: 'staff', label: 'Staff & Roles', icon: Users2 },
      { id: 'order-history', label: 'Order History', icon: History, badge: 'Arşiv' }
    ]
  },
  {
    id: 'settings',
    label: 'System Settings',
    labelTr: 'Sistem Ayarları',
    icon: TabletSmartphone,
    items: [
      { id: 'devices', label: 'Device Management', icon: TabletSmartphone, statusDot: true },
      { id: 'payments', label: 'Payment Methods', icon: CreditCard },
      { id: 'profile', label: 'Restaurant Profile', icon: Building2 }
    ]
  }
]

export const Sidebar = ({ activeTab, onSelectTab, pendingCount = 0, onQuickLock }) => {
  const { user, logout } = useAuth()

  // Track collapsed status of each category
  const [collapsedCategories, setCollapsedCategories] = useState({
    analyzes: false,
    operation: false,
    management: false,
    settings: false
  })

  const toggleCategory = (catId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }))
  }

  return (
    <aside className="w-72 h-screen flex flex-col bg-white border-r border-stone-200 select-none shadow-sm z-20 shrink-0">

      {/* 1. Brand Logo Header */}
      <div className="h-20 px-6 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C2410C] flex items-center justify-center shadow-md shadow-[#C2410C]/20 text-white font-black text-xl">
            R
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[#292524] tracking-tight text-base">
                Restaurant<span className="text-[#C2410C]">OS</span>
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-black tracking-wider bg-orange-50 text-[#C2410C] rounded border border-orange-200 uppercase">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-stone-400 font-medium truncate max-w-[130px]">
              {user?.restaurantName || 'Gusto Bistro'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Structured & Collapsible Navigation */}
      <div className="flex-1 px-3 py-4 overflow-y-auto space-y-4 custom-scrollbar">
        {NAVIGATION_CATEGORIES.map((category) => {
          const isCollapsed = collapsedCategories[category.id]
          const hasActiveChild = category.items.some(i => i.id === activeTab)

          return (
            <div key={category.id} className="space-y-1">
              {/* Category Header with Toggle */}
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${hasActiveChild ? 'text-[#C2410C]' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span>{category.label}</span>
                </div>
                <div className="text-stone-300">
                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {/* Sub-items */}
              {!isCollapsed && (
                <div className="space-y-1 pl-1">
                  {category.items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.id

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectTab(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${isActive
                          ? 'bg-orange-50 text-[#C2410C] font-semibold border border-orange-200/80 shadow-xs'
                          : 'text-stone-600 hover:text-[#292524] hover:bg-[#FAFAF9]'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 transition-colors ${isActive ? 'text-[#C2410C]' : 'text-stone-400 group-hover:text-stone-700'
                              }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {/* Badges / Indicators */}
                        <div className="flex items-center gap-1.5">
                          {item.liveBadge && pendingCount > 0 && (
                            <span className="w-5 h-5 flex items-center justify-center bg-[#EA580C] text-white rounded-full text-[10px] font-bold shadow-xs animate-pulse">
                              {pendingCount}
                            </span>
                          )}

                          {item.syncBadge && (
                            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-50 text-[#16A34A] rounded border border-emerald-200">
                              {item.syncBadge}
                            </span>
                          )}

                          {item.badge && !item.syncBadge && (
                            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-stone-100 text-stone-600 rounded">
                              {item.badge}
                            </span>
                          )}

                          {item.statusDot && (
                            <span className="w-2 h-2 rounded-full bg-[#16A34A] ring-2 ring-emerald-100" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 3. Bottom Admin Profile & Fast Lock */}
      <div className="p-3 border-t border-stone-200 bg-[#FAFAF9]/80">
        <div className="p-2.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=Admin&background=C2410C&color=fff`}
                alt="Profile"
                className="w-9 h-9 rounded-xl object-cover border border-stone-200"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#16A34A] border-2 border-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#292524] truncate leading-tight">
                {user?.name || 'Yönetici'}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-stone-400 font-medium">
                <ShieldCheck className="w-3 h-3 text-[#C2410C]" />
                <span className="capitalize">{user?.role || 'Admin'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Fast Floor PIN Lock Button */}
            <button
              type="button"
              onClick={onQuickLock}
              title="Kasa Ekranını Kilitle (Hızlı PIN)"
              className="p-2 text-stone-400 hover:text-[#C2410C] hover:bg-orange-50 rounded-xl transition-colors"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={logout}
              title="Güvenli Çıkış Yap"
              className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
