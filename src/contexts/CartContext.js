import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const getNextCartId = cart => {
    if (cart.length === 0) return 1;
    return Math.max(...cart.map(i => i.cartId)) + 1;
  };

  const addToCart = newItem => {
    setCart(prev => {
      const index = prev.findIndex(
        item =>
          item.menuKey === newItem.menuKey &&
          item.optionsSignature === newItem.optionsSignature,
      );

      const optionSum = newItem.options.reduce((s, o) => s + o.price, 0);

      const maxCount = newItem.max ?? 99;

      if (index !== -1) {
        const updated = [...prev];
        const target = updated[index];

        const newCount = Math.min(target.count + newItem.count, maxCount);

        updated[index] = {
          ...target,
          count: newCount,
          totalPrice: (target.basePrice + optionSum) * newCount,
        };

        return updated;
      }

      const initialCount = Math.min(newItem.count, maxCount);

      return [
        ...prev,
        {
          ...newItem,
          cartId: getNextCartId(prev),
          count: initialCount,
          totalPrice: (newItem.basePrice + optionSum) * initialCount,
        },
      ];
    });
  };

  const increaseCount = cartId => {
    setCart(prev =>
      prev.map(item =>
        item.cartId === cartId
          ? {
              ...item,
              count: Math.min(item.count + 1, item.max ?? 99),
              totalPrice:
                (item.basePrice +
                  item.options.reduce((s, o) => s + o.price, 0)) *
                Math.min(item.count + 1, item.max ?? 99),
            }
          : item,
      ),
    );
  };

  const decreaseCount = cartId => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.cartId !== cartId) return item;
          if (item.count === 1) return null;

          return {
            ...item,
            count: item.count - 1,
            totalPrice:
              (item.basePrice + item.options.reduce((s, o) => s + o.price, 0)) *
              (item.count - 1),
          };
        })
        .filter(Boolean),
    );
  };

  const removeItem = cartId => {
    setCart(prev => prev.filter(i => i.cartId !== cartId));
  };

  const clearCart = () => setCart([]);

  const getItemCount = menuKey =>
    cart.filter(i => i.menuKey === menuKey).reduce((s, i) => s + i.count, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseCount,
        decreaseCount,
        removeItem,
        clearCart,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
