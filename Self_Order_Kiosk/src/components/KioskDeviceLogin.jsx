import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Tablet, ArrowRight, Lock, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * KioskDeviceLogin
 *
 * Performance contract:
 *  - This component ONLY handles authentication (signInWithPassword + profile fetch).
 *  - It does NOT fetch categories or menu items. That is KioskContext's job.
 *  - On success it stores restaurant data in localStorage and calls onLoginSuccess().
 *  - KioskContext listens to restaurantId state change and starts the menu fetch
 *    independently, displaying its own loading splash screen (menuLoading === true).
 *
 * UX contract:
 *  - Submit button immediately enters loading state on click.
 *  - All form inputs are disabled while loading to prevent double-submit.
 *  - Errors are shown inline, never as alerts.
 */
export default function KioskDeviceLogin({ onLoginSuccess }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // ── Step 1: Auth only — lightweight, fast ──────────────────────────────
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      const user = data?.user;
      if (!user) throw new Error('Kullanıcı oturumu alınamadı.');

      // ── Step 2: Fetch profile (restaurant_id) ──────────────────────────────
      //    This is the ONLY extra query here. Menu data is fetched later in
      //    KioskContext after restaurantId state is set.
      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('id, restaurant_id, role, restaurants(name, currency)')
        .eq('id', user.id)
        .single();

      if (profErr || !profile?.restaurant_id) {
        await supabase.auth.signOut();
        throw new Error('Bu cihaza atanmış geçerli bir restoran profili bulunamadı. Yönetici panelinizden Kiosk kullanıcısı oluşturunuz.');
      }

      console.log('✅ Kiosk Auth OK — transitioning to splash → menu fetch');

      // ── Step 3: Persist to localStorage — KioskContext reads these ─────────
      localStorage.setItem('kiosk_restaurant_id',   profile.restaurant_id);
      localStorage.setItem('kiosk_restaurant_name', profile.restaurants?.name || 'Restaurant OS');
      localStorage.setItem('kiosk_currency',         profile.restaurants?.currency || 'PLN');

      // ── Step 4: Hand off control — menu data fetch happens in KioskContext ─
      //    The parent (MainLayout) will unmount this component and render the
      //    main layout; KioskContext.fetchMenuFromSupabase will fire automatically
      //    via useEffect([restaurantId]) and menuLoading will show the splash screen.
      if (onLoginSuccess) {
        onLoginSuccess(profile.restaurant_id);
      }
    } catch (err) {
      console.error('❌ Kiosk Login Error:', err);
      setErrorMsg(err.message || 'Giriş başarısız. E-posta ve şifrenizi kontrol ediniz.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4 select-none">

      {/* Subtle animated background grid */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 flex flex-col items-center text-center">

        {/* Device icon */}
        <div className="w-20 h-20 rounded-3xl bg-orange-50 border-2 border-orange-200 flex items-center justify-center mb-5 text-[#C2410C] shadow-inner shadow-orange-100">
          <Tablet className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Kiosk Cihaz Girişi
        </h2>
        <p className="text-xs font-semibold text-slate-500 mt-1.5 max-w-xs leading-relaxed">
          Bu tabletin restoran menüsüne bağlanabilmesi için işletme Kiosk kimliği ile oturum açınız.
        </p>

        {/* Error message */}
        {errorMsg && (
          <div className="w-full mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 text-left flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full mt-6 space-y-4 text-left">

          <div>
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">
              Kiosk Cihaz E-Posta
            </label>
            <input
              id="kiosk-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="kiosk1@restoran.com"
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#C2410C] focus:border-[#C2410C] disabled:opacity-60 transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">
              Cihaz Şifresi
            </label>
            <input
              id="kiosk-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#C2410C] focus:border-[#C2410C] disabled:opacity-60 transition-all"
            />
          </div>

          <button
            id="kiosk-login-btn"
            type="submit"
            disabled={isLoading || !email || !password}
            className={`w-full py-4 rounded-2xl text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all mt-2 ${
              isLoading
                ? 'bg-orange-400 shadow-orange-300/30 cursor-not-allowed'
                : 'bg-[#C2410C] hover:bg-orange-700 active:bg-orange-800 shadow-orange-600/30'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Bağlanıyor...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Kiosk Cihazını Başlat</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        <div className="w-full mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
          Kimlik bilgileri Yönetici Paneli (/OS) ➔ <strong className="text-slate-600">Ayarlar</strong> sekmesinden oluşturulur.
        </div>

      </div>
    </div>
  );
}
