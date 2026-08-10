"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  clearListAction,
  deleteListItemAction,
  deleteProductAction,
  persistChainPreferenceAction,
  persistListItemAction,
  persistProductAction,
  persistProfileAction,
  persistStorePreferenceAction,
} from "@/app/state-actions";
import { createDemoState } from "@/data/initial-state";
import type { AppProfile, GroceryListItem, PersistedState } from "@/domain/app-state";
import { addNationalPriceLocations, buildShoppingOptions } from "@/domain/market-data";
import type { PersonalProduct } from "@/domain/types";
import type { ProviderSyncResult } from "@/providers/supermarket-data-provider";

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
  refreshMarketData: () => void;
  refreshNearbyStores: () => void;
  storesLoading: boolean;
}

const AppStateContext = createContext<AppStateValue | null>(null);
const storageKey = "mandwijs-demo-state-v2";

type ActionResult = { ok: true } | { ok: false; error: string };

export function AppStateProvider({ children, initialState }: { children: React.ReactNode; initialState: PersistedState }) {
  const [state, setState] = useState<PersistedState>(initialState);
  const stateRef = useRef(state);
  const persistenceQueue = useRef(Promise.resolve());
  const [marketRefresh, setMarketRefresh] = useState(0);
  const [storeRefresh, setStoreRefresh] = useState(0);
  const [storesLoading, setStoresLoading] = useState(false);

  useEffect(() => {
    if (initialState.mode !== "demo") return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return;
      const restored = JSON.parse(stored) as Pick<PersistedState, "products" | "list" | "profile">;
      const next = { ...initialState, ...restored };
      stateRef.current = next;
      queueMicrotask(() => setState(next));
    } catch {
      // Ongeldige lokale demo-data mag de app nooit blokkeren.
    }
  }, [initialState]);

  const updateState = useCallback((updater: (current: PersistedState) => PersistedState) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
    if (next.mode === "demo") {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ products: next.products, list: next.list, profile: next.profile }));
      } catch {
        // Private browsing of een volle opslag blijft een bruikbare sessie opleveren.
      }
    }
  }, []);

  const queuePersistence = useCallback((action: () => Promise<ActionResult>) => {
    if (stateRef.current.mode !== "supabase" || !stateRef.current.databaseReady) return;
    persistenceQueue.current = persistenceQueue.current
      .then(action)
      .then((result) => {
        if (!result.ok) throw new Error(result.error);
        if (stateRef.current.persistenceError) {
          const next = { ...stateRef.current, persistenceError: undefined };
          stateRef.current = next;
          setState(next);
        }
      })
      .catch((error) => {
        const next = { ...stateRef.current, persistenceError: error instanceof Error ? error.message : "Opslaan is mislukt." };
        stateRef.current = next;
        setState(next);
      });
  }, []);

  const addProduct = useCallback((product: Omit<PersonalProduct, "id">) => {
    const id = crypto.randomUUID();
    const created = { ...product, id };
    updateState((current) => ({ ...current, products: [...current.products, created] }));
    queuePersistence(() => persistProductAction(created));
    return id;
  }, [queuePersistence, updateState]);

  const updateProduct = useCallback((id: string, patch: Partial<PersonalProduct>) => {
    const currentProduct = stateRef.current.products.find((product) => product.id === id);
    if (!currentProduct) return;
    const updated = { ...currentProduct, ...patch, id };
    updateState((current) => ({ ...current, products: current.products.map((product) => product.id === id ? updated : product) }));
    queuePersistence(() => persistProductAction(updated));
  }, [queuePersistence, updateState]);

  const deleteProduct = useCallback((id: string) => {
    updateState((current) => ({
      ...current,
      products: current.products.filter((product) => product.id !== id),
      list: current.list.filter((item) => item.productId !== id),
    }));
    queuePersistence(() => deleteProductAction(id));
  }, [queuePersistence, updateState]);

  const addToList = useCallback((productId: string) => {
    if (stateRef.current.list.some((item) => item.productId === productId)) return;
    const item = { productId, quantity: 1, checked: false };
    updateState((current) => ({ ...current, list: [...current.list, item] }));
    queuePersistence(() => persistListItemAction(item));
  }, [queuePersistence, updateState]);

  const updateListItem = useCallback((productId: string, patch: Partial<GroceryListItem>) => {
    const currentItem = stateRef.current.list.find((item) => item.productId === productId);
    if (!currentItem) return;
    const updated = { ...currentItem, ...patch, productId };
    updateState((current) => ({ ...current, list: current.list.map((item) => item.productId === productId ? updated : item) }));
    queuePersistence(() => persistListItemAction(updated));
  }, [queuePersistence, updateState]);

  const removeFromList = useCallback((productId: string) => {
    updateState((current) => ({ ...current, list: current.list.filter((item) => item.productId !== productId) }));
    queuePersistence(() => deleteListItemAction(productId));
  }, [queuePersistence, updateState]);

  const clearList = useCallback(() => {
    updateState((current) => ({ ...current, list: [] }));
    queuePersistence(clearListAction);
  }, [queuePersistence, updateState]);

  const updateProfile = useCallback((patch: Partial<AppProfile>) => {
    updateState((current) => ({ ...current, profile: { ...current.profile, ...patch } }));
    const { enabledChainIds: _enabledChainIds, disabledStoreIds: _disabledStoreIds, ...persistable } = patch;
    void _enabledChainIds;
    void _disabledStoreIds;
    if (Object.keys(persistable).length) queuePersistence(() => persistProfileAction(persistable));
  }, [queuePersistence, updateState]);

  const toggleChain = useCallback((chainId: string) => {
    const enabled = !stateRef.current.profile.enabledChainIds.includes(chainId);
    updateState((current) => ({
      ...current,
      profile: {
        ...current.profile,
        enabledChainIds: enabled
          ? [...current.profile.enabledChainIds, chainId]
          : current.profile.enabledChainIds.filter((id) => id !== chainId),
      },
    }));
    queuePersistence(() => persistChainPreferenceAction(chainId, enabled));
  }, [queuePersistence, updateState]);

  const toggleStore = useCallback((storeId: string) => {
    const enabled = stateRef.current.profile.disabledStoreIds.includes(storeId);
    updateState((current) => ({
      ...current,
      profile: {
        ...current.profile,
        disabledStoreIds: enabled
          ? current.profile.disabledStoreIds.filter((id) => id !== storeId)
          : [...current.profile.disabledStoreIds, storeId],
      },
    }));
    queuePersistence(() => persistStorePreferenceAction(storeId, enabled));
  }, [queuePersistence, updateState]);

  const resetDemo = useCallback(() => {
    if (stateRef.current.mode !== "demo") return;
    const next = createDemoState(stateRef.current.userEmail);
    stateRef.current = next;
    setState(next);
    window.localStorage.removeItem(storageKey);
    setMarketRefresh((value) => value + 1);
  }, []);

  const refreshMarketData = useCallback(() => setMarketRefresh((value) => value + 1), []);
  const refreshNearbyStores = useCallback(() => setStoreRefresh((value) => value + 1), []);
  const queryKey = useMemo(() => state.products.filter((product) => product.active).map((product) => product.searchTerm).sort().join("\u0000"), [state.products]);
  const locationKey = `${state.profile.latitude ?? ""}:${state.profile.longitude ?? ""}:${state.profile.radiusKm}`;

  useEffect(() => {
    const { latitude, longitude, radiusKm } = stateRef.current.profile;
    if (latitude == null || longitude == null) {
      setStoresLoading(false);
      return;
    }
    let active = true;
    setStoresLoading(true);
    void fetch("/api/locations/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude, radiusKm }),
    })
      .then(async (response) => {
        const body = await response.json() as { error?: string; stores?: PersistedState["stores"]; completedAt?: string };
        if (!response.ok || !body.stores || !body.completedAt) throw new Error(body.error ?? "Winkels ophalen is mislukt.");
        return body;
      })
      .then((result) => {
        if (!active) return;
        updateState((current) => ({
          ...current,
          stores: addNationalPriceLocations(current.chains, result.stores!),
          storeDataSource: "openstreetmap",
          storeDataUpdatedAt: result.completedAt!,
          storeWarnings: [],
        }));
      })
      .catch((error) => {
        if (!active) return;
        updateState((current) => ({
          ...current,
          stores: current.storeDataSource === "openstreetmap"
            ? current.stores
            : addNationalPriceLocations(current.chains, []),
          storeWarnings: [error instanceof Error ? error.message : "Winkels ophalen is mislukt."],
        }));
      })
      .finally(() => {
        if (active) setStoresLoading(false);
      });
    return () => { active = false; };
  }, [locationKey, storeRefresh, updateState]);

  useEffect(() => {
    const queries = queryKey.split("\u0000").filter(Boolean);
    if (!queries.length) {
      updateState((current) => ({ ...current, offers: [], shoppingOptions: [] }));
      return;
    }
    const controller = new AbortController();
    void fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Prijsdata kon niet worden geladen.");
        return response.json() as Promise<ProviderSyncResult>;
      })
      .then((result) => updateState((current) => ({
        ...current,
        offers: result.offers,
        shoppingOptions: buildShoppingOptions(current.products, result.offers, current.chains),
        stores: addNationalPriceLocations(current.chains, current.stores),
        dataSource: result.source,
        dataUpdatedAt: result.completedAt,
        dataWarnings: result.warnings,
      })))
      .catch((error) => {
        if (controller.signal.aborted) return;
        updateState((current) => ({
          ...current,
          dataWarnings: [error instanceof Error ? error.message : "Prijsdata kon niet worden geladen."],
        }));
      });
    return () => controller.abort();
  }, [marketRefresh, queryKey, updateState]);

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
    refreshMarketData,
    refreshNearbyStores,
    storesLoading,
  }), [state, addProduct, updateProduct, deleteProduct, addToList, updateListItem, removeFromList, clearList, updateProfile, toggleChain, toggleStore, resetDemo, refreshMarketData, refreshNearbyStores, storesLoading]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState moet binnen AppStateProvider worden gebruikt.");
  return value;
}
