"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "imart-cart";
const EMPTY: CartItem[] = [];

// The cart lives in localStorage; this small store keeps every subscriber (and other tabs) in sync.
const listeners = new Set<() => void>();
let cached: CartItem[] | null = null;

function readCart(): CartItem[] {
  if (cached) return cached;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    cached = Array.isArray(parsed) ? (parsed as CartItem[]) : EMPTY;
  } catch {
    cached = EMPTY; // corrupted cart — start fresh
  }
  return cached;
}

function writeCart(next: CartItem[]) {
  cached = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked — the cart still works for this page view
  }
  listeners.forEach((listener) => listener());
}

const updateCart = (change: (items: CartItem[]) => CartItem[]) => writeCart(change(readCart()));

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    cached = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const noopSubscribe = () => () => {};

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  hydrated: boolean;
}

const actions = {
  addItem: (item: Omit<CartItem, "quantity">, quantity = 1) =>
    updateCart((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { ...item, quantity }];
    }),
  removeItem: (productId: string) => updateCart((prev) => prev.filter((i) => i.productId !== productId)),
  setQuantity: (productId: string, quantity: number) =>
    updateCart((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    ),
  clear: () => writeCart(EMPTY),
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, readCart, () => EMPTY);
  // False during server render and hydration, true once the saved cart has been read.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      hydrated,
      ...actions,
    }),
    [items, hydrated],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
