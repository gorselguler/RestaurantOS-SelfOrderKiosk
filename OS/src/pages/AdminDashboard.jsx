import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useRealtimeOrders } from '../hooks/useRealtimeOrders'
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  ChevronRight,
  Flame,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Receipt,
  Inbox
} from 'lucide-react'

export function AdminDashboard({ onNavigate }) {
  const { user } = useAuth()
  const { metrics, loading, error, refreshOrders } = useRealtimeOrders()

  const currency = user?.currency || 'PLN'

  return (
    <div className="p-8 space-y-8 bg-[#FAFAF9] min-h-full overflow-y-auto">
      
      {/* Top Welcome Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-[#292524] tracking-tight">
              Hoş Geldin, {user?.name?.split(' ')[0] || 'Yönetici'} 👋
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              Canlı Senkronize
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            İşletmenizin bugünkü canlı operasyonel ve finansal verileri (Kiosk & Kasa anlık veritabanı).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshOrders}
            title="Verileri Yenile"
            className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => onNavigate && onNavigate('live-orders')}
            className="px-4 py-2.5 bg-[#C2410C] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold shadow-md shadow-[#C2410C]/20 transition-all flex items-center gap-2"
          >
            <Flame className="w-4 h-4" />
            <span>Canlı Kasa Ekranına Git</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stat Cards (100% Real Live Aggregations) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Günün Canlı Cirosu"
          value={`${metrics.todayRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`}
          badge={metrics.todayOrderCount > 0 ? `${metrics.todayOrderCount} Sipariş` : 'Henüz Satış Yok'}
          badgeType={metrics.todayOrderCount > 0 ? 'success' : 'neutral'}
          subtitle="Kiosk + Kasa toplamı"
        />

        <StatCard
          title="Toplam Sipariş Adedi"
          value={metrics.todayOrderCount.toString()}
          badge={metrics.completedCount > 0 ? `${metrics.completedCount} Tamamlandı` : '0 Teslim'}
          badgeType={metrics.todayOrderCount > 0 ? 'success' : 'neutral'}
          subtitle="Bugün alınan tüm siparişler"
        />

        <StatCard
          title="Ortalama Sepet Tutarı"
          value={`${metrics.averageOrderValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`}
          badge="AOV Metriği"
          badgeType="neutral"
          subtitle="Sipariş başına ortalama"
        />

        <StatCard
          title="Bekleyen / Mutfakta"
          value={metrics.pendingCount + metrics.preparingCount}
          badge={metrics.pendingCount > 0 ? `${metrics.pendingCount} Yeni Bekliyor` : 'Mutfak Rahat'}
          badgeType={metrics.pendingCount > 0 ? 'warning' : 'neutral'}
          subtitle="Hazırlık aşamasındaki siparişler"
        />
      </div>

      {/* Tables & Analytics Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-extrabold text-[#292524]">Bugünkü Son Siparişler</h3>
                <p className="text-xs text-stone-400">Veritabanından gelen canlı sipariş kayıtları</p>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('live-orders')}
                className="text-xs font-bold text-[#C2410C] hover:text-[#EA580C] flex items-center gap-1"
              >
                <span>Tümünü Gör</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs font-bold text-stone-400 uppercase bg-stone-50 border-b border-stone-100">
                  <tr>
                    <th className="px-4 py-3 font-semibold rounded-tl-xl">Sipariş No</th>
                    <th className="px-4 py-3 font-semibold">Kaynak</th>
                    <th className="px-4 py-3 font-semibold">Ödeme</th>
                    <th className="px-4 py-3 font-semibold">Tutar</th>
                    <th className="px-4 py-3 font-semibold">Durum</th>
                    <th className="px-4 py-3 font-semibold rounded-tr-xl">Zaman</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {metrics.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-stone-400 text-xs">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Inbox className="w-8 h-8 text-stone-300 stroke-[1.5]" />
                          <span>Bugün henüz bir sipariş kaydedilmedi.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    metrics.recentOrders.map((order) => {
                      const orderTime = order.created_at
                        ? new Date(order.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                        : '-'

                      return (
                        <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="px-4 py-4 font-bold text-[#292524]">
                            #{order.order_number || order.id.slice(0, 6)}
                          </td>
                          <td className="px-4 py-4 text-xs font-semibold text-stone-600 capitalize">
                            {order.source === 'kiosk' ? 'Tablet Kiosk' : order.source === 'cashier' ? 'Kasa POS' : order.source}
                          </td>
                          <td className="px-4 py-4 text-xs font-mono font-medium text-stone-500 uppercase">
                            {order.payment_method || 'KART'}
                          </td>
                          <td className="px-4 py-4 font-extrabold text-[#292524]">
                            {parseFloat(order.total_amount || 0).toFixed(2)} {currency}
                          </td>
                          <td className="px-4 py-4">
                            <OrderStatusBadge status={order.status} />
                          </td>
                          <td className="px-4 py-4 text-xs text-stone-400 font-medium">
                            {orderTime}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-base font-extrabold text-[#292524]">En Çok Satanlar</h3>
            <p className="text-xs text-stone-400">Bugünkü siparişlerden derlenen canlı ürünler</p>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-5">
            {metrics.topSellingItems.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                <Receipt className="w-8 h-8 text-stone-300 mx-auto mb-2 stroke-[1.5]" />
                <span>Henüz ürün satış verisi oluşmadı.</span>
              </div>
            ) : (
              metrics.topSellingItems.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-1.5 font-bold">
                    <span className="text-[#292524] truncate max-w-[170px]">{item.name}</span>
                    <span className="text-[#C2410C] font-mono">
                      {item.revenue.toFixed(2)} {currency}
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2">
                    <div
                      className="bg-[#C2410C] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-stone-400 font-medium mt-1">
                    {item.count} adet satıldı
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({ title, value, badge, badgeType, subtitle }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">{title}</span>
      <div className="mt-2 text-2xl font-black text-[#292524]">{value}</div>
      <div className="mt-3 flex items-center justify-between">
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
            badgeType === 'success'
              ? 'text-[#16A34A] bg-emerald-50 border border-emerald-200'
              : badgeType === 'warning'
              ? 'text-[#C2410C] bg-orange-50 border border-orange-200'
              : 'text-stone-700 bg-stone-100'
          }`}
        >
          {badge}
        </span>
        <span className="text-[11px] text-stone-400 font-medium">{subtitle}</span>
      </div>
    </div>
  )
}

function OrderStatusBadge({ status }) {
  switch (status) {
    case 'received':
    case 'pending_payment':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Alındı
        </span>
      )
    case 'preparing':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-[#EA580C] border border-orange-200">
          Hazırlanıyor
        </span>
      )
    case 'ready':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
          Hazır
        </span>
      )
    case 'completed':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600">
          Teslim Edildi
        </span>
      )
    case 'cancelled':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600">
          İptal
        </span>
      )
    default:
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600">
          {status}
        </span>
      )
  }
}

export default AdminDashboard
