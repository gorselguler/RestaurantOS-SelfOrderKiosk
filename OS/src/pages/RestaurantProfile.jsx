import React, { useState } from 'react'
import { Building2, Save, MapPin, Phone, Mail, Globe, Clock, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function RestaurantProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({
    name: user?.restaurantName || 'Gusto Bistro & Café',
    currency: 'PLN (zł)',
    taxNumber: 'PL 5252849102',
    phone: '+48 22 890 12 34',
    email: 'contact@gustobistro.com',
    address: 'ul. Marszałkowska 104, 00-017 Warszawa, Polonya',
    timezone: 'Europe/Warsaw (GMT+1)',
    openingHours: '08:00 - 23:00'
  })

  const [isSaved, setIsSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="p-8 space-y-8 bg-[#FAFAF9] min-h-full overflow-y-auto">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#C2410C] flex items-center justify-center border border-orange-200">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#292524]">Restoran Profili & Kurumsal Ayarlar</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              İşletme adı, fiş bilgileri, para birimi ve resmi fatura detayları.
            </p>
          </div>
        </div>

        {isSaved && (
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-[#16A34A] border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Değişiklikler Kaydedildi
          </span>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 space-y-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-2">Restoran / İşletme Adı</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#C2410C] text-sm font-semibold text-[#292524] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-2">Para Birimi & Fiş Formatı</label>
            <select
              value={profile.currency}
              onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#C2410C] text-sm font-semibold text-[#292524] outline-none"
            >
              <option value="PLN (zł)">PLN (zł) - Polonya Zlotisi</option>
              <option value="TRY (₺)">TRY (₺) - Türk Lirası</option>
              <option value="EUR (€)">EUR (€) - Euro</option>
              <option value="USD ($)">USD ($) - US Dollar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-2">Vergi / NIP Numarası</label>
            <input
              type="text"
              value={profile.taxNumber}
              onChange={(e) => setProfile({ ...profile, taxNumber: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#C2410C] text-sm font-mono text-[#292524] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-2">Telefon Numarası</label>
            <input
              type="text"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#C2410C] text-sm text-[#292524] outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-stone-700 uppercase mb-2">Açık Adres (Fiş ve Faturalarda Görünür)</label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#C2410C] text-sm text-[#292524] outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-[#C2410C] hover:bg-[#EA580C] text-white rounded-xl font-bold text-sm shadow-md shadow-[#C2410C]/20 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Ayarları Kaydet</span>
          </button>
        </div>
      </form>

    </div>
  )
}
