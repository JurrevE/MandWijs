"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { demoProducts, demoProfile } from "@/data/demo";
import type { PersonalProduct } from "@/domain/types";
import type { EmailPreference } from "@/domain/email";

export interface GroceryListItem {
  productId: string;
  quantity: number;
  note?: string;
  checked: boolean;
}

interface AppProfile {
  name: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  emailPreference: EmailPreference;
  maxStores: number | null;
  enabledChainIds: string[];
  disabledStoreIds: string[];
  onboardingCompleted: boolean;
}

interface PersistedState {
  products: PersonalProduct[];
  list: GroceryListItem[];
  profile: AppProfile;
}

interface AppStateValue extends PersistedState {
  addProduct: (product: Omit<PersonalProduct, "id">) => string;
  updateProduct: (id: string, patch: Partial<PersonalProduct>) => void;
  deleteProduct: (id: string) => void;
  addToList: (productId: string) => void;
  updateListItem: (productId: string, patch: Partial<GroceryListItem>) => void;
  removeFromList: (productId: string) => void;
  clearList: () => void;
  updateProfile: (patch: Partial<AppProfile>) => void;
  toggleChain: (chainId: string) => void;
  toggleStore: (storeId: string) => void;
  resetDemo: () => void;
}

const initialState: PersistedState = {
  products: demoProducts,
  list: demoProducts.filter((product) => product.active).map((product) => ({ productId: product.id, quantity: 1, checked: false })),
  profile: demoProfile,
};

const AppStateContext = createContext<AppStateValue | null>(null);
const storageKey = "mandwijs-demo-state-v1";

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(initialState);
  const stateRef = useRef(state);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const restored = JSON.parse(stored) as PersistedState;
        queueMicrotask(() => {
          stateRef.current = restored;
          setState(restored);
        });
      }
    } catch {
      // Ongeldige lokale demo-data mag de app nooit blokkeren.
    }
  }, []);

  const updateState = useCallback((updater: (current: PersistedState) => PersistedState) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Private browsing of een volle opslag blijft een bruikbare sessie opleveren.
    }
  }, []);

  const addProduct = useCallback((product: Omit<PersonalProduct, "id">) => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `product-${Date.now()}`;
    updateState((current) => ({ ...current, products: [...current.products, { ...product, id }] }));
    return id;
  }, [updateState]);

  const updateProduct = useCallback((id: string, patch: Partial<PersonalProduct>) => {
    updateState((current) => ({ ...current, products: current.products.map((product) => product.id === id ? { ...product, ...patch, id } : product) }));
  }, [updateState]);

  const deleteProduct = useCallback((id: string) => {
    updateState((current) => ({ ...current, products: current.products.filter((product) => product.id !== id), list: current.list.filter((item) => item.productId !== id) }));
  }, [updateState]);

  const addToList = useCallback((productId: string) => {
    updateState((current) => current.list.some((item) => item.productId === productId) ? current : { ...current, list: [...current.list, { productId, quantity: 1, checked: false }] });
  }, [updateState]);

  const updateListItem = useCallback((productId: string, patch: Partial<GroceryListItem>) => {
    updateState((current) => ({ ...current, list: current.list.map((item) => item.productId === productId ? { ...item, ...patch, productId } : item) }));
  }, [updateState]);

  const removeFromList = useCallback((productId: string) => {
    updateState((current) => ({ ...current, list: current.list.filter((item) => item.productId !== productId) }));
  }, [updateState]);

  const clearList = useCallback(() => updateState((current) => ({ ...current, list: [] })), [updateState]);
  const updateProfile = useCallback((patch: Partial<AppProfile>) => updateState((current) => ({ ...current, profile: { ...current.profile, ...patch } })), [updateState]);

  const toggleChain = useCallback((chainId: string) => updateState((current) => ({
    ...current,
    profile: {
      ...current.profile,
      enabledChainIds: current.profile.enabledChainIds.includes(chainId)
        ? current.profile.enabledChainIds.filter((id) => id !== chainId)
        : [...current.profile.enabledChainIds, chainId],
    },
  })), [updateState]);

  const toggleStore = useCallback((storeId: string) => updateState((current) => ({
    ...current,
    profile: {
      ...current.profile,
      disabledStoreIds: current.profile.disabledStoreIds.includes(storeId)
        ? current.profile.disabledStoreIds.filter((id) => id !== storeId)
        : [...current.profile.disabledStoreIds, storeId],
    },
  })), [updateState]);

  const resetDemo = useCallback(() => {
    stateRef.current = structuredClone(initialState);
    setState(stateRef.current);
    window.localStorage.removeItem(storageKey);
  }, []);

  const value = useMemo<AppStateValue>(() => ({
    ...state,
    addProduct,
    updateProduct,
    deleteProduct,
    addToList,
    updateListItem,
    removeFromList,
    clearList,
    updateProfile,
    toggleChain,
    toggleStore,
    resetDemo,
  }), [state, addProduct, updateProduct, deleteProduct, addToList, updateListItem, removeFromList, clearList, updateProfile, toggleChain, toggleStore, resetDemo]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState moet binnen AppStateProvider worden gebruikt.");
  return value;
}
