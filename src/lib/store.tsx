"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  COURIERS,
  FLOW,
  INCOMING,
  PRODUCTS,
  seedOrders,
  itemsTotal,
  type Item,
  type Order,
  type Payment,
  type Product,
  type Status,
} from "./data";

export type PosSale = { id: string; at: number; items: Item[]; total: number; payment: Payment };
export type Toast = { id: number; title: string; body: string; tone: "new" | "ok" | "warn" };

type State = {
  products: Product[];
  orders: Order[];
  sales: PosSale[];
  nextId: number;
  incoming: number;
};

type NewOrder = Omit<Order, "id" | "createdAt" | "history" | "status">;

type Store = State & {
  now: number;
  toasts: Toast[];
  addOrder: (o: NewOrder) => string;
  advance: (id: string) => void;
  markReturned: (id: string) => void;
  restock: (productId: string, size: string, n: number) => void;
  sell: (items: Item[], payment: Payment) => PosSale;
  simulateIncoming: () => void;
  dismiss: (id: number) => void;
  reset: () => void;
};

const KEY = "dokan-panel-v1";
const Ctx = createContext<Store | null>(null);

function fresh(): State {
  return { products: structuredClone(PRODUCTS), orders: seedOrders(Date.now()), sales: [], nextId: 1049, incoming: 0 };
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

  // Load saved demo state in the browser only (so server and client HTML match).
  useEffect(() => {
    let s: State | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) s = JSON.parse(raw);
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage
    setState(s ?? fresh());
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

  const toast = useCallback((t: Omit<Toast, "id">) => {
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

  const restock = useCallback(
    (productId: string, size: string, n: number) =>
      update((s) => ({ ...s, products: changeStock(s.products, [{ productId, size: size as Item["size"], qty: n }], 1) })),
    [update],
  );

  const sell = useCallback(
    (items: Item[], payment: Payment) => {
      const sale: PosSale = {
        id: `S-${Date.now().toString().slice(-5)}`,
        at: Date.now(),
        items,
        payment,
        total: itemsTotal(items, state?.products ?? PRODUCTS),
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
    toast({ tone: "new", title: `New order #${id}`, body: `${o.customer} · ${o.channel}` });
  }, [state, addOrder, update, toast]);

  const value = useMemo<Store | null>(
    () =>
      state && {
        ...state,
        now,
        toasts,
        addOrder,
        advance,
        markReturned,
        restock,
        sell,
        simulateIncoming,
        dismiss: (id: number) => setToasts((ts) => ts.filter((x) => x.id !== id)),
        reset: () => {
          setState(fresh());
          setNow(Date.now());
        },
      },
    [state, now, toasts, addOrder, advance, markReturned, restock, sell, simulateIncoming],
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
