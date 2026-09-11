import { useState, useEffect, useMemo, useCallback } from 'react'
import { INITIAL_ORDERS } from '../data/mockOrders'
import { subscribeToOrders } from '../lib/supabase'

export const useLiveOrders = () => {
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('restaurant_os_orders')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse cached orders', e)
      }
    }
    return INITIAL_ORDERS
  })

  const [selectedOrderId, setSelectedOrderId] = useState(() => {
    return INITIAL_ORDERS[0]?.id || null
  })

  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'pending_payment' | 'preparing' | 'ready' | 'completed'
  const [searchQuery, setSearchQuery] = useState('')
  const [newOrderNotification, setNewOrderNotification] = useState(null)

  // Save orders to local storage for persistence across reloads
  useEffect(() => {
    localStorage.setItem('restaurant_os_orders', JSON.stringify(orders))
  }, [orders])

  // Setup Supabase Realtime Listener (or fallback)
  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      (newOrder) => {
        setOrders((prev) => [newOrder, ...prev])
        setNewOrderNotification(`Yeni Sipariş Geldi: #${newOrder.orderNumber || newOrder.id}`)
      },
      (updatedOrder) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
        )
      }
    )

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // Auto clear notification after 4s
  useEffect(() => {
    if (newOrderNotification) {
      const t = setTimeout(() => setNewOrderNotification(null), 4000)
      return () => clearTimeout(t)
    }
  }, [newOrderNotification])

  // Mark order as paid & send to kitchen
  const markPaidAndSendToKitchen = useCallback((orderId) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: 'preparing',
            paymentMethod: order.paymentMethod.includes('Ödendi')
              ? order.paymentMethod
              : `${order.paymentMethod} (Ödendi)`,
            paidAt: new Date().toISOString()
          }
        }
        return order
      })
    )
  }, [])

  // Update order status directly
  const updateOrderStatus = useCallback((orderId, nextStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: nextStatus,
            updatedAt: new Date().toISOString()
          }
        }
        return order
      })
    )
  }, [])

  // Simulate incoming new order from Kiosk or Online
  const simulateNewIncomingOrder = useCallback(() => {
    const nextNum = Math.floor(143 + Math.random() * 50)
    const tables = ['Masa 1', 'Masa 3', 'Masa 7', 'Gel-Al (Kiosk)', 'Kurye #02', 'Masa 11']
    const sampleItems = [
      {
        id: `item-${Date.now()}-1`,
        name: 'Double BBQ Bacon Burger',
        quantity: 1,
        price: 44.00,
        options: [{ label: 'Peynir', value: 'Ekstra Gouda (+4 PLN)' }],
        itemTotal: 48.00
      },
      {
        id: `item-${Date.now()}-2`,
        name: 'Füme Kaburga Taco (3lü)',
        quantity: 1,
        price: 38.00,
        options: [{ label: 'Acı Seviyesi', value: 'Ekstra Acı (Jalapeno)' }],
        itemTotal: 38.00
      },
      {
        id: `item-${Date.now()}-3`,
        name: 'Buzlu Cold Brew Kahve',
        quantity: 2,
        price: 16.00,
        options: [{ label: 'Süt', value: 'Yulaf Sütü (+3 PLN)' }],
        itemTotal: 38.00
      }
    ]

    const newOrder = {
      id: `ORD-${nextNum}`,
      orderNumber: `${nextNum}`,
      table: tables[Math.floor(Math.random() * tables.length)],
      orderType: Math.random() > 0.4 ? 'Dine-In' : 'Takeaway',
      status: 'pending_payment',
      paymentMethod: 'Kasa Nakit / Kart',
      createdAt: new Date().toISOString(),
      customerNote: 'Kiosk üzerinden sipariş verildi. Hızlı hazırlanabilirse seviniriz.',
      items: sampleItems,
      subtotal: 124.00,
      serviceFee: 0.00,
      tax: 0.00,
      total: 124.00,
      currency: 'PLN'
    }

    setOrders((prev) => [newOrder, ...prev])
    setSelectedOrderId(newOrder.id)
    setNewOrderNotification(`Yeni Kiosk Siparişi Alındı! Sipariş #${newOrder.orderNumber}`)
  }, [])

  // Reset to initial mock data
  const resetToDefaultOrders = useCallback(() => {
    setOrders(INITIAL_ORDERS)
    setSelectedOrderId(INITIAL_ORDERS[0]?.id || null)
  }, [])

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      const matchesSearch =
        searchQuery === '' ||
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.table.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesStatus && matchesSearch
    })
  }, [orders, statusFilter, searchQuery])

  // Current selected order object
  const selectedOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || filteredOrders[0] || null
  }, [orders, selectedOrderId, filteredOrders])

  // Realtime counters
  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending_payment: orders.filter((o) => o.status === 'pending_payment').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      totalRevenueToday: orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total || 0), 0)
    }
  }, [orders])

  return {
    orders,
    filteredOrders,
    selectedOrderId,
    selectedOrder,
    setSelectedOrderId,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    counts,
    markPaidAndSendToKitchen,
    updateOrderStatus,
    simulateNewIncomingOrder,
    resetToDefaultOrders,
    newOrderNotification,
    setNewOrderNotification
  }
}
