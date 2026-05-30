"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: string;
  restaurantId: string;
  restaurantName: string;
}

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (menuItemId: string) => void;
  updateQty: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem("fd_cart") : null;
      if (raw) return JSON.parse(raw) as CartItem[];
    } catch (e) {
      // ignore parse errors
    }
    return [];
  });

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      setItems((prev) => {
        if (prev.length > 0 && prev[0].restaurantId !== item.restaurantId) {
          if (!confirm("Clear cart and add from new restaurant?")) return prev;
          prev = [];
        }
        const existing = prev.find((i) => i.menuItemId === item.menuItemId);
        if (existing) {
          return prev.map((i) =>
            i.menuItemId === item.menuItemId
              ? { ...i, quantity: i.quantity + (item.quantity || 1) }
              : i,
          );
        }
        return [...prev, { ...item, quantity: item.quantity || 1 }];
      });
    },
    [],
  );

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }, []);

  const updateQty = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i)),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const restaurantId = items[0]?.restaurantId ?? null;

  // Persist cart to localStorage so a payment redirect or page refresh doesn't lose it
  useEffect(() => {
    try {
      if (items.length) {
        localStorage.setItem("fd_cart", JSON.stringify(items));
      } else {
        localStorage.removeItem("fd_cart");
      }
    } catch (e) {
      // ignore quota/serialization errors
    }
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
