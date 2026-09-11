import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLogin) {
        // LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        console.log('Login successful:', data);
        setMessage('Giriş başarılı! Dashboarda yönlendiriliyorsunuz...');
      } else {
        // REGISTER (Sadece Admin)
        if (!companyName.trim()) {
          throw new Error('İşletme adı zorunludur.');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              companyName: companyName,
            }
          }
        });
        if (error) throw error;

        console.log('Register successful:', data);
        setMessage('Kayıt başarılı! Lütfen email adresinizi doğrulayın veya giriş yapın.');
        setIsLogin(true);
      }
    } catch (err) {
      console.error('Auth error:', err.message);
      setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Side - Illustration / Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-blue-500 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-900 opacity-20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white">
            {/* Simple SVG Logo */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-3xl font-bold tracking-tight">Restaurant OS</span>
          </div>
        </div>

        <div className="relative z-10 text-white">
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Restoranınızı <br/>tek bir platformdan yönetin.
          </h1>
          <p className="text-lg text-indigo-100 max-w-md">
            Siparişler, kiosklar, mutfak yönetimi ve daha fazlası. Geleceğin restoran yönetim sistemiyle işinizi büyütün.
          </p>
        </div>

        <div className="relative z-10 flex gap-4 text-sm text-indigo-200">
          <span>&copy; {new Date().getFullYear()} Restaurant OS</span>
          <a href="#" className="hover:text-white transition-colors">Gizlilik Politikası</a>
          <a href="#" className="hover:text-white transition-colors">Hizmet Şartları</a>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              {isLogin ? 'Tekrar Hoş Geldiniz' : 'İşletmenizi Kaydedin'}
            </h2>
            <p className="text-slate-500">
              {isLogin 
                ? 'Hesabınıza giriş yaparak restoranınızı yönetmeye devam edin.' 
                : 'Dakikalar içinde Restaurant OS altyapısını kurun.'}
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}
          {message && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
              <p className="text-sm text-green-700 font-medium">{message}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  İşletme Adı (Company Name)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                  placeholder="Harika Restoranım"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                E-posta Adresi
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                placeholder="ornek@sirket.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 flex justify-center items-center rounded-lg text-white font-semibold transition-all shadow-md hover:shadow-lg
                ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {loading 
                ? 'İşleniyor...' 
                : isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              {isLogin ? 'Henüz hesabınız yok mu?' : 'Zaten bir hesabınız var mı?'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setMessage('');
                }}
                className="ml-2 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {isLogin ? 'Hemen Kayıt Olun' : 'Giriş Yapın'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
