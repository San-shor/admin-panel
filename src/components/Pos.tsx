"use client";

import { useState } from "react";
import { useShop, type PosSale } from "@/lib/store";
import { Card, PageTitle, Swatch } from "@/components/ui";
import { LOW_STOCK, SHOP, itemsTotal, taka, type Category, type Item, type Payment, type Size } from "@/lib/data";

const CATS: (Category | "All")[] = ["All", "Kurti", "Three-piece", "Saree", "Hijab"];

/** Shop-counter sale screen. Uses the same stock as online orders. */
export default function Pos() {
  const { products, sell } = useShop();
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [cart, setCart] = useState<Item[]>([]);
  const [payment, setPayment] = useState<Payment>("Cash");
  const [given, setGiven] = useState(0);
  const [receipt, setReceipt] = useState<PosSale | null>(null);

  const inCart = (pid: string, s: Size) => cart.filter((i) => i.productId === pid && i.size === s).reduce((a, i) => a + i.qty, 0);
  const total = itemsTotal(cart, products);
  const list = cat === "All" ? products : products.filter((p) => p.category === cat);

  function add(pid: string, s: Size) {
    setCart((xs) => {
      const i = xs.findIndex((x) => x.productId === pid && x.size === s);
      if (i >= 0) return xs.map((x, j) => (j === i ? { ...x, qty: x.qty + 1 } : x));
      return [...xs, { productId: pid, size: s, qty: 1 }];
    });
  }

  function change(i: number, d: number) {
    setCart((xs) => xs.map((x, j) => (j === i ? { ...x, qty: x.qty + d } : x)).filter((x) => x.qty > 0));
  }

  function checkout() {
    if (!cart.length) return;
    setReceipt(sell(cart, payment));
    setCart([]);
    setGiven(0);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle title="POS" sub="Sell at the shop counter. Stock is shared with online orders." />

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${cat === c ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200"}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => (
              <Card key={p.id} className="p-3">
                <div className="flex gap-3">
                  <Swatch p={p} size={52} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{p.name}</p>
                    <p className="text-sm font-semibold text-brand">{taka(p.price)}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(Object.entries(p.stock) as [Size, number][]).map(([s, n]) => {
                    const left = n - inCart(p.id, s);
                    return (
                      <button
                        key={s}
                        disabled={left <= 0}
                        onClick={() => add(p.id, s)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium ring-1 disabled:cursor-not-allowed disabled:opacity-35 ${
                          left <= LOW_STOCK ? "ring-amber-300 bg-amber-50" : "ring-stone-200 bg-white"
                        } hover:ring-brand`}
                      >
                        {s === "Free" ? "Add" : s} <span className="opacity-60">· {left}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart */}
        <Card className="h-fit p-4 lg:sticky lg:top-4">
          <h2 className="mb-3 font-semibold">Current sale</h2>
          {cart.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-400">Tap a size to add it.</p>
          ) : (
            <ul className="grid gap-2">
              {cart.map((it, i) => {
                const p = products.find((x) => x.id === it.productId)!;
                return (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">
                      {p.name} <span className="text-stone-400">· {it.size}</span>
                    </span>
                    <button onClick={() => change(i, -1)} className="h-6 w-6 rounded-md ring-1 ring-stone-200">−</button>
                    <span className="w-4 text-center">{it.qty}</span>
                    <button
                      onClick={() => change(i, 1)}
                      disabled={(p.stock[it.size] ?? 0) - it.qty <= 0}
                      className="h-6 w-6 rounded-md ring-1 ring-stone-200 disabled:opacity-30"
                    >
                      +
                    </button>
                    <span className="w-[4.5rem] shrink-0 text-right">{taka(p.price * it.qty)}</span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 flex justify-between border-t border-stone-100 pt-3 text-lg font-semibold">
            <span>Total</span>
            <span>{taka(total)}</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["Cash", "bKash"] as Payment[]).map((p) => (
              <button key={p} onClick={() => setPayment(p)} className={`rounded-xl py-2 text-sm font-medium ring-1 ${payment === p ? "bg-indigo-50 text-brand ring-brand" : "ring-stone-200"}`}>
                {p}
              </button>
            ))}
          </div>
          {payment === "Cash" && total > 0 && (
            <div className="mt-3 text-sm">
              <div className="flex flex-wrap gap-1.5">
                {[total, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000].filter((v, i, a) => a.indexOf(v) === i).map((v) => (
                  <button key={v} onClick={() => setGiven(v)} className={`rounded-lg px-2.5 py-1 ring-1 ${given === v ? "bg-stone-900 text-white ring-stone-900" : "ring-stone-200"}`}>
                    {taka(v)}
                  </button>
                ))}
              </div>
              {given >= total && <p className="mt-2 text-stone-600">Change to give: <b>{taka(given - total)}</b></p>}
            </div>
          )}
          <button onClick={checkout} disabled={!cart.length} className="mt-4 w-full rounded-xl bg-brand py-3 font-semibold text-white disabled:opacity-40">
            Complete sale
          </button>
        </Card>
      </div>

      {receipt && <Receipt sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

function Receipt({ sale, onClose }: { sale: PosSale; onClose: () => void }) {
  const { products } = useShop();
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-stone-900/40 p-4" onClick={onClose}>
      <div className="pop-in w-full max-w-xs rounded-2xl bg-white p-5 font-mono text-sm" onClick={(e) => e.stopPropagation()}>
        <p className="text-center font-sans text-2xl">✓</p>
        <p className="text-center font-sans font-semibold">Sale complete</p>
        <div className="my-3 border-y border-dashed border-stone-300 py-3">
          <p className="text-center font-semibold">{SHOP.name}</p>
          <p className="text-center text-xs text-stone-500">{SHOP.city} · {sale.id}</p>
          <ul className="mt-3 grid gap-1">
            {sale.items.map((it, i) => {
              const p = products.find((x) => x.id === it.productId)!;
              return (
                <li key={i} className="flex justify-between gap-2 text-xs">
                  <span className="truncate">{it.qty}× {p.name} ({it.size})</span>
                  <span>{taka(p.price * it.qty)}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 flex justify-between font-semibold">
            <span>Total ({sale.payment})</span>
            <span>{taka(sale.total)}</span>
          </p>
        </div>
        <p className="text-center font-sans text-xs text-stone-500">Stock updated for website and inbox orders too.</p>
        <button onClick={onClose} className="mt-3 w-full rounded-xl bg-stone-900 py-2 font-sans text-white">Next customer</button>
      </div>
    </div>
  );
}
