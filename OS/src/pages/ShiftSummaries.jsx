import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useRealtimeOrders } from '../hooks/useRealtimeOrders'
import {
  CalendarCheck,
  DollarSign,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  Inbox,
  AlertCircle
} from 'lucide-react'

export function ShiftSummaries() {
  const { user } = useAuth()
  const restaurantId = user?.restaurant_id
  const currency = user?.currency || 'PLN'

  const { metrics } = useRealtimeOrders()

  const [activeShift, setActiveShift] = useState(null)
  const [pastShifts, setPastShifts] = useState([])
  const [loadingShifts, setLoadingShifts] = useState(true)

  // Start Shift Modal
  const [isStartModalOpen, setIsStartModalOpen] = useState(false)
  const [startCashInput, setStartCashInput] = useState('500.00')

  // Close Shift Modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
  const [countedCash, setCountedCash] = useState('')
  const [closeNotes, setCloseNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch active and past shifts from Supabase
  const fetchShifts = useCallback(async () => {
    if (!restaurantId) {
      setLoadingShifts(false)
      return
    }

    try {
      setLoadingShifts(true)

      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          opened_profile:opened_by (full_name),
          closed_profile:closed_by (full_name)
        `)
        .eq('restaurant_id', restaurantId)
        .order('opened_at', { ascending: false })

      if (error) throw error

      const open = data?.find((s) => s.status === 'open') || null
      const closed = data?.filter((s) => s.status === 'closed') || []

      setActiveShift(open)
      setPastShifts(closed)
    } catch (err) {
      console.error('Error fetching shifts:', err)
    } finally {
      setLoadingShifts(false)
    }
  }, [restaurantId])

  useEffect(() => {
    fetchShifts()
  }, [fetchShifts])

  // Real live numbers for the active shift
  const startCash = parseFloat(activeShift?.start_cash || 0)
  const liveCashSales = metrics.cashTotal
  const liveCardSales = metrics.cardTotal + metrics.kioskPosTotal + metrics.blikTotal
  const expectedCash = startCash + liveCashSales

  // Handle Starting a New Shift
  const handleStartShift = async (e) => {
    e.preventDefault()
    if (!restaurantId || !user?.id) return

    try {
      setActionLoading(true)

      const startAmount = parseFloat(startCashInput) || 0

      const { data, error } = await supabase
        .from('shifts')
        .insert({
          restaurant_id: restaurantId,
          opened_by: user.id,
          start_cash: startAmount,
          status: 'open',
          opened_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      setIsStartModalOpen(false)
      fetchShifts()
    } catch (err) {
      alert('Vardiya başlatılamadı: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Closing Active Shift
  const handleCloseShift = async (e) => {
    e.preventDefault()
    if (!activeShift?.id || !user?.id) return

    try {
      setActionLoading(true)

      const actualCash = parseFloat(countedCash) || 0
      const discrepancy = actualCash - expectedCash

      const { error } = await supabase
        .from('shifts')
        .update({
          closed_by: user.id,
          end_cash: actualCash,
          total_cash_sales: liveCashSales,
          total_card_sales: liveCardSales,
          expected_cash: expectedCash,
          discrepancy: discrepancy,
          notes: closeNotes,
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', activeShift.id)

      if (error) throw error

      setIsCloseModalOpen(false)
      setCountedCash('')
      setCloseNotes('')
      fetchShifts()
    } catch (err) {
      alert('Vardiya kapatılamadı: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-8 bg-[#FAFAF9] min-h-full overflow-y-auto">
      
      {/* Top Banner / Shift Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#C2410C] flex items-center justify-center border border-orange-200">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-[#292524]">
                {activeShift ? `Aktif Kasa Vardiyası (#${activeShift.id.slice(0, 6)})` : 'Aktif Kasa Vardiyası Yok'}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeShift
                    ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {activeShift ? 'AÇIK' : 'KAPALI'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {activeShift
                ? `Açılış: ${new Date(activeShift.opened_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} • Açan: ${activeShift.opened_profile?.full_name || user?.name || 'Yetkili'}`
                : 'Sipariş ve nakit işlemlerini kaydetmek için lütfen yeni vardiya başlatın.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchShifts}
            className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl transition-colors"
            title="Vardiya Bilgilerini Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loadingShifts ? 'animate-spin' : ''}`} />
          </button>

          {activeShift ? (
            <button
              onClick={() => setIsCloseModalOpen(true)}
              className="px-5 py-2.5 bg-[#C2410C] hover:bg-[#EA580C] text-white rounded-xl font-bold text-sm shadow-md shadow-[#C2410C]/20 transition-all flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Vardiyayı Kapat & Z Raporu Al</span>
            </button>
          ) : (
            <button
              onClick={() => setIsStartModalOpen(true)}
              className="px-5 py-2.5 bg-[#16A34A] hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-md shadow-green-600/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Vardiya Başlat</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Shift Financial Breakdown (100% Real Live Metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Açılış Kasa Nakdi</span>
          <div className="text-2xl font-black text-[#292524] mt-2">
            {startCash.toFixed(2)} {currency}
          </div>
          <p className="text-xs text-stone-400 mt-1">Sabit bozuk para tabanı</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Canlı Nakit Satışlar</span>
          <div className="text-2xl font-black text-[#16A34A] mt-2">
            +{liveCashSales.toFixed(2)} {currency}
          </div>
          <p className="text-xs text-stone-400 mt-1">Kasaya fiziksel giren nakit</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Kart / Kiosk / POS</span>
          <div className="text-2xl font-black text-[#C2410C] mt-2">
            +{liveCardSales.toFixed(2)} {currency}
          </div>
          <p className="text-xs text-stone-400 mt-1">Banka hesabına aktarılan</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-orange-200 bg-orange-50/30 shadow-sm">
          <span className="text-xs font-bold text-[#C2410C] uppercase tracking-wider">Beklenen Kasa Nakdi</span>
          <div className="text-2xl font-black text-[#292524] mt-2">
            {expectedCash.toFixed(2)} {currency}
          </div>
          <p className="text-xs text-stone-500 mt-1">Sayımda olması gereken nakit</p>
        </div>

      </div>

      {/* Past Shifts Table (Real Supabase Shifts) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <h3 className="text-lg font-black text-[#292524] mb-4">Geçmiş Vardiya Özetleri (Z Raporları)</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-bold text-stone-400 uppercase bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="px-4 py-3.5 rounded-tl-xl">Vardiya ID</th>
                <th className="px-4 py-3.5">Açılış / Kapanış</th>
                <th className="px-4 py-3.5">Personel</th>
                <th className="px-4 py-3.5">Açılış Nakdi</th>
                <th className="px-4 py-3.5">Nakit Satış</th>
                <th className="px-4 py-3.5">Kart / Kiosk Satış</th>
                <th className="px-4 py-3.5">Kasa Farkı</th>
                <th className="px-4 py-3.5 rounded-tr-xl">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pastShifts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-stone-400 text-xs">
                    <Inbox className="w-8 h-8 text-stone-300 mx-auto mb-2 stroke-[1.5]" />
                    <span>Henüz tamamlanmış bir geçmiş vardiya kaydı bulunmuyor.</span>
                  </td>
                </tr>
              ) : (
                pastShifts.map((s) => {
                  const openedDate = new Date(s.opened_at).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  const disc = parseFloat(s.discrepancy || 0)

                  return (
                    <tr key={s.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-4 font-bold text-[#292524]">
                        #{s.id.slice(0, 6)}
                      </td>
                      <td className="px-4 py-4 text-xs text-stone-600 font-medium">
                        {openedDate}
                      </td>
                      <td className="px-4 py-4 text-xs text-stone-600">
                        {s.opened_profile?.full_name || 'Yetkili'} ➔ {s.closed_profile?.full_name || 'Yetkili'}
                      </td>
                      <td className="px-4 py-4 font-mono text-stone-700">
                        {parseFloat(s.start_cash || 0).toFixed(2)} {currency}
                      </td>
                      <td className="px-4 py-4 font-mono font-bold text-[#16A34A]">
                        {parseFloat(s.total_cash_sales || 0).toFixed(2)} {currency}
                      </td>
                      <td className="px-4 py-4 font-mono font-bold text-[#C2410C]">
                        {parseFloat(s.total_card_sales || 0).toFixed(2)} {currency}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`font-bold font-mono text-xs ${
                            disc < 0 ? 'text-rose-600' : disc > 0 ? 'text-[#16A34A]' : 'text-stone-600'
                          }`}
                        >
                          {disc > 0 ? `+${disc.toFixed(2)}` : disc.toFixed(2)} {currency}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600">
                          KAPANDI
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Start Shift Modal */}
      {isStartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292524]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form onSubmit={handleStartShift} className="bg-white w-full max-w-md rounded-3xl p-6 border border-stone-200 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-[#292524]">Yeni Kasa Vardiyası Başlat</h3>
            <p className="text-xs text-stone-500">
              Kasada bulunan başlangıç bozuk para tabanını giriniz.
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Açılış Nakit Tutarı ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={startCashInput}
                onChange={(e) => setStartCashInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#C2410C] font-bold text-lg outline-none"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsStartModalOpen(false)}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm rounded-xl transition-all"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-3 bg-[#16A34A] hover:bg-green-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Vardiyayı Başlat</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Close Shift Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292524]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form onSubmit={handleCloseShift} className="bg-white w-full max-w-md rounded-3xl p-6 border border-stone-200 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-[#292524]">Vardiya Kapanışı & Z Raporu</h3>
            <p className="text-xs text-stone-500">
              Lütfen kasadaki fiziki nakit parayı sayarak tam tutarı giriniz.
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Sayılan Fiziki Nakit ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#C2410C] font-bold text-lg outline-none"
              />
            </div>

            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-xs text-stone-600 space-y-1">
              <div className="flex justify-between font-medium">
                <span>Beklenen Kasa Nakdi:</span>
                <span className="font-bold text-[#292524]">{expectedCash.toFixed(2)} {currency}</span>
              </div>
              {countedCash && (
                <div className="flex justify-between font-bold pt-2 border-t border-orange-200">
                  <span>Kasa Farkı:</span>
                  <span className={(parseFloat(countedCash) - expectedCash) < 0 ? 'text-rose-600' : 'text-[#16A34A]'}>
                    {(parseFloat(countedCash) - expectedCash).toFixed(2)} {currency}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Kapanış Notu / Açıklama (Opsiyonel)
              </label>
              <input
                type="text"
                placeholder="Örn: Gün sonu sayımı tamamlandı"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#C2410C] text-xs outline-none"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm rounded-xl transition-all"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-3 bg-[#C2410C] hover:bg-[#EA580C] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Vardiyayı Kapat</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}

export default ShiftSummaries
