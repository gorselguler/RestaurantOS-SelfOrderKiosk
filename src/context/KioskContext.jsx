import React, { createContext, useContext, useState, useMemo } from 'react';
import { translations } from '../data/translations';
import { categories, products } from '../data/menuData';

const KioskContext = createContext();

export function KioskProvider({ children }) {
  const [language, setLanguage] = useState('tr');
  const [orderType, setOrderType] = useState('dine_in'); // 'dine_in' | 'takeaway'
  const [currentStep, setCurrentStep] = useState('welcome'); // 'welcome' | 'menu'
  const [selectedCategory, setSelectedCategory] = useState('kebabs');
  const [cart, setCart] = useState([]);
  const [customizingProduct, setCustomizingProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null); // { orderNumber, total, itemsCount, orderType }

  // Translation helper
  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  // Localized string helper for items
  const l = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[language] || obj['en'] || obj['tr'] || Object.values(obj)[0] || '';
  };

  // Cart Calculations
  const cartSummary = useMemo(() => {
    let totalItems = 0;
    let totalPrice = 0;

    cart.forEach(item => {
      totalItems += item.quantity;
      const basePrice = item.product.price;
      const addonsPrice = (item.addons || []).reduce((sum, addon) => sum + (addon.price || 0), 0);
      const unitPrice = basePrice + addonsPrice;
      totalPrice += unitPrice * item.quantity;
    });

    return { totalItems, totalPrice };
  }, [cart]);

  // Add to cart with or without customizations
  const addToCart = (product, customization = null) => {
    const selectedSauces = customization?.sauces || [];
    const removals = customization?.removals || [];
    const addons = customization?.addons || [];
    const quantity = customization?.quantity || 1;

    // Create unique key based on customizations
    const customizationKey = `${product.id}-${selectedSauces.map(s => s.id).sort().join(',')}-${removals.sort().join(',')}-${addons.map(a => a.id).sort().join(',')}`;

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.customizationKey === customizationKey);

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      } else {
        const newItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          customizationKey,
          product,
          sauces: selectedSauces,
          removals,
          addons,
          quantity,
          unitPrice: product.price + addons.reduce((sum, a) => sum + (a.price || 0), 0)
        };
        return [...prevCart, newItem];
      }
    });

    // Close customization modal if open
    setCustomizingProduct(null);
  };

  // Update item quantity in cart
  const updateCartQuantity = (cartItemId, delta) => {
    setCart(prevCart => {
      return prevCart
        .map(item => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  // Remove specific item from cart
  const removeFromCart = (cartItemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== cartItemId));
  };

  // Clear all items from cart
  const clearCart = () => {
    setCart([]);
  };

  // Start order from Welcome screen
  const startOrder = (selectedOrderType = 'dine_in') => {
    setOrderType(selectedOrderType);
    setCurrentStep('menu');
  };

  // Complete Order
  const completeOrder = () => {
    if (cart.length === 0) return;
    
    // Generate order number like 142
    const generatedOrderNo = Math.floor(100 + Math.random() * 900);
    
    setOrderSuccessData({
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

  // Reset back to welcome screen
  const resetToWelcome = () => {
    setOrderSuccessData(null);
    setIsCartOpen(false);
    setCustomizingProduct(null);
    clearCart();
    setCurrentStep('welcome');
    setSelectedCategory('kebabs');
  };

  return (
    <KioskContext.Provider
      value={{
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
        orderSuccessData,
        completeOrder,
        resetToWelcome,
        startOrder,
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
