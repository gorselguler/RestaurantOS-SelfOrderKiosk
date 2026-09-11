import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { generateOrderPdf } from '../utils/generateOrderPdf'
import { exportOrdersToCsv } from '../utils/exportOrders'
import {
  History,
  Calendar,
  FileDown,
  Printer,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  TabletSmartphone,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  X,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Inbox,
  FileSpreadsheet
} from 'lucide-react'

export function OrderHistory() {
  const { user } = useAuth()
  const restaurantId = user?.restaurant_id
  const restaurantName = user?.restaurantName || user?.name || 'Restaurant OS'
  const currency = user?.currency || 'PLN'

  // Date Range State (defaults to today)
  const [datePreset, setDatePreset] = useState('today') // 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'custom'
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'COMPLETED' | 'CANCELLED'
  const [sourceFilter, setSourceFilter] = useState('ALL') // 'ALL' | 'kiosk' | 'cashier'
  const [searchQuery, setSearchQuery] = useState('')

  // Data & Loading
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Quick Preset Handler
  const handlePresetChange = (preset) => {
    setDatePreset(preset)
    const today = new Date()

    if (preset === 'today') {
      const str = today.toISOString().split('T')[0]
      setStartDate(str)
      setEndDate(str)
    } else if (preset === 'yesterday') {
      const y = new Date(today)
      y.setDate(today.getDate() - 1)
      const str = y.toISOString().split('T')[0]
      setStartDate(str)
      setEndDate(str)
    } else if (preset === 'last7') {
      const past = new Date(today)
      past.setDate(today.getDate() - 6)
      setStartDate(past.toISOString().split('T')[0])
      setEndDate(today.toISOString().split('T')[0])
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      setStartDate(firstDay.toISOString().split('T')[0])
      setEndDate(today.toISOString().split('T')[0])
    }
  }

  // 1. Fetch Orders from Supabase
  const fetchOrders = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Start of startDay (00:00:00.000)
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)

      // End of endDay (23:59:59.999)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)

      let query = supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false })

      // Filter by status: only completed or cancelled
      if (statusFilter === 'COMPLETED') {
        query = query.eq('status', 'COMPLETED')
      } else if (statusFilter === 'CANCELLED') {
        query = query.eq('status', 'CANCELLED')
      } else {
        query = query.in('status', ['COMPLETED', 'CANCELLED'])
      }

      if (sourceFilter !== 'ALL') {
        query = query.eq('source', sourceFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Supabase Order History Fetch Error:', error)
        throw error
      }

      setOrders(data || [])
    } catch (err) {
      console.error('Error fetching order history:', err)
    } finally {
      setLoading(false)
    }
  }, [restaurantId, startDate, endDate, statusFilter, sourceFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // 2. Client-side Search Filtering
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders

    const query = searchQuery.toLowerCase().trim()
    return orders.filter((o) => {
      const orderNo = String(o.order_number || o.daily_order_number || o.id || '').toLowerCase()
      const notes = String(o.customer_notes || '').toLowerCase()
      const payment = String(o.payment_method || '').toLowerCase()

      let itemNames = ''
      try {
        const items = typeof o.items === 'string' ? JSON.parse(o.items) : (Array.isArray(o.items) ? o.items : [])
        itemNames = items.map(it => it.name || it.product?.name?.tr || it.product?.name || '').join(' ').toLowerCase()
      } catch {}

      return (
        orderNo.includes(query) ||
        notes.includes(query) ||
        payment.includes(query) ||
        itemNames.includes(query)
      )
    })
  }, [orders, searchQuery])

  // 3. Computed KPI Metrics
  const metrics = useMemo(() => {
    let completedRevenue = 0
    let completedCount = 0
    let cancelledCount = 0

    orders.forEach((o) => {
      const amt = parseFloat(o.total_amount || 0)
      if (o.status === 'COMPLETED') {
        completedRevenue += amt
        completedCount += 1
      } else if (o.status === 'CANCELLED') {
        cancelledCount += 1
      }
    })

    const aov = completedCount > 0 ? completedRevenue / completedCount : 0

    return {
      completedRevenue,
      completedCount,
      cancelledCount,
      totalOrders: orders.length,
      aov
    }
  }, [orders])

  // 4. PDF Generation Trigger
  const handleDownloadPDF = () => {
    try {
      setPdfGenerating(true)
      generateOrderPdf(filteredOrders, {
        restaurantName,
        currency,
        startDate,
        endDate
      })
    } catch (err) {
      console.error('PDF Generation Error:', err)
      alert('PDF raporu oluşturulurken bir hata meydana geldi: ' + err.message)
    } finally {
      setPdfGenerating(false)
    }
  }

  // Optional: CSV Export Trigger
  const handleExportCsv = () => {
    const filename = `Order_History_${startDate}_${endDate}`
    exportOrdersToCsv(filteredOrders, currency, filename)
  }

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 bg-[#FAFAF9] space-y-6 select-none font-sans">
      
      {/* ── Top Header & Actions ── */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#C2410C] flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#292524] tracking-tight leading-none">
                Sipariş Geçmişi & Raporu
              </h2>
              <p className="text-xs text-stone-500 font-medium mt-1">
                Tamamlanan ve iptal edilen geçmiş siparişlerin muhasebe ve denetim dökümü.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Refresh, CSV, and Primary PDF Report */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          <button
            type="button"
            onClick={fetchOrders}
            className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl transition-colors cursor-pointer"
            title="Listeyi Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredOrders.length === 0}
            className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl transition-colors cursor-pointer"
            title="Excel (CSV) Dışa Aktar"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          {/* Primary Action: Download PDF Report */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={filteredOrders.length === 0 || pdfGenerating}
            className="px-5 py-3 rounded-2xl bg-[#C2410C] hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-md shadow-[#C2410C]/25 flex items-center gap-2 touch-press transition-all cursor-pointer"
          >
            <FileDown className={`w-4 h-4 stroke-[2.5] ${pdfGenerating ? 'animate-bounce' : ''}`} />
            <span>{pdfGenerating ? 'Oluşturuluyor...' : 'PDF Raporu İndir'}</span>
          </button>
        </div>
      </div>

      {/* ── Date Picker & Filter Controls ── */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Preset Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'today', label: 'Bugün' },
            { id: 'yesterday', label: 'Dün' },
            { id: 'last7', label: 'Son 7 Gün' },
            { id: 'thisMonth', label: 'Bu Ay' },
            { id: 'custom', label: 'Özel Tarih' }
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetChange(preset.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                datePreset === preset.id
                  ? 'bg-[#C2410C] text-white shadow-sm shadow-[#C2410C]/30'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Date Inputs & Status Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Custom Date Inputs */}
          <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-2xl border border-stone-200 text-xs font-bold text-stone-700">
            <Calendar className="w-4 h-4 text-stone-400 ml-1.5" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setDatePreset('custom')
                setStartDate(e.target.value)
              }}
              className="bg-transparent outline-none text-xs font-bold text-[#292524] cursor-pointer"
            />
            <span className="text-stone-300 font-normal">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setDatePreset('custom')
                setEndDate(e.target.value)
              }}
              className="bg-transparent outline-none text-xs font-bold text-[#292524] cursor-pointer"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-bold text-[#292524] outline-none cursor-pointer"
          >
            <option value="ALL">Tüm Durumlar (Teslim + İptal)</option>
            <option value="COMPLETED">Yalnızca Tamamlananlar</option>
            <option value="CANCELLED">Yalnızca İptal Edilenler</option>
          </select>

          {/* Source Dropdown */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-bold text-[#292524] outline-none cursor-pointer"
          >
            <option value="ALL">Tüm Kaynaklar</option>
            <option value="kiosk">Tablet Kiosk</option>
            <option value="cashier">Kasa POS</option>
          </select>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Revenue Card */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Toplam Net Ciro
            </span>
            <span className="p-2 rounded-xl bg-orange-50 text-[#C2410C]">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#292524] font-mono">
              {metrics.completedRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-sm font-bold text-stone-500">{currency}</span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium mt-1">
              Yalnızca tamamlanan siparişler
            </p>
          </div>
        </div>

        {/* Completed Orders Card */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Teslim Edilenler
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-[#16A34A]">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#292524] font-mono">
              {metrics.completedCount} <span className="text-sm font-bold text-stone-500">Adet</span>
            </div>
            <p className="text-[11px] text-[#16A34A] font-semibold mt-1">
              Başarıyla tamamlandı
            </p>
          </div>
        </div>

        {/* Cancelled Orders Card */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              İptal Edilenler
            </span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#292524] font-mono">
              {metrics.cancelledCount} <span className="text-sm font-bold text-stone-500">Adet</span>
            </div>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              İptal / İade kayıtları
            </p>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Ortalama Sepet (AOV)
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#292524] font-mono">
              {metrics.aov.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-sm font-bold text-stone-500">{currency}</span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium mt-1">
              Sipariş başına ortalama
            </p>
          </div>
        </div>

      </div>

      {/* ── Search & Total Count Bar ── */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sipariş no, ürün adı veya not ara..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-bold text-[#292524] outline-none focus:ring-2 focus:ring-[#C2410C]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs font-bold text-stone-500">
          Toplam <strong>{filteredOrders.length}</strong> sipariş bulundu
        </div>
      </div>

      {/* ── Order History Table / List ── */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#C2410C] animate-spin" />
            <span className="text-xs font-extrabold text-stone-500">Sipariş geçmişi yükleniyor...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-stone-50 text-stone-300 flex items-center justify-center mb-3">
              <Inbox className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="font-extrabold text-base text-[#292524]">Kayıtlı Sipariş Bulunamadı</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-sm leading-relaxed">
              Belirtilen tarih aralığında ve filtre kriterlerinde tamamlanan veya iptal edilen bir sipariş bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-100 text-[11px] font-black text-stone-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Sipariş No</th>
                  <th className="px-6 py-4">Tarih & Saat</th>
                  <th className="px-6 py-4">Kaynak</th>
                  <th className="px-6 py-4">Ödeme</th>
                  <th className="px-6 py-4">Ürün Özeti</th>
                  <th className="px-6 py-4">Durum</th>
                  <th className="px-6 py-4 text-right">Tutar</th>
                  <th className="px-6 py-4 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((order) => {
                  let parsedItems = []
                  try {
                    parsedItems =
                      typeof order.items === 'string'
                        ? JSON.parse(order.items)
                        : Array.isArray(order.items)
                        ? order.items
                        : []
                  } catch {
                    parsedItems = []
                  }

                  const totalItemCount = parsedItems.reduce(
                    (sum, it) => sum + (parseInt(it.quantity || it.qty || 1, 10)),
                    0
                  )

                  const firstItemName =
                    parsedItems[0]?.name ||
                    parsedItems[0]?.product?.name?.tr ||
                    parsedItems[0]?.product?.name ||
                    'Ürün'

                  const dateStr = order.created_at
                    ? new Date(order.created_at).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-'

                  const isCompleted = order.status === 'COMPLETED'

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-stone-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Order Number */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#292524] text-base group-hover:text-[#C2410C] transition-colors">
                            #{order.order_number || order.daily_order_number || order.id.slice(0, 6)}
                          </span>
                          {order.order_type === 'takeaway' ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-extrabold uppercase">
                              Paket
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-extrabold uppercase">
                              Burada
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-stone-600 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="px-6 py-4">
                        {order.source === 'kiosk' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-50 text-[#C2410C] border border-orange-200 text-xs font-bold">
                            <TabletSmartphone className="w-3.5 h-3.5" />
                            <span>Kiosk</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold">
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Kasa POS</span>
                          </span>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono font-bold text-stone-600 uppercase">
                          {order.payment_method || 'KART'}
                        </span>
                      </td>

                      {/* Items Summary */}
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#292524] truncate max-w-[200px]">
                            {firstItemName}
                          </span>
                          {totalItemCount > 1 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-black shrink-0">
                              +{totalItemCount - 1}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-[#16A34A] border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Teslim Edildi</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>İptal Edildi</span>
                          </span>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="px-6 py-4 text-right font-mono font-black text-[#292524] text-base">
                        {parseFloat(order.total_amount || 0).toFixed(2)}{' '}
                        <span className="text-xs font-bold text-stone-500 font-sans">{currency}</span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedOrder(order)
                          }}
                          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-orange-50 hover:text-[#C2410C] text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Detay
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Order Detail Modal / Drawer ── */}
      {selectedOrder && (
        <div
          onClick={() => setSelectedOrder(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs cursor-pointer animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden cursor-default max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#C2410C] text-white flex items-center justify-center shadow-md shadow-[#C2410C]/25">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-[#292524] font-mono">
                      #{selectedOrder.order_number || selectedOrder.daily_order_number || selectedOrder.id.slice(0, 6)}
                    </h3>
                    {selectedOrder.status === 'COMPLETED' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-[#16A34A] border border-emerald-200">
                        Teslim Edildi
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                        İptal Edildi
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 font-medium mt-0.5">
                    {new Date(selectedOrder.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Items Breakdown */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              
              {/* Order Meta Attributes */}
              <div className="grid grid-cols-2 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200/80 text-xs">
                <div>
                  <span className="text-stone-400 font-bold block uppercase text-[10px]">Sipariş Türü</span>
                  <span className="font-extrabold text-[#292524]">
                    {selectedOrder.order_type === 'takeaway' ? 'Paket (Takeaway)' : 'Burada Ye (Dine-in)'}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 font-bold block uppercase text-[10px]">Kaynak</span>
                  <span className="font-extrabold text-[#292524]">
                    {selectedOrder.source === 'kiosk' ? 'Tablet Kiosk' : 'Kasa POS'}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 font-bold block uppercase text-[10px]">Ödeme Kanalı</span>
                  <span className="font-extrabold text-[#292524] uppercase">
                    {selectedOrder.payment_method || 'KART'}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 font-bold block uppercase text-[10px]">Ödeme Durumu</span>
                  <span className="font-extrabold text-emerald-600">
                    {selectedOrder.payment_status || 'PAID'}
                  </span>
                </div>
              </div>

              {/* Customer Notes if any */}
              {selectedOrder.customer_notes && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-medium">
                  <strong>Müşteri Notu:</strong> {selectedOrder.customer_notes}
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black text-stone-400 uppercase tracking-wider">
                  Sipariş Edilen Ürünler
                </h4>

                {(() => {
                  let items = []
                  try {
                    items =
                      typeof selectedOrder.items === 'string'
                        ? JSON.parse(selectedOrder.items)
                        : Array.isArray(selectedOrder.items)
                        ? selectedOrder.items
                        : []
                  } catch {
                    items = []
                  }

                  return items.map((it, idx) => {
                    const itName =
                      it.name ||
                      it.product?.name?.tr ||
                      it.product?.name?.en ||
                      it.product?.name ||
                      'Ürün'
                    const itQty = it.quantity || it.qty || 1
                    const itPrice = parseFloat(it.unitPrice || it.price || 0)

                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-orange-100 text-[#C2410C] font-black text-xs flex items-center justify-center font-mono">
                              {itQty}x
                            </span>
                            <span className="font-black text-sm text-[#292524]">{itName}</span>
                          </div>
                          <span className="font-mono font-black text-sm text-[#292524]">
                            {(itPrice * itQty).toFixed(2)} {currency}
                          </span>
                        </div>

                        {/* Modifiers tags */}
                        {it.selected_options?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 pl-8 text-[11px]">
                            {it.selected_options.map((opt, oIdx) => (
                              <span
                                key={oIdx}
                                className="px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-700 font-bold"
                              >
                                + {opt.name} {opt.price > 0 ? `(+${Number(opt.price).toFixed(2)})` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>

            </div>

            {/* Modal Footer: Total */}
            <div className="p-6 border-t border-stone-200 bg-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-400 block uppercase">Toplam Tahsilat</span>
                <span className="text-2xl font-black text-[#C2410C] font-mono">
                  {parseFloat(selectedOrder.total_amount || 0).toFixed(2)}{' '}
                  <span className="text-sm font-bold text-stone-500 font-sans">{currency}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-3 rounded-2xl bg-[#292524] hover:bg-stone-800 text-white font-black text-sm cursor-pointer transition-colors"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
