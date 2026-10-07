import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('dhanashri_cart') || localStorage.getItem('pulsebio_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('dhanashri_cart', JSON.stringify(cartItems));
      localStorage.setItem('pulsebio_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to sync cart', e);
    }
  }, [cartItems]);

  const addToCart = (item, type = 'test') => {
    const exists = cartItems.find((ci) => ci.id === item.id && ci.type === type);
    if (!exists) {
      const price = parseFloat(item.discount_price || item.price || item.original_price || 0);
      setCartItems((prev) => [
        ...prev,
        {
          id: item.id,
          name: item.name,
          type, // 'test' or 'package'
          price,
          originalPrice: parseFloat(item.price || item.original_price || price),
          sampleType: item.sample_type || 'Blood',
          reportTime: item.report_time || 'Same Day',
          fastingRequired: item.fasting_required || false,
        },
      ]);
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (id, type) => {
    setCartItems((prev) => prev.filter((ci) => !(ci.id === id && ci.type === type)));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price || 0), 0);
  const totalSavings = cartItems.reduce((acc, item) => acc + Math.max(0, (item.originalPrice || 0) - (item.price || 0)), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        subtotal,
        totalSavings,
        itemCount: cartItems.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
