"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, Printer, Search, TriangleAlert } from "lucide-react";
import { useShop } from "@/lib/store";
import { Card, PageTitle, StatusBadge, Swatch } from "@/components/ui";
import NewOrder from "@/components/NewOrder";
import {
  COURIERS,
  CUSTOMER_HISTORY,
  FLOW,
  dueOnDelivery,
  isRisky,
  itemsTotal,
  orderTotal,
  taka,
  timeAgo,
  type Order,
  type Status,
} from "@/lib/data";

const TABS: (Status | "All")[] = ["All", "New", "Confirmed", "Packed", "Shipped", "Delivered", "Returned"];

const NEXT_LABEL: Partial<Record<Status, string>> = {
  New: "Confirm order",
  Confirmed: "Mark packed",
  Packed: "Hand to courier",
  Shipped: "Mark delivered",
};

export default function Orders() {
  const { orders, products, settings, spotlight, clearFocus } = useShop();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [slip, setSlip] = useState<Order | null>(null);
  const scrollTo = useRef<string | null>(null);

  useEffect(() => {
    if (spotlight?.kind !== "order") return;
    scrollTo.current = spotlight.id;
    setTab("All");
    setQuery("");
    setOpen(spotlight.id);
    clearFocus();
  }, [spotlight, clearFocus]);

  useEffect(() => {
    if (!open || scrollTo.current !== open) return;
    scrollTo.current = null;
    document.getElementById(`order-${open}`)?.scrollIntoView({ block: "center" });
  }, [open]);

  const q = query.trim().toLowerCase();
  const digits = q.replace(/\D/g, "");
  const matches = (o: Order) => {
    if (!q) return true;
    const blob = `${o.id} ${o.customer} ${o.phone} ${o.address}`.toLowerCase();
    return blob.includes(q) || (digits.length >= 3 && o.phone.replace(/\D/g, "").includes(digits));
  };
  const list = orders.filter((o) => (tab === "All" || o.status === tab) && matches(o));
  const count = (t: (typeof TABS)[number]) => orders.filter((o) => (t === "All" || o.status === t) && matches(o)).length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Orders"
        sub="Inbox, website and phone orders in one list"
        right={
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark">
            <Plus size={16} /> Add inbox order
          </button>
        }
      />

      <label className="mb-3 flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-500 focus-within:border-brand focus-within:ring-2 focus-within:ring-indigo-100">
        <Search size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name, phone or order number"
          className="w-full bg-transparent text-stone-800 outline-none placeholder:text-stone-400"
          aria-label="Filter orders"
        />
      </label>

      <div className="-mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-stone-200 px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium ${tab === t ? "border-brand text-brand" : "border-transparent text-stone-500 hover:text-stone-800"}`}
          >
            {t} <span className="ml-1 rounded-full bg-stone-100 px-1.5 text-xs text-stone-600 tabular-nums">{count(t)}</span>
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[90px_1.3fr_1.8fr_1.2fr_110px_120px_24px] gap-3 border-b border-stone-100 bg-stone-50/70 px-5 py-2.5 text-xs font-medium text-stone-500 md:grid">
          <span>Order</span>
          <span>Customer</span>
          <span>Items</span>
          <span>Channel</span>
          <span className="text-right">Total</span>
          <span className="text-right">Status</span>
          <span />
        </div>
        {list.length === 0 && <p className="p-10 text-center text-sm text-stone-500">{q ? "No orders match that search." : "No orders here."}</p>}
        <div className="divide-y divide-stone-100">
          {list.map((o) => (
            <OrderRow key={o.id} o={o} open={open === o.id} toggle={() => setOpen(open === o.id ? null : o.id)} onPrint={() => setSlip(o)} />
          ))}
        </div>
      </Card>

      {adding && (
        <NewOrder
          onClose={(id) => {
            setAdding(false);
            if (id) {
              setTab("All");
              setOpen(id);
            }
          }}
        />
      )}

      {slip && <PackingSlip order={slip} onClose={() => setSlip(null)} />}
    </div>
  );
}

function OrderRow({ o, open, toggle, onPrint }: { o: Order; open: boolean; toggle: () => void; onPrint: () => void }) {
  const { products, now, advance, markReturned, setCourier } = useShop();
  const hist = CUSTOMER_HISTORY[o.phone];
  const risky = isRisky(o.phone);
  const due = dueOnDelivery(o, products);
  const fresh = now - o.createdAt < 60_000;

  return (
    <div id={`order-${o.id}`}>
      <button onClick={toggle} className={`grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-5 py-3.5 text-left hover:bg-stone-50/80 md:grid-cols-[90px_1.3fr_1.8fr_1.2fr_110px_120px_24px] ${fresh ? "flash" : ""} ${open ? "bg-stone-50/80" : ""}`}>
        <span className="hidden font-mono text-xs text-stone-500 md:block">#{o.id}</span>
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="font-mono text-xs font-normal text-stone-400 md:hidden">#{o.id}</span>
            <span className="truncate">{o.customer}</span>
            {risky && <TriangleAlert size={14} className="shrink-0 text-rose-500" aria-label="Returned before" />}
          </span>
          <span className="block text-xs text-stone-400">{timeAgo(o.createdAt, now)} · {o.insideDhaka ? "Dhaka" : "Outside Dhaka"}</span>
        </span>
        <span className="col-span-2 row-start-2 truncate text-xs text-stone-500 md:col-span-1 md:row-start-auto md:text-sm md:text-stone-600">
          {o.items.map((it) => `${products.find((p) => p.id === it.productId)?.name} (${it.size})`).join(", ")}
        </span>
        <span className="hidden text-sm text-stone-600 md:block">{o.channel}<span className="block text-xs text-stone-400">{o.payment}</span></span>
        <span className="hidden text-right text-sm font-semibold tabular-nums md:block">{taka(orderTotal(o, products))}</span>
        <span className="col-start-2 row-start-1 grid justify-items-end gap-1 md:col-start-auto md:row-start-auto md:block md:text-right">
          <span className="text-sm font-semibold tabular-nums md:hidden">{taka(orderTotal(o, products))}</span>
          <StatusBadge s={o.status} />
        </span>
        <ChevronDown size={16} className={`hidden text-stone-400 transition-transform md:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="pop-in border-t border-stone-100 bg-stone-50/60 px-5 py-4">
          {risky && (
            <p className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
              This number returned <b>{hist.returned} of {hist.orders}</b> past orders. Ask for a bKash delivery-charge advance before shipping.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Items</h3>
              <ul className="grid gap-2">
                {o.items.map((it, i) => {
                  const p = products.find((x) => x.id === it.productId)!;
                  return (
                    <li key={i} className="flex items-center gap-2.5">
                      <Swatch p={p} size={34} />
                      <span className="min-w-0 flex-1 text-sm">
                        {p.name}
                        <span className="block text-xs text-stone-500">
                          Size {it.size} × {it.qty}
                        </span>
                      </span>
                      <span className="text-sm">{taka(p.price * it.qty)}</span>
                    </li>
                  );
                })}
              </ul>
              <dl className="mt-3 grid gap-1 border-t border-stone-200 pt-3 text-sm">
                <Row k="Products" v={taka(itemsTotal(o.items, products))} />
                <Row k={`Delivery (${o.insideDhaka ? "inside" : "outside"} Dhaka)`} v={taka(o.delivery)} />
                <Row k={o.payment === "COD" ? "Advance received" : `Paid by ${o.payment}`} v={`− ${taka(o.paid)}`} />
                <Row k={o.status === "Delivered" ? "Collected" : "Courier collects (COD)"} v={taka(due)} bold />
              </dl>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Customer</h3>
              <p className="text-sm font-medium">{o.customer}</p>
              <p className="text-sm text-stone-600">{o.phone}</p>
              <p className="text-sm text-stone-600">{o.address}</p>
              {hist && !risky && <p className="mt-1 text-xs text-emerald-700">✓ Regular customer · {hist.orders} orders, no returns</p>}

              {o.status !== "Delivered" && o.status !== "Returned" && o.status !== "New" && (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">Courier</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COURIERS.map((c) => (
                      <button key={c} onClick={() => setCourier(o.id, c)} className={`rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${o.courier === c ? "bg-indigo-50 text-brand ring-brand" : "bg-white ring-stone-200"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-stone-400">Progress</h3>
              <ol className="grid gap-1.5">
                {(o.status === "Returned" ? [...FLOW.filter((s) => o.history[s]), "Returned" as Status] : FLOW).map((s) => {
                  const t = o.history[s];
                  return (
                    <li key={s} className="flex items-center gap-2 text-sm">
                      <span className={`h-2.5 w-2.5 rounded-full ${t ? (s === "Returned" ? "bg-rose-500" : "bg-emerald-500") : "bg-stone-300"}`} />
                      <span className={t ? "" : "text-stone-400"}>
                        {s}
                        {s === "Shipped" && o.courier ? ` · ${o.courier}` : ""}
                      </span>
                      {t && <span className="ml-auto text-xs text-stone-400">{timeAgo(t, now)}</span>}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {NEXT_LABEL[o.status] && (
              <button onClick={() => advance(o.id)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                {NEXT_LABEL[o.status]} →
              </button>
            )}
            <button onClick={onPrint} className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50">
              <Printer size={15} /> Print slip
            </button>
            {o.status !== "Delivered" && o.status !== "Returned" && (
              <button onClick={() => markReturned(o.id)} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50">
                {o.status === "Shipped" ? "Returned by customer" : "Cancel order"}
              </button>
            )}
            {o.status === "Returned" && <p className="text-sm text-stone-500">Items went back into stock.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function PackingSlip({ order: o, onClose }: { order: Order; onClose: () => void }) {
  const { products } = useShop();
  const due = dueOnDelivery(o, products);
  return (
    <>
      <div className="no-print fixed inset-0 z-40 grid place-items-center bg-stone-900/40 p-4" onClick={onClose}>
        <div className="pop-in max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <SlipBody order={o} />
          <div className="mt-4 flex gap-2">
            <button onClick={() => window.print()} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white">
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-600 ring-1 ring-stone-200">
              Close
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-stone-400">Courier collects {taka(due)} · {o.payment}</p>
        </div>
      </div>
      <div className="print-sheet">
        <SlipBody order={o} />
      </div>
    </>
  );
}

function SlipBody({ order: o }: { order: Order }) {
  const { products, settings } = useShop();
  const due = dueOnDelivery(o, products);
  return (
    <div className="text-sm text-stone-800">
      <p className="text-center text-lg font-semibold tracking-tight">{settings.name}</p>
      <p className="text-center text-xs text-stone-500">
        {settings.address} · {settings.city}
      </p>
      <p className="text-center text-xs text-stone-500">
        {settings.phone} · bKash/Nagad {settings.bkash}
      </p>
      <div className="my-3 border-y border-dashed border-stone-300 py-3">
        <div className="flex justify-between font-semibold">
          <span>Packing slip</span>
          <span>#{o.id}</span>
        </div>
        <p className="mt-2 font-medium">{o.customer}</p>
        <p>{o.phone}</p>
        <p>{o.address}</p>
        <p className="text-xs text-stone-500">
          {o.insideDhaka ? "Inside Dhaka" : "Outside Dhaka"} · {o.channel} · {o.payment}
          {o.courier ? ` · ${o.courier}` : ""}
        </p>
        <ul className="mt-3 grid gap-1">
          {o.items.map((it, i) => {
            const p = products.find((x) => x.id === it.productId);
            return (
              <li key={i} className="flex justify-between gap-3">
                <span>
                  {it.qty}× {p?.name ?? "Item"} ({it.size})
                </span>
                <span>{p ? taka(p.price * it.qty) : ""}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 grid gap-0.5 border-t border-stone-200 pt-2 text-stone-600">
          <div className="flex justify-between"><span>Products</span><span>{taka(itemsTotal(o.items, products))}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>{taka(o.delivery)}</span></div>
          <div className="flex justify-between"><span>Already paid</span><span>− {taka(o.paid)}</span></div>
        </div>
        <p className="mt-2 flex justify-between text-base font-semibold">
          <span>{o.status === "Delivered" ? "Collected" : "Collect on delivery"}</span>
          <span>{taka(due)}</span>
        </p>
      </div>
      <p className="text-center text-xs text-stone-400">Thank you for ordering from {settings.name}</p>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : "text-stone-600"}`}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
