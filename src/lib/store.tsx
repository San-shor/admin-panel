"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  COURIERS,
  DEFAULT_SHOP,
  FLOW,
  INCOMING,
  PRODUCTS,
  seedOrders,
  seedSales,
  itemsTotal,
  type Item,
  type Order,
  type Payment,
  type PosSale,
  type Product,
  type ShopSettings,
  type Status,
} from "./data";

export type { PosSale };
export type Toast = { id: number; title: string; body: string; tone: "new" | "ok" | "warn" };
export type Spotlight = { kind: "order" | "product" | "customer"; id: string };

type State = {
  products: Product[];
  orders: Order[];
  sales: PosSale[];
  nextId: number;
  incoming: number;
  settings: ShopSettings;
};

type NewOrder = Omit<Order, "id" | "createdAt" | "history" | "status">;
export type NewProduct = Omit<Product, "id">;

type Store = State & {
  now: number;
  toasts: Toast[];
  spotlight: Spotlight | null;
  addOrder: (o: NewOrder) => string;
  advance: (id: string) => void;
  markReturned: (id: string) => void;
  setCourier: (id: string, courier: string) => void;
  restock: (productId: string, size: string, n: number) => void;
  addProduct: (p: NewProduct) => string;
  updateProduct: (id: string, patch: Partial<Pick<Product, "name" | "price" | "cost">>) => void;
  updateSettings: (patch: Partial<ShopSettings>) => void;
  sell: (items: Item[], payment: Payment, discount: number, customer: string) => PosSale;
  simulateIncoming: () => void;
  notify: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
  focus: (s: Spotlight) => void;
  clearFocus: () => void;
  reset: () => void;
};

const KEY = "dokan-panel-v2";
const Ctx = createContext<Store | null>(null);

function fresh(): State {
  const now = Date.now();
  return {
    products: structuredClone(PRODUCTS),
    orders: seedOrders(now),
    sales: seedSales(now),
    nextId: 1049,
    incoming: 0,
    settings: structuredClone(DEFAULT_SHOP),
  };
}

function hydrate(raw: string | null): State {
  if (!raw) return fresh();
  try {
    const s = JSON.parse(raw);
    if (!s || !Array.isArray(s.products) || !Array.isArray(s.orders) || typeof s.settings?.name !== "string") return fresh();
    return {
      products: s.products,
      orders: s.orders,
      sales: Array.isArray(s.sales) ? s.sales : [],
      nextId: typeof s.nextId === "number" ? s.nextId : 1049,
      incoming: typeof s.incoming === "number" ? s.incoming : 0,
      settings: { ...DEFAULT_SHOP, ...s.settings },
    };
  } catch {
    return fresh();
  }
}

function changeStock(products: Product[], items: Item[], sign: 1 | -1): Product[] {
  return products.map((p) => {
    const mine = items.filter((it) => it.productId === p.id);
    if (!mine.length) return p;
    const stock = { ...p.stock };
    mine.forEach((it) => (stock[it.size] = Math.max(0, (stock[it.size] ?? 0) + sign * it.qty)));
    return { ...p, stock };
  });
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const [now, setNow] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);

  // Load saved demo state in the browser only (so server and client HTML match).
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage
    setState(hydrate(raw));
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 20_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const notify = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { ...t, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 5000);
  }, []);

  const update = useCallback((fn: (s: State) => State) => {
    setState((s) => (s ? fn(s) : s));
    setNow(Date.now());
  }, []);

  const addOrder = useCallback(
    (o: NewOrder) => {
      const id = String(state?.nextId ?? 0);
      const at = Date.now();
      update((s) => ({
        ...s,
        nextId: s.nextId + 1,
        products: changeStock(s.products, o.items, -1),
        orders: [{ ...o, id, createdAt: at, status: "New", history: { New: at } }, ...s.orders],
      }));
      return id;
    },
    [state?.nextId, update],
  );

  const advance = useCallback(
    (id: string) =>
      update((s) => ({
        ...s,
        orders: s.orders.map((o) => {
          if (o.id !== id) return o;
          const i = FLOW.indexOf(o.status);
          if (i < 0 || i >= FLOW.length - 1) return o;
          const next: Status = FLOW[i + 1];
          const courier = next === "Shipped" ? (o.courier ?? COURIERS[Number(o.id) % COURIERS.length]) : o.courier;
          return { ...o, status: next, courier, history: { ...o.history, [next]: Date.now() } };
        }),
      })),
    [update],
  );

  const markReturned = useCallback(
    (id: string) =>
      update((s) => {
        const o = s.orders.find((x) => x.id === id);
        if (!o || o.status === "Returned" || o.status === "Delivered") return s;
        return {
          ...s,
          products: changeStock(s.products, o.items, 1),
          orders: s.orders.map((x) => (x.id === id ? { ...x, status: "Returned", history: { ...x.history, Returned: Date.now() } } : x)),
        };
      }),
    [update],
  );

  const setCourier = useCallback(
    (id: string, courier: string) => update((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, courier } : o)) })),
    [update],
  );

  const restock = useCallback(
    (productId: string, size: string, n: number) =>
      update((s) => ({ ...s, products: changeStock(s.products, [{ productId, size: size as Item["size"], qty: n }], 1) })),
    [update],
  );

  const addProduct = useCallback(
    (p: NewProduct) => {
      const id = `p${Date.now().toString().slice(-7)}`;
      update((s) => ({ ...s, products: [...s.products, { ...p, id }] }));
      return id;
    },
    [update],
  );

  const updateProduct = useCallback(
    (id: string, patch: Partial<Pick<Product, "name" | "price" | "cost">>) =>
      update((s) => ({
        ...s,
        products: s.products.map((p) =>
          p.id === id
            ? {
                ...p,
                ...patch,
                price: patch.price === undefined ? p.price : Math.max(0, Math.round(patch.price)),
                cost: patch.cost === undefined ? p.cost : Math.max(0, Math.round(patch.cost)),
              }
            : p,
        ),
      })),
    [update],
  );

  const updateSettings = useCallback(
    (patch: Partial<ShopSettings>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    [update],
  );

  const sell = useCallback(
    (items: Item[], payment: Payment, discount: number, customer: string) => {
      const products = state?.products ?? PRODUCTS;
      const subtotal = itemsTotal(items, products);
      const off = Math.min(Math.max(0, Math.round(discount)), subtotal);
      const sale: PosSale = {
        id: `S-${Date.now().toString().slice(-5)}`,
        at: Date.now(),
        items,
        payment,
        customer: customer.trim() || "Walk-in",
        subtotal,
        discount: off,
        total: subtotal - off,
      };
      update((s) => ({ ...s, products: changeStock(s.products, items, -1), sales: [sale, ...s.sales] }));
      return sale;
    },
    [state?.products, update],
  );

  const simulateIncoming = useCallback(() => {
    if (!state) return;
    const o = INCOMING[state.incoming % INCOMING.length];
    const id = addOrder(o);
    update((s) => ({ ...s, incoming: s.incoming + 1 }));
    notify({ tone: "new", title: `New order #${id}`, body: `${o.customer} · ${o.channel}` });
  }, [state, addOrder, update, notify]);

  const focus = useCallback((s: Spotlight) => setSpotlight(s), []);
  const clearFocus = useCallback(() => setSpotlight(null), []);

  const value = useMemo<Store | null>(
    () =>
      state && {
        ...state,
        now,
        toasts,
        spotlight,
        addOrder,
        advance,
        markReturned,
        setCourier,
        restock,
        addProduct,
        updateProduct,
        updateSettings,
        sell,
        simulateIncoming,
        notify,
        dismiss: (id: number) => setToasts((ts) => ts.filter((x) => x.id !== id)),
        focus,
        clearFocus,
        reset: () => {
          setState(fresh());
          setNow(Date.now());
          setSpotlight(null);
        },
      },
    [state, now, toasts, spotlight, addOrder, advance, markReturned, setCourier, restock, addProduct, updateProduct, updateSettings, sell, simulateIncoming, notify, focus, clearFocus],
  );

  if (!value) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-stone-500">
        <span className="spin h-6 w-6 rounded-full border-2 border-stone-300 border-t-stone-700" />
      </div>
    );
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShop() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useShop must be used inside ShopProvider");
  return s;
}
