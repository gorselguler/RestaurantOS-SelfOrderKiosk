import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import {
  ChefHat,
  Receipt,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Banknote,
  Utensils,
  ShoppingBag,
  ArrowRight,
  RotateCcw,
  XCircle,
  Search,
  RefreshCw,
  Bell,
  Inbox
} from 'lucide-react'

export function LiveOrders() {
  const { user } = useAuth()
  const restaurantId = user?.restaurant_id
  const currency = user?.currency || 'PLN'

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('PAYMENT_PENDING') // 'PAYMENT_PENDING' | 'PREPARING' | 'READY' | 'ALL'
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [newOrderAlert, setNewOrderAlert] = useState(null)
  const [printSuccess, setPrintSuccess] = useState(false)

  // 1. Initial Fetch Today's Orders
  const fetchOrders = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching today orders:', error)
        throw error
      }

      console.log('📦 Fetched orders for restaurant:', restaurantId, 'Total:', data?.length || 0)
      setOrders(data || [])

      if (data && data.length > 0) {
        const firstPending = data.find((o) => o.status === 'PAYMENT_PENDING')
        setSelectedOrderId(firstPending ? firstPending.id : data[0].id)
      }
    } catch (err) {
      console.error('Error in fetchOrders:', err)
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // 2. Realtime Listener on orders Table with Multi-Tenant Isolation
  useEffect(() => {
    if (!restaurantId) return

    console.log('🔌 Subscribing to Realtime orders for restaurant:', restaurantId)

    const channel = supabase
      .channel('custom-live-orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('⚡ Realtime Event Received on orders:', payload.eventType, payload)

          // 1. Handle INSERT event
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new

            // Multi-tenant check: Ignore if not matching current restaurant
            if (!newOrder || newOrder.restaurant_id !== restaurantId) {
              console.log('⏩ Ignored order belonging to different restaurant:', newOrder?.restaurant_id)
              return
            }

            console.log('✅ New order matches restaurant! Adding to UI state:', newOrder)

            // Immutable React state update
            setOrders((prev) => {
              const alreadyExists = prev.some((o) => o.id === newOrder.id)
              if (alreadyExists) return prev
              return [newOrder, ...prev]
            })

            // Visual Notification & Auto-selection
            if (newOrder.status === 'PAYMENT_PENDING') {
              const orderNum = newOrder.order_number || newOrder.daily_order_number || '101'
              setNewOrderAlert(`Yeni Kiosk Siparişi: #${orderNum}`)
              setSelectedOrderId(newOrder.id)
              setTimeout(() => setNewOrderAlert(null), 5000)
            }
          }

          // 2. Handle UPDATE event
          if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new

            if (!updatedOrder || updatedOrder.restaurant_id !== restaurantId) {
              return
            }

            console.log('🔄 Order updated:', updatedOrder.id, 'Status:', updatedOrder.status)
            setOrders((prev) =>
              prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
            )
          }

          // 3. Handle DELETE event
          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id
            if (deletedId) {
              setOrders((prev) => prev.filter((order) => order.id !== deletedId))
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🔴 Live Orders Realtime Status:', status)
      })

    return () => {
      console.log('🔌 Unsubscribing from live orders channel')
      supabase.removeChannel(channel)
    }
  }, [restaurantId])

  // 3. Status Tab Counts
  const counts = useMemo(() => {
    return {
      PAYMENT_PENDING: orders.filter((o) => o.status === 'PAYMENT_PENDING').length,
      PREPARING: orders.filter((o) => o.status === 'PREPARING').length,
      READY: orders.filter((o) => o.status === 'READY').length,
      ALL: orders.length
    }
  }, [orders])

  // 4. Filtered Orders List
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const orderNumStr = (order.order_number || order.daily_order_number || '').toString()
        if (!orderNumStr.includes(q)) return false
      }
      return true
    })
  }, [orders, statusFilter, searchQuery])

  const selectedOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || filteredOrders[0] || null
  }, [orders, selectedOrderId, filteredOrders])

  // 5. Cashier Actions: Confirm Payment
  const handleConfirmPayment = async (orderId) => {
    if (!orderId) return
    setActionLoading(true)

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'PREPARING',
          payment_status: 'PAID',
          payment_method: 'CASH',
          staff_id: user?.id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Payment confirmed for order:', orderId)

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'PREPARING', payment_status: 'PAID' } : o))
      )

      const remainingPending = orders.filter((o) => o.id !== orderId && o.status === 'PAYMENT_PENDING')
      if (remainingPending.length > 0) {
        setSelectedOrderId(remainingPending[0].id)
      }
    } catch (err) {
      alert('Ödeme onaylanırken hata oluştu: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Update Status Helper
  const handleUpdateStatus = async (orderId, nextStatus) => {
    if (!orderId) return
    setActionLoading(true)

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)))
    } catch (err) {
      alert('Durum güncellenirken hata oluştu: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Parse items safely
  const parsedItems = useMemo(() => {
    if (!selectedOrder?.items) return []
    if (Array.isArray(selectedOrder.items)) return selectedOrder.items
    try {
      return JSON.parse(selectedOrder.items)
    } catch (e) {
      return []
    }
  }, [selectedOrder])

  return (
    <div className="flex-1 h-full flex flex-col relative overflow-hidden bg-[#FAFAF9]">
      
      {/* Realtime Toast Notification Banner */}
      {newOrderAlert && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#292524] text-white px-6 py-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-3 animate-bounce">
          <div className="w-8 h-8 rounded-xl bg-[#C2410C] text-white flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <span className="text-sm font-extrabold">{newOrderAlert}</span>
        </div>
      )}

      {/* 2-Panel Master-Detail Layout */}
      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
        
        {/* ========================================================================= */}
        {/* LEFT PANE: Order List & Status Tabs */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[380px] xl:w-[420px] h-full flex flex-col bg-white border-r border-stone-200 select-none shrink-0">
          
          <div className="p-4 border-b border-stone-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg text-[#292524]">Canlı Siparişler</h2>
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-ping" />
              </div>
              <button
                onClick={fetchOrders}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
                title="Yenile"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Sipariş No ara (#142)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-[#292524] placeholder-stone-400 outline-none focus:ring-2 focus:ring-[#C2410C]"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setStatusFilter('PAYMENT_PENDING')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  statusFilter === 'PAYMENT_PENDING'
                    ? 'bg-[#C2410C] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#292524]'
                }`}
              >
                <span>Ödeme Bekleyen</span>
                {counts.PAYMENT_PENDING > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    statusFilter === 'PAYMENT_PENDING' ? 'bg-white text-[#C2410C]' : 'bg-[#C2410C] text-white animate-pulse'
                  }`}>
                    {counts.PAYMENT_PENDING}
                  </span>
                )}
              </button>

              <button
                onClick={() => setStatusFilter('PREPARING')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  statusFilter === 'PREPARING'
                    ? 'bg-[#292524] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#292524]'
                }`}
              >
                <span>Mutfakta</span>
                {counts.PREPARING > 0 && (
                  <span className="text-[10px] opacity-75">({counts.PREPARING})</span>
                )}
              </button>

              <button
                onClick={() => setStatusFilter('READY')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  statusFilter === 'READY'
                    ? 'bg-[#16A34A] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#292524]'
                }`}
              >
                <span>Hazır</span>
                {counts.READY > 0 && (
                  <span className="text-[10px] opacity-75">({counts.READY})</span>
                )}
              </button>
            </div>
          </div>

          {/* Scrollable Orders List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-stone-400 flex flex-col items-center justify-center gap-2">
                <Inbox className="w-10 h-10 text-stone-300 stroke-[1.5]" />
                <span className="text-xs font-semibold">Bu filtrede sipariş bulunmuyor.</span>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = order.id === selectedOrder?.id
                const isPending = order.status === 'PAYMENT_PENDING'
                const isPrep = order.status === 'PREPARING'
                const isRdy = order.status === 'READY'
                const timeElapsed = getTimeElapsed(order.created_at)

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer select-none relative ${
                      isSelected
                        ? 'bg-orange-50/70 border-[#C2410C] shadow-sm ring-1 ring-[#C2410C]'
                        : 'bg-[#FAFAF9] hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-xl font-black font-mono tracking-tight ${
                          isPending ? 'text-[#C2410C]' : 'text-[#292524]'
                        }`}>
                          #{order.order_number || order.daily_order_number || '101'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white border border-stone-200 text-stone-600">
                          {order.source === 'kiosk' ? 'Tablet Kiosk' : 'Kasa'}
                        </span>
                      </div>

                      <span className="text-base font-black text-[#292524] font-mono block">
                        {parseFloat(order.total_amount || 0).toFixed(2)} {currency}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-200/60">
                      <div className="flex items-center gap-1.5 text-stone-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{timeElapsed}</span>
                        <span>•</span>
                        <span className="capitalize">{order.order_type === 'dine_in' ? 'Burada' : 'Paket'}</span>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isPending ? 'bg-amber-100 text-amber-900 animate-pulse' :
                        isPrep ? 'bg-orange-100 text-orange-900' :
                        isRdy ? 'bg-emerald-100 text-emerald-900' :
                        'bg-stone-100 text-stone-600'
                      }`}>
                        {isPending ? 'Ödeme Bekliyor' : isPrep ? 'Hazırlanıyor' : isRdy ? 'Hazır' : order.status}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANE: Order Details & Action Button */}
        {/* ========================================================================= */}
        <div className="flex-1 h-full flex flex-col bg-white overflow-hidden">
          {!selectedOrder ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400">
              <Receipt className="w-12 h-12 text-stone-300 mb-3 stroke-[1.5]" />
              <h3 className="text-base font-bold text-[#292524]">Sipariş Seçilmedi</h3>
              <p className="text-xs text-stone-400 mt-1 max-w-xs">
                Ödeme almak veya detayları görüntülemek için sol listeden bir siparişe tıklayınız.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Header Bar */}
              <div className="px-8 py-5 border-b border-stone-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#C2410C] font-black text-2xl font-mono shadow-inner">
                    #{selectedOrder.order_number || selectedOrder.daily_order_number || '101'}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black text-[#292524] tracking-tight">
                        Sipariş #{selectedOrder.order_number || selectedOrder.daily_order_number || '101'}
                      </h2>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        selectedOrder.status === 'PAYMENT_PENDING' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        selectedOrder.status === 'PREPARING' ? 'bg-orange-50 text-[#C2410C] border border-orange-200' :
                        selectedOrder.status === 'READY' ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200' :
                        'bg-stone-100 text-stone-700'
                      }`}>
                        {selectedOrder.status === 'PAYMENT_PENDING' ? 'KASADA ÖDEME BEKLİYOR' : selectedOrder.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-stone-500 font-medium mt-1">
                      <span className="font-semibold text-stone-800">
                        {selectedOrder.order_type === 'dine_in' ? '🍽️ Masada Servis' : '🛍️ Paket Servis'}
                      </span>
                      <span>•</span>
                      <span>Saat: {new Date(selectedOrder.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>Yöntem: {selectedOrder.payment_method}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setPrintSuccess(true)
                    setTimeout(() => setPrintSuccess(false), 2000)
                  }}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-700 flex items-center gap-2 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>{printSuccess ? 'Yazdırıldı ✓' : 'Adisyon Yazdır'}</span>
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
                
                {selectedOrder.customer_notes && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">Müşteri Notu</span>
                    <p className="text-sm font-semibold text-amber-800 mt-0.5">"{selectedOrder.customer_notes}"</p>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                    Sipariş İçeriği ({parsedItems.length} Kalem)
                  </h3>

                  <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                    {parsedItems.map((item, idx) => {
                      const itemName = item.name || item.product?.name?.tr || item.product?.name?.en || item.product?.name || 'Ürün'
                      const qty = item.quantity || item.qty || 1
                      const price = parseFloat(item.unitPrice || item.price || item.product?.price || 0)

                      return (
                        <div key={idx} className="p-4 flex items-start justify-between gap-4 hover:bg-stone-50/60 transition-colors">
                          <div className="flex items-start gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-[#292524] text-white flex items-center justify-center font-black text-sm shrink-0 font-mono">
                              {qty}x
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-[#292524]">{itemName}</h4>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {item.selected_options?.map((opt, oIdx) => (
                                  <span key={oIdx} className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                                    opt.price > 0 
                                      ? 'bg-amber-50 text-amber-900 border-amber-200' 
                                      : opt.name?.toLowerCase().includes('sız') || opt.name?.toLowerCase().includes('no ') || opt.name?.toLowerCase().includes('without')
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 line-through'
                                      : 'bg-orange-50 text-[#C2410C] border-orange-200'
                                  }`}>
                                    {opt.name} {opt.price > 0 ? `(+${Number(opt.price).toFixed(2)} ${currency})` : ''}
                                  </span>
                                ))}
                                {item.sauces?.map((s, sIdx) => (
                                  <span key={sIdx} className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-50 text-[#C2410C] border border-orange-200">
                                    + {s.name?.tr || s.name || 'Sos'}
                                  </span>
                                ))}
                                {item.removals?.map((r, rIdx) => (
                                  <span key={rIdx} className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 line-through">
                                    {r}
                                  </span>
                                ))}
                                {item.addons?.map((a, aIdx) => (
                                  <span key={aIdx} className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                    + {a.label || a.name} (+{a.price} {currency})
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-base font-black text-[#292524] font-mono">
                              {(price * qty).toFixed(2)} {currency}
                            </div>
                            {qty > 1 && (
                              <div className="text-xs text-stone-400 font-medium font-mono">
                                (Birim: {price.toFixed(2)} {currency})
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAFAF9] border border-stone-200 flex justify-between items-center">
                  <span className="text-xs text-stone-500 font-medium">
                    Ödeme Şekli: <strong className="text-[#292524]">Fiziksel Kasa (PAY_AT_CASHIER)</strong>
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-bold text-stone-500">Toplam Tutar:</span>
                    <span className="text-2xl font-black text-[#292524] font-mono">
                      {parseFloat(selectedOrder.total_amount || 0).toFixed(2)} {currency}
                    </span>
                  </div>
                </div>

              </div>

              {/* MASSIVE GREEN ACTION BUTTON */}
              <div className="px-8 py-5 border-t border-stone-200 bg-white shadow-lg">
                {selectedOrder.status === 'PAYMENT_PENDING' ? (
                  <div className="flex items-center gap-3">
                    <button
                      disabled={actionLoading}
                      onClick={() => handleConfirmPayment(selectedOrder.id)}
                      className="flex-1 py-5 px-8 rounded-2xl bg-[#16A34A] hover:bg-green-700 active:bg-green-800 text-white font-black text-xl flex items-center justify-center gap-4 shadow-xl shadow-green-600/30 transition-all active:scale-[0.99] group border border-green-500 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ChefHat className="w-6 h-6 text-white" />
                      </div>
                      <span className="tracking-tight">
                        Ödemesi Alındı & Mutfağa Gönder
                      </span>
                      <ArrowRight className="w-6 h-6 opacity-80 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                      className="p-5 rounded-2xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 transition-colors"
                      title="Siparişi İptal Et"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-500">Mevcut Durum:</span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                        {selectedOrder.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {selectedOrder.status === 'PREPARING' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'READY')}
                          className="px-6 py-3.5 rounded-xl bg-[#16A34A] hover:bg-green-700 text-white font-bold text-sm flex items-center gap-2 shadow-md"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Mutfaktan Çıktı: Hazır Olarak İşaretle</span>
                        </button>
                      )}

                      {selectedOrder.status === 'READY' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED')}
                          className="px-6 py-3.5 rounded-xl bg-[#292524] hover:bg-stone-800 text-white font-bold text-sm flex items-center gap-2 shadow-md"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Müşteriye Teslim Edildi (Tamamla)</span>
                        </button>
                      )}

                      {selectedOrder.status === 'COMPLETED' && (
                        <span className="text-xs font-semibold text-stone-400">
                          Sipariş tamamlandı ve arşivlendi.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  )
}

function getTimeElapsed(dateStr) {
  if (!dateStr) return 'Az önce'
  const diffSec = Math.floor((new Date() - new Date(dateStr)) / 1000)
  if (diffSec < 60) return `${diffSec} sn önce`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} dk önce`
  const diffHour = Math.floor(diffMin / 60)
  return `${diffHour} sa önce`
}

export default LiveOrders
