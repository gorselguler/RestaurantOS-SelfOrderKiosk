import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { translations } from '../data/translations';
import { supabase } from '../lib/supabaseClient';
import { applyTheme } from '../data/themes';

const KioskContext = createContext();

export function KioskProvider({ children }) {
  const [language, setLanguage] = useState('tr');
  const [orderType, setOrderType] = useState('dine_in'); // 'dine_in' | 'takeaway'
  const [currentStep, setCurrentStep] = useState('welcome'); // 'welcome' | 'menu'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Real database dynamic state
  const [restaurantId, setRestaurantId] = useState(() => localStorage.getItem('kiosk_restaurant_id') || null);
  const [restaurantName, setRestaurantName] = useState(() => localStorage.getItem('kiosk_restaurant_name') || 'Restaurant OS');
  const [currency, setCurrency] = useState(() => localStorage.getItem('kiosk_currency') || 'PLN');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);

  // White-Label Settings
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('kiosk_theme_color') || 'orange');
  const [restaurantLogoUrl, setRestaurantLogoUrl] = useState(() => localStorage.getItem('kiosk_restaurant_logo') || null);
  const [customRestaurantName, setCustomRestaurantName] = useState(() => localStorage.getItem('kiosk_custom_restaurant_name') || '');

  useEffect(() => {
    applyTheme(themeColor);
  }, [themeColor]);

  // Cart & Modals
  const [cart, setCart] = useState([]);
  const [customizingProduct, setCustomizingProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSecretSettings, setShowSecretSettings] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Authentication & Restaurant ID Resolution
  const initAuth = useCallback(async () => {
    try {
      let activeRestId = localStorage.getItem('kiosk_restaurant_id');

      // Check active Supabase Auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('restaurant_id, full_name, role, restaurants(name, currency)')
          .eq('id', session.user.id)
          .single();

        if (profile?.restaurant_id) {
          activeRestId = profile.restaurant_id;
          localStorage.setItem('kiosk_restaurant_id', activeRestId);
          if (profile.restaurants) {
            setRestaurantName(profile.restaurants.name || 'Restaurant OS');
            setCurrency(profile.restaurants.currency || 'PLN');
            localStorage.setItem('kiosk_restaurant_name', profile.restaurants.name);
            localStorage.setItem('kiosk_currency', profile.restaurants.currency || 'PLN');
          }
        }
      }

      // Fallback: If not found in session, fetch first restaurant
      if (!activeRestId) {
        const { data: restList } = await supabase.from('restaurants').select('id, name, currency').limit(1);
        if (restList && restList.length > 0) {
          activeRestId = restList[0].id;
          localStorage.setItem('kiosk_restaurant_id', activeRestId);
          setRestaurantName(restList[0].name);
          setCurrency(restList[0].currency || 'PLN');
        }
      }

      setRestaurantId(activeRestId);
    } catch (e) {
      console.error('❌ Kiosk Auth Init Error:', e);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // 2. Fetch Categories & Products from Supabase
  const fetchMenuFromSupabase = useCallback(async () => {
    if (!restaurantId) {
      setMenuLoading(false);
      return;
    }

    try {
      setMenuLoading(true);

      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true });

      if (catErr) throw catErr;

      const { data: itemData, error: itemErr } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (itemErr) throw itemErr;

      const formattedCats = (catData || []).map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || 'Utensils',
        sortOrder: cat.sort_order
      }));

      const formattedProducts = (itemData || []).map((item) => {
        // Safely parse & normalize customizations — handle string, null, undefined, or non-array
        let safeCustomizations = [];
        try {
          let raw = item.customizations;
          if (typeof raw === 'string') {
            raw = JSON.parse(raw);
          }
          if (Array.isArray(raw)) {
            safeCustomizations = raw
              .filter((g) => g && typeof g === 'object')
              .map((g, gIdx) => ({
                id: String(g.id || `g_${gIdx}`),
                name: (() => {
                  const n = g.name;
                  if (!n) return `Group ${gIdx + 1}`;
                  if (typeof n === 'string') return n;
                  if (typeof n === 'object') return n.tr || n.en || n.pl || Object.values(n)[0] || `Group ${gIdx + 1}`;
                  return String(n);
                })(),
                type: g.type === 'single' ? 'single' : 'multiple',
                required: Boolean(g.required),
                maxSelections: parseInt(g.maxSelections, 10) || (g.type === 'single' ? 1 : 10),
                options: Array.isArray(g.options)
                  ? g.options
                      .filter((opt) => opt && typeof opt === 'object')
                      .map((opt, oIdx) => ({
                        id: String(opt.id || `opt_${g.id || gIdx}_${oIdx}`),
                        name: (() => {
                          const n = opt.name;
                          if (!n) return `Option ${oIdx + 1}`;
                          if (typeof n === 'string') return n;
                          if (typeof n === 'object') return n.tr || n.en || n.pl || Object.values(n)[0] || `Option ${oIdx + 1}`;
                          return String(n);
                        })(),
                        price: parseFloat(opt.price || 0) || 0,
                      }))
                  : [],
              }));
          }
        } catch (parseErr) {
          console.warn(`⚠️ Failed to parse customizations for item ${item.id}:`, parseErr);
          safeCustomizations = [];
        }

        return {
          id: item.id,
          categoryId: item.category_id,
          name: item.name,
          description: item.description,
          price: parseFloat(item.price || 0),
          image: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
          isAvailable: item.is_available,
          isFeatured: item.is_featured,
          badge: item.is_featured ? 'chef' : null,
          customizations: safeCustomizations,
          customizable: safeCustomizations.length > 0,
        };
      });

      setCategories(formattedCats);
      setProducts(formattedProducts);
    } catch (err) {
      console.error('❌ Error fetching Kiosk menu:', err);
    } finally {
      setMenuLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      fetchMenuFromSupabase();
    }
  }, [restaurantId, fetchMenuFromSupabase]);

  // 3. Realtime Listener on Categories and Menu Items
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`kiosk-menu-sync-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => fetchMenuFromSupabase()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => fetchMenuFromSupabase()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchMenuFromSupabase]);

  // Translation helpers
  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  const l = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[language] || obj['en'] || obj['tr'] || Object.values(obj)[0] || '';
  };

  // Cart Calculations
  const cartSummary = useMemo(() => {
    let totalItems = 0;
    let totalPrice = 0;

    cart.forEach((item) => {
      totalItems += item.quantity;
      const unitPrice = parseFloat(item.unitPrice ?? item.product.price ?? 0);
      totalPrice += unitPrice * item.quantity;
    });

    return { totalItems, totalPrice };
  }, [cart]);

  // Add to cart
  const addToCart = (product, customization = null) => {
    const selectedOptions = customization?.selectedOptions || [];
    const selectedSauces = customization?.sauces || [];
    const removals = customization?.removals || [];
    const addons = customization?.addons || [];
    const quantity = customization?.quantity || 1;

    // Calculate options total
    const optionsTotal = selectedOptions.reduce((sum, opt) => sum + (parseFloat(opt.price) || 0), 0);
    const addonsTotal = addons.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
    const unitPrice = parseFloat(customization?.unitPrice ?? (product.price + optionsTotal + addonsTotal));

    // Build unique deterministic hash key for identical customization bundling
    const optKey = selectedOptions
      .map((o) => `${o.groupId || ''}:${o.optionId || o.name}:${o.price || 0}`)
      .sort()
      .join('|');
    const sauceKey = selectedSauces.map((s) => (typeof s === 'object' ? s.id || s.name : s)).sort().join(',');
    const remKey = removals.sort().join(',');
    const addKey = addons.map((a) => (typeof a === 'object' ? a.id || a.label || a.name : a)).sort().join(',');

    const customizationKey = `${product.id}__opt[${optKey}]__sauces[${sauceKey}]__rem[${remKey}]__add[${addKey}]`;

    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.customizationKey === customizationKey);

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      } else {
        const newItem = {
          id: uniqueId,
          customizationKey,
          product,
          selectedOptions,
          sauces: selectedSauces,
          removals,
          addons,
          quantity,
          unitPrice
        };
        return [...prevCart, newItem];
      }
    });

    setCustomizingProduct(null);
  };

  const updateCartQuantity = (cartItemId, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (cartItemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const startOrder = (selectedOrderType = 'dine_in') => {
    setOrderType(selectedOrderType);
    setCurrentStep('menu');
  };

  // 4. Complete Order (Safely sanitizes items and parameters)
  const completeOrder = async (notesParam = '') => {
    if (cart.length === 0 || isSubmitting) return;

    // Sanitize customer notes in case a React SyntheticEvent was passed
    const cleanCustomerNotes = typeof notesParam === 'string' ? notesParam.trim() : '';

    let userRestaurantId = restaurantId || localStorage.getItem('kiosk_restaurant_id');

    // Ensure restaurant_id is resolved before submitting
    if (!userRestaurantId) {
      try {
        const { data: restData } = await supabase.from('restaurants').select('id').limit(1);
        if (restData && restData.length > 0) {
          userRestaurantId = restData[0].id;
          setRestaurantId(userRestaurantId);
          localStorage.setItem('kiosk_restaurant_id', userRestaurantId);
        }
      } catch (e) {
        console.error('Error fetching fallback restaurant:', e);
      }
    }

    if (!userRestaurantId) {
      console.error('❌ Critical: Cannot submit order because restaurant_id is missing.');
      alert('Restoran bağlantısı kurulamadı. Lütfen cihazınızı yeniden yetkilendiriniz.');
      return;
    }

    setIsSubmitting(true);
    let generatedOrderNo = Math.floor(100 + Math.random() * 900);
    let orderId = null;

    try {
      // Clean serializable items payload (removes DOM nodes, fiber pointers, complex methods)
      const sanitizedItems = cart.map((item) => ({
        id: item.id,
        product_id: item.product?.id,
        name: item.product?.name?.tr || item.product?.name?.en || item.product?.name || 'Ürün',
        price: parseFloat(item.unitPrice || item.product?.price || 0),
        unitPrice: parseFloat(item.unitPrice || item.product?.price || 0),
        quantity: item.quantity,
        selected_options: Array.isArray(item.selectedOptions) ? item.selectedOptions : [],
        sauces: Array.isArray(item.sauces)
          ? item.sauces.map((s) => (typeof s === 'object' ? s.name?.tr || s.name || s.id : s))
          : [],
        removals: Array.isArray(item.removals) ? item.removals : [],
        addons: Array.isArray(item.addons)
          ? item.addons.map((a) => (typeof a === 'object' ? { label: a.label || a.name, price: a.price } : a))
          : []
      }));

      const orderPayload = {
        restaurant_id: userRestaurantId,
        source: 'kiosk',
        order_type: orderType,
        status: 'PAYMENT_PENDING',
        payment_status: 'UNPAID',
        payment_method: 'PAY_AT_CASHIER',
        total_amount: cartSummary.totalPrice,
        items: sanitizedItems,
        customer_notes: cleanCustomerNotes || null
      };

      console.log('📤 Submitting order to Supabase:', orderPayload);

      const { data, error } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select('id, order_number, daily_order_number, status, total_amount')
        .single();

      if (error) {
        console.error('❌ Supabase Order Insertion Error (Check RLS):', error);
        alert('Sipariş kaydedilirken bir hata oluştu: ' + error.message);
      } else if (data) {
        generatedOrderNo = data.order_number || data.daily_order_number || generatedOrderNo;
        orderId = data.id;
        console.log('🎉 Order Placed Successfully in Supabase!', data);
      }
    } catch (e) {
      console.error('❌ Unexpected error in completeOrder:', e);
      alert('Sipariş gönderilirken beklenmeyen bir hata oluştu: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }

    setOrderSuccessData({
      orderId,
      orderNumber: generatedOrderNo,
      total: cartSummary.totalPrice,
      itemsCount: cartSummary.totalItems,
      orderType,
      items: [...cart],
      placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    setIsCartOpen(false);
    clearCart();
  };

  const resetToWelcome = () => {
    setOrderSuccessData(null);
    setIsCartOpen(false);
    setCustomizingProduct(null);
    clearCart();
    setCurrentStep('welcome');
    setSelectedCategory('ALL');
  };

  return (
    <KioskContext.Provider
      value={{
        restaurantId,
        setRestaurantId,
        restaurantName,
        setRestaurantName,
        customRestaurantName,
        setCustomRestaurantName: (name) => {
          setCustomRestaurantName(name);
          localStorage.setItem('kiosk_custom_restaurant_name', name || '');
        },
        displayRestaurantName: customRestaurantName || restaurantName,
        currency,
        setCurrency,
        language,
        setLanguage,
        orderType,
        setOrderType,
        currentStep,
        setCurrentStep,
        selectedCategory,
        setSelectedCategory,
        categories,
        products,
        menuLoading,
        themeColor,
        setThemeColor: (color) => {
          setThemeColor(color);
          localStorage.setItem('kiosk_theme_color', color);
        },
        restaurantLogoUrl,
        setRestaurantLogoUrl: (url) => {
          setRestaurantLogoUrl(url);
          localStorage.setItem('kiosk_restaurant_logo', url || '');
        },
        cart,
        cartSummary,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        customizingProduct,
        setCustomizingProduct,
        isCartOpen,
        setIsCartOpen,
        showSecretSettings,
        setShowSecretSettings,
        orderSuccessData,
        completeOrder,
        resetToWelcome,
        startOrder,
        isSubmitting,
        refreshMenu: fetchMenuFromSupabase,
        t,
        l,
      }}
    >
      {children}
    </KioskContext.Provider>
  );
}

export function useKiosk() {
  const context = useContext(KioskContext);
  if (!context) {
    throw new Error('useKiosk must be used within a KioskProvider');
  }
  return context;
}
