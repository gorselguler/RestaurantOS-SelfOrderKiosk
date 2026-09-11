import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Lock, AlertCircle, Settings2, Palette, Image as ImageIcon, LogOut, Maximize, Check } from 'lucide-react';
import { useKiosk } from '../context/KioskContext';
import { themes } from '../data/themes';
import { languages } from '../data/translations';

export default function SecretKioskSettingsModal({ isOpen, onClose }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const { 
    themeColor, 
    setThemeColor, 
    restaurantLogoUrl, 
    setRestaurantLogoUrl,
    language,
    setLanguage,
    t,
    customRestaurantName,
    setCustomRestaurantName,
    restaurantName
  } = useKiosk();

  if (!isOpen) return null;

  const handleUnlock = () => {
    if (pin === '1234') {
      setIsUnlocked(true);
      setErrorMsg('');
      setPin('');
    } else {
      setErrorMsg('Hatalı PIN. Lütfen tekrar deneyin.');
      setPin('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('kiosk_restaurant_id');
      localStorage.removeItem('kiosk_restaurant_name');
      localStorage.removeItem('kiosk_currency');
      window.location.reload();
    } catch (err) {
      setErrorMsg('Çıkış yapılamadı: ' + err.message);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // 1. Instantly update UI with a local Blob URL
      const localUrl = URL.createObjectURL(file);
      setRestaurantLogoUrl(localUrl);

      // 2. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `kiosk_logo_${Date.now()}.${fileExt}`;
      const filePath = `restaurant-kiosk-logo/${fileName}`;

      // Defaulting to a 'public' or 'assets' bucket
      // Adjust the bucket name as needed based on the Supabase setup
      const bucketName = 'public-assets'; 

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) {
        throw error;
      }

      // 3. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;
      setRestaurantLogoUrl(publicUrl);

      // We should ideally save this URL to the `restaurants` table as well.
      // (Skipping actual DB update here, assuming the URL is persisted via Context/LocalStorage for now).

    } catch (err) {
      console.error('Error uploading logo:', err);
      setErrorMsg('Logo yüklenirken hata oluştu. Bucket ayarlarını kontrol edin.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center">
              {isUnlocked ? <Settings2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <h2 className="text-xl font-black text-slate-900">
              {isUnlocked ? 'Sistem Ayarları' : 'Güvenlik Doğrulaması'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 touch-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col items-center">
          
          {!isUnlocked ? (
            <div className="w-full max-w-sm flex flex-col items-center py-4">
              <p className="text-sm text-slate-500 text-center mb-6">
                Ayarlara erişmek için lütfen 4 haneli yönetici PIN kodunu giriniz. (Varsayılan: 1234)
              </p>

              {errorMsg && (
                <div className="w-full mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={handleKeyPress}
                placeholder="****"
                className="w-full px-4 py-3 text-center tracking-[1em] rounded-xl bg-slate-50 border border-slate-200 text-2xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-slate-500 mb-4"
                autoFocus
              />
              <button
                onClick={handleUnlock}
                disabled={pin.length !== 4}
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 touch-press transition-all"
              >
                Onayla
              </button>
            </div>
          ) : (
            <div className="w-full space-y-8">
              
              {/* Theme Customization */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-5 h-5 text-brand-500" />
                  <h3 className="font-black text-slate-800 text-sm">Tema Rengi</h3>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(themes).map(([key, palette]) => (
                    <button
                      key={key}
                      onClick={() => setThemeColor(key)}
                      style={{ backgroundColor: palette[500] }}
                      className={`h-12 rounded-xl flex items-center justify-center touch-press transition-all ${
                        themeColor === key ? 'ring-4 ring-offset-2 ring-slate-800 shadow-md scale-105' : 'hover:scale-105'
                      }`}
                      title={palette.name}
                    >
                      {themeColor === key && <Check className="w-5 h-5 text-white" />}
                    </button>
                  ))}
                </div>
              </section>

              {/* Logo Upload */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="w-5 h-5 text-brand-500" />
                  <h3 className="font-black text-slate-800 text-sm">Restoran Bilgileri</h3>
                </div>
                
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  {/* Name Edit */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Gösterilecek İsim</label>
                    <input 
                      type="text" 
                      value={customRestaurantName || ''} 
                      onChange={(e) => setCustomRestaurantName(e.target.value)} 
                      placeholder={restaurantName || 'Restoran Adı'} 
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-brand-500" 
                    />
                  </div>

                  {/* Logo Edit */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Restoran Logosu</label>
                    <div className="flex items-center gap-4">
                      {restaurantLogoUrl ? (
                        <img src={restaurantLogoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover bg-white shadow-sm border border-slate-200" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 border border-slate-200">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <label className="relative flex items-center justify-center w-full py-2 px-3 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-brand-400 hover:bg-brand-50 transition-colors cursor-pointer touch-press">
                          <span className="text-xs font-bold text-slate-600">
                            {uploading ? 'Yükleniyor...' : 'Yeni Logo Seç'}
                          </span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleLogoUpload}
                            disabled={uploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Action Buttons (Moved from top-right) */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Settings2 className="w-5 h-5 text-brand-500" />
                  <h3 className="font-black text-slate-800 text-sm">Hızlı İşlemler</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button onClick={handleFullscreen} className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 touch-press">
                    <Maximize className="w-4 h-4" /> Tam Ekran
                  </button>
                  <button onClick={handleLogout} className="p-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 touch-press">
                    <LogOut className="w-4 h-4" /> Cihazdan Çıkış
                  </button>
                </div>

                {/* Language Override */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-500 mb-2">Varsayılan Dil</h4>
                  <div className="flex gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`flex-1 py-2 rounded-lg font-black text-xs transition-all touch-press ${
                          language === lang.code
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {lang.flag} {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
