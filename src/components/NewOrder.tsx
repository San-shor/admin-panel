"use client";

import { useState } from "react";
import { useShop } from "@/lib/store";
import { Swatch, fieldClass } from "@/components/ui";
import { CUSTOMER_HISTORY, itemsTotal, taka, type Item, type Payment, type Size } from "@/lib/data";

/** Form for typing in an order that came by Facebook inbox or phone. */
export default function NewOrder({ onClose }: { onClose: (id?: string) => void }) {
  const { products, addOrder, settings, notify } = useShop();
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [inside, setInside] = useState(true);
  const [payment, setPayment] = useState<Payment>("COD");
  const [advance, setAdvance] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [pick, setPick] = useState(products[0].id);
  const [size, setSize] = useState<Size | "">("");

  const product = products.find((p) => p.id === pick)!;
  const sizes = Object.entries(product.stock) as [Size, number][];
  const reserved = (pid: string, s: Size) => items.filter((i) => i.productId === pid && i.size === s).reduce((a, i) => a + i.qty, 0);
  const left = (s: Size) => (product.stock[s] ?? 0) - reserved(product.id, s);

  const delivery = inside ? settings.deliveryInside : settings.deliveryOutside;
  const sub = itemsTotal(items, products);
  const total = sub + delivery;
  const paid = payment === "COD" ? Math.min(advance, total) : total;
  const hist = CUSTOMER_HISTORY[phone.trim()];
  const ok = customer.trim() && phone.trim() && address.trim() && items.length > 0;

  function addItem() {
    if (!size || left(size) <= 0) return;
    setItems((xs) => {
      const i = xs.findIndex((x) => x.productId === pick && x.size === size);
      if (i >= 0) return xs.map((x, j) => (j === i ? { ...x, qty: x.qty + 1 } : x));
      return [...xs, { productId: pick, size, qty: 1 }];
    });
  }

  function save() {
    if (!ok) return;
    const id = addOrder({ customer: customer.trim(), phone: phone.trim(), address: address.trim(), insideDhaka: inside, channel: "Facebook inbox", payment, paid, items, delivery });
    notify({ tone: "ok", title: `Order #${id} saved`, body: "Stock updated for the sizes in this order." });
    onClose(id);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-stone-900/40 sm:items-center sm:p-4" onClick={() => onClose()}>
      <div className="pop-in max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add inbox order</h2>
          <button onClick={() => onClose()} className="rounded-full px-2 text-xl text-stone-400" aria-label="Close">×</button>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={fieldClass} placeholder="Customer name" value={customer} onChange={(e) => setCustomer(e.target.value)} />
            <input className={fieldClass} placeholder="Phone (e.g. 01988-301776)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {hist && (
            <p className={`rounded-xl p-2.5 text-xs ${hist.returned >= 2 ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>
              {hist.returned >= 2
                ? `⚠ This number returned ${hist.returned} of ${hist.orders} orders. Ask for a bKash advance.`
                : `✓ Regular customer: ${hist.orders} orders, no returns.`}
            </p>
          )}
          <input className={fieldClass} placeholder="Full address" value={address} onChange={(e) => setAddress(e.target.value)} />

          <div className="grid grid-cols-2 gap-2">
            {[true, false].map((v) => (
              <button key={String(v)} onClick={() => setInside(v)} className={`rounded-xl px-3 py-2 text-sm font-medium ring-1 ${inside === v ? "bg-indigo-50 text-brand ring-brand" : "ring-stone-200"}`}>
                {v ? `Inside Dhaka ${taka(settings.deliveryInside)}` : `Outside Dhaka ${taka(settings.deliveryOutside)}`}
              </button>
            ))}
          </div>

          {/* Product picker */}
          <div className="rounded-2xl bg-stone-50 p-3">
            <div className="flex items-center gap-2">
              <Swatch p={product} size={38} />
              <select className={fieldClass} value={pick} onChange={(e) => { setPick(e.target.value); setSize(""); }}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {taka(p.price)}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {sizes.map(([s]) => {
                const n = left(s);
                return (
                  <button
                    key={s}
                    disabled={n <= 0}
                    onClick={() => setSize(s)}
                    className={`rounded-lg px-3 py-1.5 text-sm ring-1 disabled:cursor-not-allowed disabled:opacity-40 ${size === s ? "bg-brand text-white ring-brand" : "bg-white ring-stone-200"}`}
                  >
                    {s} <span className="text-xs opacity-70">({n})</span>
                  </button>
                );
              })}
              <button onClick={addItem} disabled={!size} className="ml-auto rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-30">
                Add
              </button>
            </div>
            {items.length > 0 && (
              <ul className="mt-3 grid gap-1 border-t border-stone-200 pt-2 text-sm">
                {items.map((it, i) => {
                  const p = products.find((x) => x.id === it.productId)!;
                  return (
                    <li key={i} className="flex items-center gap-2">
                      <span className="flex-1">{p.name} · {it.size} × {it.qty}</span>
                      <span>{taka(p.price * it.qty)}</span>
                      <button onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))} className="px-1 text-stone-400" aria-label="Remove">×</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["COD", "bKash", "Nagad"] as Payment[]).map((p) => (
              <button key={p} onClick={() => setPayment(p)} className={`rounded-xl px-2 py-2 text-sm font-medium ring-1 ${payment === p ? "bg-indigo-50 text-brand ring-brand" : "ring-stone-200"}`}>
                {p === "COD" ? "Cash on delivery" : p}
              </button>
            ))}
          </div>
          {payment === "COD" && (
            <label className="flex items-center gap-2 whitespace-nowrap text-sm text-stone-600">
              Advance received
              <input type="number" min={0} className={`${fieldClass} w-28`} value={advance || ""} placeholder="0" onChange={(e) => setAdvance(Number(e.target.value) || 0)} />
            </label>
          )}

          <div className="rounded-2xl bg-stone-900 p-4 text-sm text-white">
            <div className="flex justify-between text-stone-300"><span>Products</span><span>{taka(sub)}</span></div>
            <div className="flex justify-between text-stone-300"><span>Delivery</span><span>{taka(delivery)}</span></div>
            <div className="flex justify-between text-stone-300"><span>Paid now</span><span>− {taka(paid)}</span></div>
            <div className="mt-1 flex justify-between text-base font-semibold"><span>Courier collects</span><span>{taka(total - paid)}</span></div>
          </div>

          <button onClick={save} disabled={!ok} className="rounded-xl bg-brand py-3 font-semibold text-white disabled:opacity-40">
            Save order · stock updates automatically
          </button>
        </div>
      </div>
    </div>
  );
}
