"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { useShop } from "@/lib/store";
import { Card, PageTitle, Swatch } from "@/components/ui";
import { itemsTotal, taka, timeAgo, type Category, type Item, type Payment, type PosSale, type Size } from "@/lib/data";

const CATS: (Category | "All")[] = ["All", "Kurti", "Three-piece", "Saree", "Hijab"];

/** Shop-counter sale screen. Uses the same stock as online orders. */
export default function Pos() {
  const { products, sales, sell, settings, now } = useShop();
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [cart, setCart] = useState<Item[]>([]);
  const [payment, setPayment] = useState<Payment>("Cash");
  const [given, setGiven] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [customer, setCustomer] = useState("");
  const [receipt, setReceipt] = useState<PosSale | null>(null);

  const inCart = (pid: string, s: Size) => cart.filter((i) => i.productId === pid && i.size === s).reduce((a, i) => a + i.qty, 0);
  const subtotal = itemsTotal(cart, products);
  const off = Math.min(Math.max(0, discount), subtotal);
  const total = subtotal - off;
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
    setReceipt(sell(cart, payment, off, customer));
    setCart([]);
    setGiven(0);
    setDiscount(0);
    setCustomer("");
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle title="POS" sub="Sell at the counter. The same stock is used for inbox and website orders." />

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
                          left <= settings.lowStock ? "ring-amber-300 bg-amber-50" : "ring-stone-200 bg-white"
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

          <div className="mt-4 grid gap-1 border-t border-stone-100 pt-3 text-sm">
            <div className="flex justify-between text-stone-500"><span>Subtotal</span><span className="tabular-nums">{taka(subtotal)}</span></div>
            <div className="flex items-center justify-between gap-2 text-stone-500">
              <span>Discount</span>
              <input
                type="number"
                min={0}
                value={discount || ""}
                placeholder="0"
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                className="w-24 rounded-lg border border-stone-200 px-2 py-1 text-right text-stone-800 outline-none focus:border-brand"
                aria-label="Discount in taka"
              />
            </div>
            {subtotal > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "None", v: 0 },
                  { label: "৳50", v: 50 },
                  { label: "৳100", v: 100 },
                  { label: "5%", v: Math.round(subtotal * 0.05) },
                  { label: "10%", v: Math.round(subtotal * 0.1) },
                ].map((x) => (
                  <button key={x.label} onClick={() => setDiscount(x.v)} className={`rounded-lg px-2 py-0.5 text-xs ring-1 ${off === x.v ? "bg-stone-900 text-white ring-stone-900" : "ring-stone-200"}`}>
                    {x.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-between pt-1 text-lg font-semibold text-stone-900">
              <span>Total</span>
              <span className="tabular-nums">{taka(total)}</span>
            </div>
          </div>

          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Customer name (optional)"
            className="mt-3 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />

          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["Cash", "bKash", "Nagad"] as Payment[]).map((p) => (
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

      {sales.length > 0 && (
        <Card className="mt-4 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="font-semibold">Counter sales today</h2>
            <p className="text-sm text-stone-500">{sales.length === 1 ? "1 bill" : `${sales.length} bills`}</p>
          </div>
          <ul className="mt-2 divide-y divide-stone-100">
            {sales.slice(0, 6).map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                <span className="font-mono text-xs text-stone-400">{s.id}</span>
                <span className="min-w-0 flex-1 truncate">{s.customer}</span>
                <span className="hidden text-stone-500 sm:inline">{s.payment}{s.discount ? ` · −${taka(s.discount)}` : ""}</span>
                <span className="text-xs text-stone-400">{timeAgo(s.at, now)}</span>
                <span className="w-20 text-right font-semibold tabular-nums">{taka(s.total)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {receipt && <Receipt sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

function Receipt({ sale, onClose }: { sale: PosSale; onClose: () => void }) {
  return (
    <>
      <div className="no-print fixed inset-0 z-40 grid place-items-center bg-stone-900/40 p-4" onClick={onClose}>
        <div className="pop-in w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <p className="text-center font-sans text-2xl">✓</p>
          <p className="mb-2 text-center font-sans font-semibold">Sale complete</p>
          <ReceiptBody sale={sale} />
          <button onClick={() => window.print()} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 font-sans text-sm font-semibold text-white">
            <Printer size={16} /> Print receipt
          </button>
          <button onClick={onClose} className="mt-2 w-full rounded-xl bg-stone-900 py-2 font-sans text-sm text-white">Next customer</button>
          <p className="mt-3 text-center font-sans text-xs text-stone-500">Stock updated for website and inbox orders too.</p>
        </div>
      </div>
      <div className="print-sheet font-mono">
        <ReceiptBody sale={sale} />
      </div>
    </>
  );
}

function ReceiptBody({ sale }: { sale: PosSale }) {
  const { products, settings } = useShop();
  return (
    <div className="font-mono text-sm text-stone-800">
      <div className="border-y border-dashed border-stone-300 py-3">
        <p className="text-center font-semibold">{settings.name}</p>
        <p className="text-center text-xs text-stone-500">{settings.address}</p>
        <p className="text-center text-xs text-stone-500">{settings.phone} · {sale.id}</p>
        <p className="mt-2 text-center text-xs">{sale.customer} · {sale.payment}</p>
        <ul className="mt-3 grid gap-1">
          {sale.items.map((it, i) => {
            const p = products.find((x) => x.id === it.productId);
            return (
              <li key={i} className="flex justify-between gap-2 text-xs">
                <span className="truncate">{it.qty}× {p?.name ?? "Item"} ({it.size})</span>
                <span>{p ? taka(p.price * it.qty) : ""}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 grid gap-0.5 text-xs text-stone-600">
          <p className="flex justify-between"><span>Subtotal</span><span>{taka(sale.subtotal)}</span></p>
          {sale.discount > 0 && <p className="flex justify-between"><span>Discount</span><span>− {taka(sale.discount)}</span></p>}
        </div>
        <p className="mt-1 flex justify-between font-semibold">
          <span>Total</span>
          <span>{taka(sale.total)}</span>
        </p>
      </div>
      <p className="mt-2 text-center font-sans text-xs text-stone-500">Thank you. Come again.</p>
    </div>
  );
}
