import React, { useState } from 'react'
import { CreditCard, CheckCircle2, ShieldCheck, Plus, Sparkles, Smartphone, Landmark, Banknote } from 'lucide-react'

export function PaymentSettings() {
  const [methods, setMethods] = useState([
    { id: 'pay_1', name: 'Kredi / Banka Kartı (POS Terminali)', icon: CreditCard, enabled: true, fee: '%1.2', status: 'active', desc: 'Verifone / Ingenico entegre POS terminalleri' },
    { id: 'pay_2', name: 'BLIK (Hızlı Mobil Ödeme)', icon: Smartphone, enabled: true, fee: '%0.8', status: 'active', desc: 'Kiosk ve kasada 6 haneli kodla anında ödeme' },
    { id: 'pay_3', name: 'Nakit (Kasa Ödemesi)', icon: Banknote, enabled: true, fee: '%0.0', status: 'active', desc: 'Kasada fiziki nakit tahsilatı' },
    { id: 'pay_4', name: 'Apple Pay / Google Pay', icon: Landmark, enabled: true, fee: '%1.2', status: 'active', desc: 'Kiosk temassız NFC okuyucu ile ödeme' }
  ])

  const toggleMethod = (id) => {
    setMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m))
  }

  return (
    <div className="p-8 space-y-8 bg-[#FAFAF9] min-h-full overflow-y-auto">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#C2410C] flex items-center justify-center border border-orange-200">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#292524]">Ödeme Yöntemleri & Entegrasyonlar</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Kiosk tabletleri ve kasa ekranı için aktif ödeme sağlayıcıları.
            </p>
          </div>
        </div>
      </div>

      {/* Methods List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {methods.map((method) => {
          const Icon = method.icon
          return (
            <div
              key={method.id}
              className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#C2410C] border border-orange-200 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#292524] text-sm">{method.name}</h4>
                      <span className="text-[11px] text-stone-400">Komisyon: {method.fee}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleMethod(method.id)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      method.enabled ? 'bg-[#16A34A]' : 'bg-stone-300'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        method.enabled ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-stone-500 mt-2">{method.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-[#16A34A] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Terminal Bağlantısı Başarılı
                </span>
                <button
                  onClick={() => alert('Terminal ayarları')}
                  className="text-stone-500 hover:text-[#C2410C] font-bold"
                >
                  Yapılandır
                </button>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
