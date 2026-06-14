import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { CartContext, type CartContextValue } from "./CartContext";
import type { CartAction, CartItem, CartState } from "./types";

const STORAGE_KEY = "ap_cart_v1";
const INITIAL_STATE: CartState = { items: [] };

function readStorage(): CartState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) return parsed as CartState;
    return INITIAL_STATE;
  } catch {
    return INITIAL_STATE;
  }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "ADD": {
      const qty = action.qty ?? 1;
      const existing = state.items.find((i) => i.productId === action.item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === action.item.productId ? { ...i, qty: i.qty + qty } : i
          ),
        };
      }
      return { items: [...state.items, { ...action.item, qty }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.productId !== action.productId) };
    case "SET_QTY": {
      if (action.qty <= 0) {
        return { items: state.items.filter((i) => i.productId !== action.productId) };
      }
      return {
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, qty: action.qty } : i
        ),
      };
    }
    case "CLEAR":
      return { items: [] };
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, INITIAL_STATE, readStorage);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const hydrated = useRef(false);

  // Persist on every change (after first render so SSR-style hydration won't wipe state).
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage failures (private mode, quota)
    }
  }, [state]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty?: number) => {
    dispatch({ type: "ADD", item, qty });
  }, []);
  const remove = useCallback((productId: string) => {
    dispatch({ type: "REMOVE", productId });
  }, []);
  const setQty = useCallback((productId: string, qty: number) => {
    dispatch({ type: "SET_QTY", productId, qty });
  }, []);
  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((n, i) => n + i.qty, 0);
    const subtotal = state.items.reduce((n, i) => n + i.price * i.qty, 0);
    const totalSavings = state.items.reduce(
      (n, i) => n + Math.max(0, i.mrp - i.price) * i.qty,
      0
    );
    return {
      items: state.items,
      count,
      subtotal,
      totalSavings,
      add,
      remove,
      setQty,
      clear,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
    };
  }, [state.items, add, remove, setQty, clear, isDrawerOpen, openDrawer, closeDrawer]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
