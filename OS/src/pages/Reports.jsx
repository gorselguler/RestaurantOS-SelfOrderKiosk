import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useRealtimeOrders } from '../hooks/useRealtimeOrders'
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  ArrowUpRight,
  CreditCard,
  Banknote,
  Smartphone,
  TabletSmartphone,
  RefreshCw,
  Inbox
} from 'lucide-react'

export function Reports() {
  const { user } = useAuth()
  const { metrics, loading, refreshOrders } = useRealtimeOrders()
  const currency = user?.currency || 'PLN'

  // Total Payment Sum for percentages
  const totalPayment = metrics.cashTotal + metrics.cardTotal + metrics.kioskPosTotal + metrics.blikTotal
  const getPercent = (val) => (totalPayment > 0 ? Math.round((val / totalPayment) * 100) : 0)

  // Max hourly revenue for chart scaling
  const maxHourlyRev = Math.max(...metrics.hourlyRevenue.map((h) => h.revenue), 1)

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 bg-[#FAFAF9] space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-[#292524] tracking-tight">
              Ciro & Finansal Raporlar
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              Canlı Rapor
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Günün anlık satış performansı, ödeme dağılımı ve saatlik ciro analizleri.
          </p>
        </div>

        <button
          onClick={refreshOrders}
          className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl transition-colors self-start md:self-auto"
          title="Raporu Yenile"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Günlük Ciro</span>
            <span className="p-2 rounded-xl bg-orange-50 text-[#C2410C]">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#292524] font-mono">
            {metrics.todayRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
          </div>
          <p className="text-xs text-stone-400 font-medium mt-2">
            {metrics.todayOrderCount > 0 ? `${metrics.todayOrderCount} Sipariş Alındı` : '0 Sipariş'}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Toplam Sipariş</span>
            <span className="p-2 rounded-xl bg-orange-50 text-[#C2410C]">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#292524] font-mono">
            {metrics.todayOrderCount} Adet
          </div>
          <p className="text-xs text-[#16A34A] font-semibold mt-2">
            {metrics.completedCount} Tamamlandı • {metrics.cancelledCount} İptal
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Ortalama Sepet</span>
            <span className="p-2 rounded-xl bg-orange-50 text-[#C2410C]">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#292524] font-mono">
            {metrics.averageOrderValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
          </div>
          <p className="text-xs text-stone-400 font-medium mt-2">
            Sipariş başına ortalama tutar
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Mutfak Yükü</span>
            <span className="p-2 rounded-xl bg-orange-50 text-[#C2410C]">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#292524] font-mono">
            {metrics.preparingCount} Hazırlanıyor
          </div>
          <p className="text-xs text-stone-400 font-medium mt-2">
            {metrics.readyCount} Teslime hazır bekliyor
          </p>
        </div>
      </div>

      {/* Hourly Sales Chart & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Hourly Revenue Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-extrabold text-[#292524]">Saatlik Ciro Dağılımı</h3>
                <p className="text-xs text-stone-400">Günün saatlerine göre canlı sipariş yoğunluğu</p>
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="h-48 flex items-end gap-2 pt-6 pb-2 border-b border-stone-100">
              {metrics.hourlyRevenue.map((item, idx) => {
                const heightPercent = maxHourlyRev > 0 && item.revenue > 0 
                  ? Math.max(12, Math.round((item.revenue / maxHourlyRev) * 100)) 
                  : 4

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#292524] text-white text-[10px] py-1 px-2 rounded-md font-mono whitespace-nowrap z-10 pointer-events-none">
                      {item.revenue.toFixed(2)} {currency} ({item.count} sipariş)
                    </div>

                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        item.revenue > 0 ? 'bg-[#C2410C] hover:bg-[#EA580C]' : 'bg-stone-100'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[9px] text-stone-400 font-mono rotate-45 md:rotate-0 mt-1">
                      {item.hour.slice(0, 2)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="text-right text-[11px] text-stone-400 font-medium pt-3">
            Toplam Saatlik Veri: {metrics.todayOrderCount} Sipariş
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#292524] mb-1">Ödeme Yöntemleri Dağılımı</h3>
            <p className="text-xs text-stone-400 mb-6">Bugün kasaya giren ödemelerin kanalları</p>

            <div className="space-y-4">
              <PaymentProgressRow
                name="Nakit (Kasa)"
                amount={metrics.cashTotal}
                percent={getPercent(metrics.cashTotal)}
                icon={Banknote}
                currency={currency}
              />
              <PaymentProgressRow
                name="Banka Kartı / POS"
                amount={metrics.cardTotal}
                percent={getPercent(metrics.cardTotal)}
                icon={CreditCard}
                currency={currency}
              />
              <PaymentProgressRow
                name="Tablet Kiosk POS"
                amount={metrics.kioskPosTotal}
                percent={getPercent(metrics.kioskPosTotal)}
                icon={TabletSmartphone}
                currency={currency}
              />
              <PaymentProgressRow
                name="BLIK / Mobil"
                amount={metrics.blikTotal}
                percent={getPercent(metrics.blikTotal)}
                icon={Smartphone}
                currency={currency}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-between items-center text-xs font-bold">
            <span className="text-stone-500">Toplam Tahsilat:</span>
            <span className="text-[#292524] font-mono text-sm">
              {metrics.todayRevenue.toFixed(2)} {currency}
            </span>
          </div>
        </div>

      </div>

      {/* Top Selling Products Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <h3 className="text-base font-extrabold text-[#292524] mb-4">
          Günün En Çok Satan Menü Kalemleri (Canlı)
        </h3>
        
        {metrics.topSellingItems.length === 0 ? (
          <div className="py-10 text-center text-stone-400 text-xs">
            <Inbox className="w-8 h-8 text-stone-300 mx-auto mb-2 stroke-[1.5]" />
            <span>Bugün henüz bir ürün satışı gerçekleşmedi.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {metrics.topSellingItems.map((item, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-[#FAFAF9] border border-stone-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-orange-50 text-[#C2410C] font-bold text-xs flex items-center justify-center font-mono border border-orange-200">
                    {i + 1}
                  </span>
                  <span className="font-bold text-[#292524] text-sm">{item.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs text-stone-500 font-medium">{item.count} adet satıldı</span>
                  <span className="text-sm font-extrabold text-[#292524] font-mono">
                    {item.revenue.toFixed(2)} {currency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function PaymentProgressRow({ name, amount, percent, icon: Icon, currency }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5 font-bold">
        <span className="text-[#292524] flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-stone-400" />
          {name}
        </span>
        <span className="text-stone-700 font-mono">
          {amount.toFixed(2)} {currency} ({percent}%)
        </span>
      </div>
      <div className="w-full bg-stone-100 rounded-full h-2">
        <div
          className="bg-[#C2410C] h-2 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export default Reports
