import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Lock, AlertCircle } from 'lucide-react';
import { useKiosk } from '../context/KioskContext';

export default function LogoutPINModal({ isOpen, onClose }) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { t } = useKiosk();

  if (!isOpen) return null;

  const handleLogout = async () => {
    if (pin === '1234') {
      try {
        await supabase.auth.signOut();
        localStorage.removeItem('kiosk_restaurant_id');
        localStorage.removeItem('kiosk_restaurant_name');
        localStorage.removeItem('kiosk_currency');
        window.location.reload();
      } catch (err) {
        setErrorMsg('Çıkış yapılamadı: ' + err.message);
      }
    } else {
      setErrorMsg('Hatalı PIN. Lütfen tekrar deneyin.');
      setPin('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogout();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center touch-press"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center mb-4 text-rose-600">
          <Lock className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-black text-slate-900 mb-2">Çıkış Yap</h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          Kiosk oturumunu kapatmak için lütfen 4 haneli yönetici PIN kodunu giriniz.
        </p>

        {errorMsg && (
          <div className="w-full mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="w-full space-y-4">
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={handleKeyPress}
            placeholder="****"
            className="w-full px-4 py-3 text-center tracking-[1em] rounded-xl bg-slate-50 border border-slate-200 text-2xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-rose-500"
            autoFocus
          />
          <button
            onClick={handleLogout}
            disabled={pin.length !== 4}
            className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 touch-press transition-all"
          >
            Onayla ve Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}
