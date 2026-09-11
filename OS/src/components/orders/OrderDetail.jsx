import React, { useState } from 'react'
import { StatusBadge } from '../common/Badge'
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
  Truck,
  Sparkles,
  ArrowRight,
  RotateCcw,
  XCircle
} from 'lucide-react'

export const OrderDetail = ({
  order,
  onMarkPaidAndSendToKitchen,
  onUpdateStatus
}) => {
  const [printSuccess, setPrintSuccess] = useState(false)

  if (!order) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center text-center p-8 bg-white text-slate-400">
        <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 text-slate-300">
          <Receipt className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-700 mb-1">Sipariş Seçilmedi</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Detayları görüntülemek, ödeme almak ve mutfağa iletmek için sol listeden bir sipariş seçiniz.
        </p>
      </div>
    )
  }

  const isPendingPayment = order.status === 'pending_payment'
  const isPreparing = order.status === 'preparing'
  const isReady = order.status === 'ready'
  const isCompleted = order.status === 'completed'

  const handlePrint = () => {
    setPrintSuccess(true)
    setTimeout(() => setPrintSuccess(false), 2500)
  }

  const formattedDate = new Date(order.createdAt).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="flex-1 h-full flex flex-col bg-white overflow-hidden">
      {/* Top Header Bar of the Detail Pane */}
      <div className="px-8 py-5 border-b border-slate-200/80 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200/80 flex items-center justify-center text-brand-700 font-extrabold text-lg">
            #{order.orderNumber}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Sipariş #{order.orderNumber}
              </h2>
              <StatusBadge status={order.status} className="text-xs px-3 py-1" />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                <Utensils className="w-3.5 h-3.5 text-brand-600" />
                {order.table}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Saat: {formattedDate}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                {order.paymentMethod}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              printSuccess
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Mutfak fişi / adisyon yazdır"
          >
            <Printer className="w-4 h-4" />
            <span>{printSuccess ? 'Yazdırıldı ✓' : 'Adisyon Yazdır'}</span>
          </button>
        </div>
      </div>

      {/* Center Body: Scrollable Items & Notes */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Customer Special Notes (Highlighted) */}
        {order.customerNote && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Müşteri / Mutfak Özel Notu
              </p>
              <p className="text-sm font-semibold text-amber-800 mt-0.5 leading-relaxed">
                "{order.customerNote}"
              </p>
            </div>
          </div>
        )}

        {/* Order Items Header */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sipariş İçeriği ({order.items.length} Kalem)
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Birim / Toplam Fiyat
            </span>
          </div>

          {/* Items List (Large, legible typography) */}
          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/40">
            {order.items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 bg-white hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4"
              >
                {/* Left: Quantity + Title + Variations */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-sm shrink-0 font-mono shadow-sm">
                    {item.quantity}x
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {item.name}
                    </h4>

                    {/* Variations & Add-ons Badges */}
                    {item.options && item.options.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.options.map((opt, oIdx) => (
                          <span
                            key={oIdx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            <span className="text-slate-400 mr-1">{opt.label}:</span>
                            <span className="font-semibold text-slate-800">{opt.value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Item Total */}
                <div className="text-right shrink-0">
                  <div className="text-base font-extrabold text-slate-900 font-mono">
                    {item.itemTotal.toFixed(2)} {order.currency || 'PLN'}
                  </div>
                  {item.quantity > 1 && (
                    <div className="text-xs text-slate-400 font-medium font-mono">
                      (Birim: {item.price.toFixed(2)} {order.currency || 'PLN'})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bill Summary Box */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ödeme ve Masa Özeti
            </span>
            <div className="text-xs text-slate-600 font-medium">
              Ödeme Şekli: <strong className="text-slate-900">{order.paymentMethod}</strong> •
              Konum: <strong className="text-slate-900">{order.table}</strong>
            </div>
          </div>

          <div className="w-full md:w-64 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between font-medium">
              <span>Ara Toplam:</span>
              <span className="font-mono font-semibold text-slate-800">
                {order.subtotal.toFixed(2)} {order.currency || 'PLN'}
              </span>
            </div>
            {order.serviceFee > 0 && (
              <div className="flex justify-between font-medium">
                <span>Hizmet / Kurye Bedeli:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {order.serviceFee.toFixed(2)} {order.currency || 'PLN'}
                </span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900">
              <span className="text-sm font-bold">Genel Toplam:</span>
              <span className="text-xl font-extrabold text-slate-900 font-mono">
                {order.total.toFixed(2)} {order.currency || 'PLN'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Big Prominent Action Footer */}
      <div className="px-8 py-5 border-t border-slate-200/90 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
        {isPendingPayment ? (
          /* PRIMARY GREEN ACTION BUTTON */
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => onMarkPaidAndSendToKitchen(order.id)}
              className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-lg flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all duration-150 active:scale-[0.99] group border border-emerald-500"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <span className="tracking-tight">
                Ödemesi Alındı & Mutfağa Gönder
              </span>
              <ArrowRight className="w-5 h-5 ml-1 opacity-80 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Cancel Order auxiliary button */}
            <button
              onClick={() => onUpdateStatus(order.id, 'cancelled')}
              className="px-4 py-4 rounded-2xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-colors"
              title="Siparişi İptal Et"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Post-Payment Status Stepper / Workflow Actions */
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Mevcut Aşama:</span>
              <StatusBadge status={order.status} className="text-xs" />
            </div>

            <div className="flex items-center gap-2">
              {isPreparing && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'ready')}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Siparişi Hazır Olarak İşaretle</span>
                </button>
              )}

              {isReady && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'completed')}
                  className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Müşteriye / Masaya Teslim Edildi (Tamamla)</span>
                </button>
              )}

              {isCompleted && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="px-3 py-2 bg-slate-100 rounded-lg">
                    Bu sipariş başarıyla tamamlandı ve arşivlendi.
                  </span>
                  <button
                    onClick={() => onUpdateStatus(order.id, 'preparing')}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Tekrar Mutfak Durumuna Al"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
