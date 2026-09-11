import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import {
  TabletSmartphone,
  Tv,
  Monitor,
  Plus,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Trash2,
  Clock,
  Wifi,
  WifiOff,
  Sparkles,
  Lock,
  UserCheck,
  ShieldCheck,
  XCircle,
  ChefHat
} from 'lucide-react'

export function DeviceManagement() {
  const { user } = useAuth()
  const restaurantId = user?.restaurant_id

  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successData, setSuccessData] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'kiosk', // 'kiosk' | 'cashier' | 'kitchen'
    pinCode: '1234'
  })

  // 1. Fetch Devices & Staff Profiles
  const fetchDevices = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .in('role', ['kiosk', 'cashier', 'kitchen'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setDevices(data || [])
    } catch (err) {
      console.error('Error fetching devices:', err)
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  // 2. Handle Create Staff / Device Account (Hybrid: Edge Function -> RPC Fallback)
  const handleCreateDevice = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.password) return

    setSubmitting(true)
    setErrorMsg(null)
    setSuccessData(null)

    const payload = {
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: formData.role,
      fullName: formData.fullName || `${formData.role.toUpperCase()} Cihazı`,
      pinCode: formData.pinCode || '1234'
    }

    try {
      let result = null

      // Attempt 1: Call Supabase Edge Function
      try {
        console.log('🚀 Invoking Edge Function: create-staff-account...')
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('create-staff-account', {
          body: payload
        })

        if (!edgeErr && edgeData && !edgeData.error) {
          result = edgeData
          console.log('✅ Created via Edge Function:', result)
        } else if (edgeErr) {
          console.warn('⚠️ Edge Function not deployed or failed, falling back to database RPC:', edgeErr)
        }
      } catch (edgeCallErr) {
        console.warn('⚠️ Edge Function invocation error, switching to RPC:', edgeCallErr)
      }

      // Attempt 2: Direct PostgreSQL Security Definer RPC (Instant, 100% Reliable)
      if (!result) {
        console.log('⚡ Calling PostgreSQL RPC: create_staff_account...')
        const { data: rpcData, error: rpcErr } = await supabase.rpc('create_staff_account', {
          p_email: payload.email,
          p_password: payload.password,
          p_role: payload.role,
          p_full_name: payload.fullName,
          p_pin_code: payload.pinCode
        })

        if (rpcErr) throw rpcErr
        if (rpcData && rpcData.error) throw new Error(rpcData.error)
        result = rpcData
        console.log('✅ Created via PostgreSQL RPC:', result)
      }

      setSuccessData({
        email: formData.email,
        password: formData.password,
        role: formData.role,
        fullName: formData.fullName
      })

      // Reset form & refresh device list
      setFormData({
        email: '',
        password: '',
        fullName: '',
        role: 'kiosk',
        pinCode: '1234'
      })

      fetchDevices()
    } catch (err) {
      console.error('❌ Error creating staff account:', err)
      setErrorMsg(err.message || 'Hesap oluşturulurken bir hata meydana geldi.')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Device Profile
  const handleDeleteProfile = async (id) => {
    if (!window.confirm('Bu cihaz/personel hesabını silmek istediğinize emin misiniz?')) return
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) throw error
      setDevices((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      alert('Silme işlemi başarısız: ' + err.message)
    }
  }

  return (
    <div className="p-8 space-y-8 bg-[#FAFAF9] min-h-full overflow-y-auto select-none">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#C2410C] flex items-center justify-center border border-orange-200">
            <TabletSmartphone className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-[#292524]">Cihaz & Kiosk Yönetimi</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Güvenli Hesap Motoru
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Tablet Kiosk, Kasa ve Mutfak ekranları için güvenli oturum kimlikleri oluşturun ve yönetin.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null)
            setSuccessData(null)
            setModalOpen(true)
          }}
          className="px-6 py-3.5 bg-[#C2410C] hover:bg-orange-700 active:bg-orange-800 text-white rounded-2xl font-black text-xs shadow-lg shadow-orange-600/25 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Yeni Kiosk / Cihaz Hesabı Oluştur</span>
        </button>
      </div>

      {/* Device Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 flex flex-col items-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#C2410C] mb-2" />
          <span className="text-xs font-bold">Cihazlar listeleniyor...</span>
        </div>
      ) : devices.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#C2410C] flex items-center justify-center mb-4">
            <TabletSmartphone className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-[#292524]">Henüz Bağlı Cihaz Bulunmuyor</h3>
          <p className="text-xs text-stone-400 max-w-sm mt-1 mb-5">
            Tablet Kiosk uygulamanızın (/self_order_kiosk) menünüze bağlanabilmesi için ilk cihaz hesabını oluşturun.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-3 bg-[#C2410C] text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
          >
            + İlk Kiosk Hesabını Oluştur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => {
            const isKiosk = device.role === 'kiosk'
            const isKitchen = device.role === 'kitchen'

            return (
              <div
                key={device.id}
                className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          isKitchen
                            ? 'bg-purple-50 text-purple-600 border border-purple-200'
                            : 'bg-orange-50 text-[#C2410C] border border-orange-200'
                        }`}
                      >
                        {isKitchen ? <ChefHat className="w-6 h-6" /> : <TabletSmartphone className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-black text-[#292524] text-base">{device.full_name || 'Cihaz'}</h4>
                        <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                          {isKiosk ? 'Müşteri Tablet Kiosku' : isKitchen ? 'Mutfak Ekranı (KDS)' : 'Kasa POS'}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-[#16A34A] border border-emerald-200">
                      Aktif
                    </span>
                  </div>

                  <div className="space-y-2 py-3 border-y border-stone-100 text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span className="text-stone-400 font-medium">Rol Yetkisi:</span>
                      <span className="font-bold uppercase text-[#292524]">{device.role}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span className="text-stone-400 font-medium">Hızlı Giriş PIN:</span>
                      <span className="font-mono font-black text-[#C2410C] tracking-widest">{device.pin_code || '1234'}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span className="text-stone-400 font-medium">Kayıt Tarihi:</span>
                      <span className="font-semibold text-stone-700">
                        {new Date(device.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 font-medium">
                    ID: {device.id.substring(0, 8)}...
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteProfile(device.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Cihazı Kaldır"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE DEVICE / STAFF MODAL */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 border border-stone-200 shadow-2xl">
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#C2410C] flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#292524]">Yeni Kiosk / Cihaz Hesabı</h3>
                  <span className="text-xs text-stone-400 font-medium">Admin Yetkili Güvenli Kayıt</span>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 text-stone-400 hover:text-stone-700">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successData ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Cihaz Hesabı Başarıyla Oluşturuldu!</span>
                  </div>
                  <p>Bu hesap Admin oturumunuzu kesmeden güvenli şekilde oluşturuldu.</p>
                  
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 font-mono text-xs text-stone-800 space-y-1 mt-2">
                    <div><strong>E-Posta:</strong> {successData.email}</div>
                    <div><strong>Şifre:</strong> {successData.password}</div>
                    <div><strong>Rol:</strong> {successData.role}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
                  👉 Tablet Kiosk uygulamasında (<strong>/self_order_kiosk</strong>) bu e-posta ve şifre ile giriş yapabilirsiniz.
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSuccessData(null)
                    setModalOpen(false)
                  }}
                  className="w-full py-3.5 bg-[#292524] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Tamamlandı / Kapat
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateDevice} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-stone-700 uppercase mb-1">
                    Cihaz Türü (Rol) *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-[#292524] outline-none"
                  >
                    <option value="kiosk">Müşteri Sipariş Kiosku (Tablet)</option>
                    <option value="cashier">Kasa / POS Terminali</option>
                    <option value="kitchen">Mutfak Ekranı (KDS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-stone-700 uppercase mb-1">
                    Cihaz / Konum Adı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Kiosk #1 - Giriş Tablet"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-[#292524] outline-none focus:ring-2 focus:ring-[#C2410C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-stone-700 uppercase mb-1">
                    Cihaz E-Posta Adresi *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="kiosk1@restoran.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-[#292524] outline-none focus:ring-2 focus:ring-[#C2410C]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-stone-700 uppercase mb-1">
                      Şifre (Min 6 Karakter) *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-[#292524] outline-none focus:ring-2 focus:ring-[#C2410C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-stone-700 uppercase mb-1">
                      Hızlı PIN Kodu (4 Hane)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="1234"
                      value={formData.pinCode}
                      onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-[#292524] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-all"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-[#C2410C] hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Oluşturuluyor...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Hesabı Güvenle Oluştur</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  )
}

export default DeviceManagement
