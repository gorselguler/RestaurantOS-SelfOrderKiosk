import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  Clock,
  Radio,
  Volume2,
  VolumeX,
  Lock,
  CalendarCheck,
  Plus,
  RefreshCw,
  TabletSmartphone,
  CheckCircle2
} from 'lucide-react'

export const Header = ({
  activeTabTitle = 'Dashboard',
  activeCategory = 'Analyzes',
  pendingCount = 0,
  onQuickLock,
  onOpenShiftModal,
  onSimulateOrder
}) => {
  const { user } = useAuth()
  const [time, setTime] = useState(new Date())
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Live store clock ticker
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedTime = time.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  const formattedDate = time.toLocaleDateString('tr-TR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })

  return (
    <header className="h-20 bg-white/90 backdrop-blur-md border-b border-stone-200 px-8 flex items-center justify-between sticky top-0 z-10 select-none">
      
      {/* Left: Section Title & Breadcrumb & Live Sync Badge */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">
            <span>{activeCategory}</span>
            <span>/</span>
            <span className="text-[#C2410C] font-bold">{activeTabTitle}</span>
          </div>
          <h1 className="text-xl font-black text-[#292524] tracking-tight mt-0.5 flex items-center gap-3">
            {activeTabTitle}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping inline-block" />
              Realtime Aktif
            </span>
          </h1>
        </div>
      </div>

      {/* Right: Operational Status, Shift Badge, Live Clock, Fast Actions */}
      <div className="flex items-center gap-3.5">
        
        {/* Active Shift Indicator & Quick Shift Button */}
        <div className="flex items-center gap-2 bg-[#FAFAF9] border border-stone-200 px-3 py-1.5 rounded-xl text-xs">
          <CalendarCheck className="w-4 h-4 text-[#C2410C]" />
          <div>
            <span className="text-stone-400 font-medium">Vardiya: </span>
            <span className="text-[#292524] font-bold">#102 (Açık)</span>
          </div>
        </div>

        {/* Live Clock & Date */}
        <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-2 bg-[#FAFAF9] border border-stone-200 rounded-xl text-xs font-semibold text-[#292524] font-mono shadow-2xs">
          <Clock className="w-4 h-4 text-stone-400" />
          <span>{formattedTime}</span>
          <span className="text-stone-300 font-sans">|</span>
          <span className="text-stone-500 font-sans">{formattedDate}</span>
        </div>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2.5 rounded-xl border transition-all duration-150 ${
            soundEnabled
              ? 'bg-[#FAFAF9] text-[#292524] border-stone-200 hover:bg-stone-100'
              : 'bg-rose-50 text-rose-600 border-rose-200'
          }`}
          title={soundEnabled ? 'Sipariş sesli uyarısı açık' : 'Sipariş sesli uyarısı kapalı'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Quick Floor PIN Lock Button */}
        <button
          type="button"
          onClick={onQuickLock}
          className="flex items-center gap-2 px-3.5 py-2 bg-stone-100 hover:bg-orange-50 text-stone-700 hover:text-[#C2410C] border border-stone-200 hover:border-orange-200 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95"
          title="Terminali kilitle ve PIN korumasına al"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Hızlı Kilit</span>
        </button>
      </div>
    </header>
  )
}
