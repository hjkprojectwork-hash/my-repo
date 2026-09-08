import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, Item } from '@/types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Item, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('campusone_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('campusone_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: Item, quantity: number) => {
    setCart((prev) => {
      // Must come from the same canteen, else clear cart or show error.
      // Let's implement a simple logic: clear if canteen mismatch.
      if (prev.length > 0 && prev[0].item.canteen_id !== item.canteen_id) {
        if (!window.confirm('Adding this item will clear your cart because it is from a different canteen. Continue?')) {
          return prev;
        }
        return [{ item, quantity, subtotal: item.price * quantity }];
      }

      const existingIndex = prev.findIndex((ci) => ci.item.id === item.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        if (updated[existingIndex].quantity > item.available_quantity) {
          updated[existingIndex].quantity = item.available_quantity;
        }
        updated[existingIndex].subtotal = updated[existingIndex].quantity * item.price;
        return updated;
      } else {
        return [...prev, { item, quantity, subtotal: item.price * quantity }];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((ci) => {
        if (ci.item.id === itemId) {
          const newQty = Math.max(1, Math.min(quantity, ci.item.available_quantity));
          return { ...ci, quantity: newQty, subtotal: ci.item.price * newQty };
        }
        return ci;
      })
    );
  };

  const clearCart = () => setCart([]);

  const getCartTotal = () => {
    return cart.reduce((total, ci) => total + ci.item.price * ci.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, ci) => count + ci.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount }}
    >
      {children}
    </CartContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
