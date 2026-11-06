"use client";

import { useShop } from "@/lib/store";
import { Card, PageTitle, Swatch } from "@/components/ui";
import { FLOW, dueOnDelivery, itemsCost, itemsTotal, taka, type Item, type Status } from "@/lib/data";

export default function Reports() {
  const { orders, products, sales } = useShop();
  const live = orders.filter((o) => o.status !== "Returned");
  const revenue = live.reduce((a, o) => a + itemsTotal(o.items, products), 0) + sales.reduce((a, s) => a + s.total, 0);
  const cost = live.reduce((a, o) => a + itemsCost(o.items, products), 0) + sales.reduce((a, s) => a + itemsCost(s.items, products), 0);
  const profit = revenue - cost;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
  const returned = orders.filter((o) => o.status === "Returned").length;
  const withCourier = orders.filter((o) => o.status === "Shipped");
  const codWithCourier = withCourier.reduce((a, o) => a + dueOnDelivery(o, products), 0);
  const stillToCollect = orders.filter((o) => o.status !== "Delivered" && o.status !== "Returned").reduce((a, o) => a + dueOnDelivery(o, products), 0);
  const drawer = sales.filter((s) => s.payment === "Cash").reduce((a, s) => a + s.total, 0);
  const mobile = orders.reduce((a, o) => a + o.paid, 0) + sales.filter((s) => s.payment === "bKash" || s.payment === "Nagad").reduce((a, s) => a + s.total, 0);

  const tally = new Map<string, { qty: number; revenue: number }>();
  const add = (items: Item[], discount: number) => {
    const sub = itemsTotal(items, products);
    items.forEach((it) => {
      const p = products.find((x) => x.id === it.productId);
      if (!p) return;
      const gross = p.price * it.qty;
      const share = sub > 0 ? (gross / sub) * discount : 0;
      const row = tally.get(p.id) ?? { qty: 0, revenue: 0 };
      row.qty += it.qty;
      row.revenue += gross - share;
      tally.set(p.id, row);
    });
  };
  live.forEach((o) => add(o.items, 0));
  sales.forEach((s) => add(s.items, s.discount || 0));
  const top = [...tally.entries()]
    .map(([id, v]) => ({ p: products.find((x) => x.id === id), ...v }))
    .filter((x): x is { p: NonNullable<typeof x.p>; qty: number; revenue: number } => !!x.p)
    .sort((a, b) => b.revenue - a.revenue);
  const max = top[0]?.revenue || 1;

  const funnel: Status[] = [...FLOW, "Returned"];
  const pieces = top.reduce((a, x) => a + x.qty, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle title="Reports" sub="Profit, what is still with the courier, and which pieces are selling. Delivery charges are not counted as profit." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Product sales" value={taka(revenue)} hint={`${pieces} pieces, inbox + counter`} />
        <Stat label="Gross profit" value={taka(profit)} hint={`${margin}% margin after your cost`} tone={profit >= 0 ? "good" : "bad"} />
        <Stat label="Still to collect" value={taka(stillToCollect)} hint={`${taka(codWithCourier)} of this is with the courier`} />
        <Stat label="Returned" value={String(returned)} hint={orders.length ? `${Math.round((returned / orders.length) * 100)}% of orders` : "No orders yet"} tone={returned ? "bad" : "good"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold">Best sellers</h2>
          <p className="text-sm text-stone-500">By sales value, excluding returned orders</p>
          {top.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">No sales yet.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {top.slice(0, 6).map((x) => (
                <li key={x.p.id} className="flex items-center gap-3">
                  <Swatch p={x.p} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{x.p.name}</span>
                      <span className="font-semibold tabular-nums">{taka(x.revenue)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-stone-100">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(6, Math.round((x.revenue / max) * 100))}%` }} />
                      </div>
                      <span className="w-12 text-right text-xs text-stone-500 tabular-nums">{x.qty} pc</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="grid gap-4">
          <Card className="p-5">
            <h2 className="font-semibold">Where the money is</h2>
            <ul className="mt-3 grid gap-2 text-sm">
              <Money k="Cash in the drawer" v={taka(drawer)} />
              <Money k="bKash & Nagad received" v={taka(mobile)} />
              <Money k="Open orders, not collected" v={taka(stillToCollect)} />
              <Money k="With courier right now" v={taka(codWithCourier)} />
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Orders by step</h2>
            <ul className="mt-3 grid gap-2">
              {funnel.map((s) => {
                const n = orders.filter((o) => o.status === s).length;
                const pct = orders.length ? Math.round((n / orders.length) * 100) : 0;
                return (
                  <li key={s} className="flex items-center gap-2 text-sm">
                    <span className="w-24 text-stone-600">{s}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-stone-100">
                      <div className={`h-full rounded-full ${s === "Returned" ? "bg-rose-400" : "bg-brand"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right tabular-nums text-stone-500">{n}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "good" | "bad" }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-stone-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${tone === "bad" ? "text-rose-600" : tone === "good" ? "text-emerald-700" : ""}`}>{value}</p>
      <p className="mt-1 text-xs text-stone-500">{hint}</p>
    </Card>
  );
}

function Money({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex justify-between gap-3 border-b border-stone-100 py-2 last:border-0">
      <span className="text-stone-600">{k}</span>
      <span className="font-semibold tabular-nums">{v}</span>
    </li>
  );
}
