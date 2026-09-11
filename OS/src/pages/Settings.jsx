import React, { useState } from 'react'
import { Settings as SettingsIcon, Database, Printer, DollarSign, Save, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { seedKebabTestMenu } from '../utils/seedKebabMenu'

export const Settings = () => {
  const { user } = useAuth()
  const [seeding, setSeeding] = useState(false)

  const handleSeedMenu = async () => {
    if (!user?.restaurant_id) {
      alert('Restaurant ID bulunamadı. Lütfen oturum açınız.')
      return
    }

    if (!window.confirm('Kebab House test menüsü (Sandviç, Dürüm, İskender, Patates, Ayran ve JSONB Özelleştirmeleri) yüklenecek. Onaylıyor musunuz?')) {
      return
    }

    setSeeding(true)
    try {
      const res = await seedKebabTestMenu(user.restaurant_id)
      alert(`🎉 Başarılı! ${res.categoriesCount} kategori ve ${res.itemsCount} ürün veritabanına eklendi. Kiosk uygulamasında anında deneyebilirsiniz!`)
    } catch (err) {
      alert('Menü yüklenirken hata oluştu: ' + err.message)
    } finally {
      setSeeding(false)
    }
  }
  return (
    <div className="flex-1 h-full overflow-y-auto p-8 bg-[#F8FAFC]">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Restoran & Sistem Ayarları
        </h2>
        <p className="text-sm text-slate-500 font-medium">
          POS yapılandırması, para birimi, yazıcı ve Supabase bulut veritabanı ayarları.
        </p>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Restaurant Info Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-brand-600" />
            <span>İşletme Bilgileri</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Restoran Adı</label>
              <input
                type="text"
                defaultValue="Gusto Bistro & Café"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Şube Adı</label>
              <input
                type="text"
                defaultValue="Merkez Şube - Varşova"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Varsayılan Para Birimi</label>
              <select defaultValue="PLN" className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                <option value="PLN">Polonya Zlotisi (PLN - zł)</option>
                <option value="TRY">Türk Lirası (TRY - ₺)</option>
                <option value="EUR">Euro (EUR - €)</option>
                <option value="USD">Amerikan Doları (USD - $)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Servis Bedeli (%)</label>
              <input
                type="number"
                defaultValue="0"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Supabase Cloud Connection Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Supabase Realtime Veritabanı Yapılandırması</span>
            </h3>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Mimari Hazır (Mock / Canlı Geçişi)
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 leading-relaxed">
            Sistem <strong>Supabase JS SDK (@supabase/supabase-js)</strong> ile tam uyumlu hazırlanmıştır. Canlı veritabanınızı bağlamak için kök dizindeki <code>.env</code> dosyasına <code>VITE_SUPABASE_URL</code> ve <code>VITE_SUPABASE_ANON_KEY</code> eklemeniz yeterlidir.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">SUPABASE URL</label>
              <input
                type="text"
                placeholder="https://your-project-id.supabase.co"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">SUPABASE ANON KEY</label>
              <input
                type="password"
                placeholder="eyJh......"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Test Data Generator Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Geliştirici & Test Verisi Oluşturucu</span>
            </h3>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Kiosk Test Ortamı
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Kiosk ürün özelleştirme ve varyasyon motorunu (sos seçimi, malzeme çıkarma, ekstralar) gerçekçi verilerle test etmek için tek tıklamayla Sapko Kebab tarzı zengin test menüsünü yükleyin.
          </p>

          <button
            onClick={handleSeedMenu}
            disabled={seeding}
            className="flex items-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{seeding ? 'Test Menüsü Yükleniyor...' : 'Kebab House Test Menüsünü Yükle (Populate Test Menu)'}</span>
          </button>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 active:scale-95 transition-all">
            <Save className="w-4 h-4" />
            <span>Ayarları Kaydet</span>
          </button>
        </div>
      </div>
    </div>
  )
}
