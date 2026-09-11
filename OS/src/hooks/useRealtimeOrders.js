import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useRealtimeOrders() {
  const { user } = useAuth()
  const restaurantId = user?.restaurant_id

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Start of today (00:00:00)
  const getTodayISOString = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today.toISOString()
  }

  // 1. Initial Data Fetch
  const fetchTodayOrders = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const todayStart = getTodayISOString()

      const { data, error: fetchErr } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', todayStart)
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr

      setOrders(data || [])
    } catch (err) {
      console.error('Error fetching today orders in hook:', err)
      setError(err.message || 'Siparişler yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    fetchTodayOrders()
  }, [fetchTodayOrders])

  // 2. Supabase Realtime Subscription (Robust Channel & Callback)
  useEffect(() => {
    if (!restaurantId) return

    const channel = supabase
      .channel('custom-dashboard-orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new
            if (!newOrder || (newOrder.restaurant_id && newOrder.restaurant_id !== restaurantId)) {
              return
            }

            setOrders((prev) => {
              const exists = prev.some((o) => o.id === newOrder.id)
              if (exists) return prev
              return [newOrder, ...prev]
            })
          }

          if (payload.eventType === 'UPDATE') {
            const updated = payload.new
            if (!updated || (updated.restaurant_id && updated.restaurant_id !== restaurantId)) {
              return
            }

            setOrders((prev) =>
              prev.map((order) => (order.id === updated.id ? updated : order))
            )
          }

          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id
            if (deletedId) {
              setOrders((prev) => prev.filter((order) => order.id !== deletedId))
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🔴 Dashboard Realtime Status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId])

  // 3. Computed Metrics
  const metrics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        todayRevenue: 0,
        todayOrderCount: 0,
        averageOrderValue: 0,
        pendingCount: 0,
        preparingCount: 0,
        readyCount: 0,
        completedCount: 0,
        cancelledCount: 0,
        cashTotal: 0,
        cardTotal: 0,
        kioskPosTotal: 0,
        blikTotal: 0,
        hourlyRevenue: [],
        topSellingItems: [],
        recentOrders: []
      }
    }

    let revenue = 0
    let validOrderCount = 0
    let pending = 0
    let preparing = 0
    let ready = 0
    let completed = 0
    let cancelled = 0

    let cash = 0
    let card = 0
    let kioskPos = 0
    let blik = 0

    const itemMap = {}
    const hourlyMap = {}
    for (let i = 8; i <= 23; i++) {
      const hStr = `${i < 10 ? '0' : ''}${i}:00`
      hourlyMap[hStr] = { hour: hStr, revenue: 0, count: 0 }
    }

    orders.forEach((order) => {
      const amount = parseFloat(order.total_amount) || 0

      if (order.status === 'PAYMENT_PENDING' || order.status === 'received') pending++
      else if (order.status === 'PREPARING') preparing++
      else if (order.status === 'READY') ready++
      else if (order.status === 'COMPLETED') completed++
      else if (order.status === 'CANCELLED') cancelled++

      if (order.status !== 'CANCELLED') {
        revenue += amount
        validOrderCount++

        const method = (order.payment_method || '').toUpperCase()
        if (method === 'CASH') cash += amount
        else if (method === 'CARD') card += amount
        else if (method === 'KIOSK_POS') kioskPos += amount
        else if (method === 'BLIK') blik += amount
        else if (method === 'PAY_AT_CASHIER') cash += amount
        else card += amount

        if (order.created_at) {
          const orderDate = new Date(order.created_at)
          const hour = orderDate.getHours()
          const hKey = `${hour < 10 ? '0' : ''}${hour}:00`
          if (hourlyMap[hKey]) {
            hourlyMap[hKey].revenue += amount
            hourlyMap[hKey].count += 1
          }
        }

        let itemsList = []
        try {
          if (typeof order.items === 'string') {
            itemsList = JSON.parse(order.items)
          } else if (Array.isArray(order.items)) {
            itemsList = order.items
          }
        } catch (e) {
          itemsList = []
        }

        itemsList.forEach((it) => {
          const itemName = it.name || it.product?.name?.tr || it.product?.name?.en || it.product?.name || 'Ürün'
          const itemQty = parseInt(it.quantity || it.qty || 1, 10)
          const itemPrice = parseFloat(it.price || it.unitPrice || it.product?.price || 0)

          if (!itemMap[itemName]) {
            itemMap[itemName] = { name: itemName, count: 0, revenue: 0 }
          }
          itemMap[itemName].count += itemQty
          itemMap[itemName].revenue += itemPrice * itemQty
        })
      }
    })

    const aov = validOrderCount > 0 ? revenue / validOrderCount : 0

    const topSelling = Object.values(itemMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const maxCount = topSelling.length > 0 ? Math.max(...topSelling.map((t) => t.count), 1) : 1
    const topSellingWithPercent = topSelling.map((t) => ({
      ...t,
      progress: Math.round((t.count / maxCount) * 100)
    }))

    return {
      todayRevenue: revenue,
      todayOrderCount: validOrderCount,
      averageOrderValue: aov,
      pendingCount: pending,
      preparingCount: preparing,
      readyCount: ready,
      completedCount: completed,
      cancelledCount: cancelled,
      cashTotal: cash,
      cardTotal: card,
      kioskPosTotal: kioskPos,
      blikTotal: blik,
      hourlyRevenue: Object.values(hourlyMap),
      topSellingItems: topSellingWithPercent,
      recentOrders: orders.slice(0, 10)
    }
  }, [orders])

  return {
    orders,
    loading,
    error,
    metrics,
    refreshOrders: fetchTodayOrders
  }
}
