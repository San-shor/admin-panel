"use client";

import Link from "next/link";
import { ArrowRight, Banknote, ClipboardList, Globe, MessageCircle, Store, TrendingUp, Truck, Wallet } from "lucide-react";
import { useShop } from "@/lib/store";
import { Card, PageTitle, StatusBadge, Swatch } from "@/components/ui";
import WeekChart from "@/components/WeekChart";
import { EARLIER_POS_TODAY, LOW_STOCK, PAST_WEEK, SHOP, dueOnDelivery, orderTotal, taka, timeAgo, type Channel } from "@/lib/data";

const CHANNEL_ICON = { "Facebook inbox": MessageCircle, Website: Globe, "Shop (POS)": Store } as const;

export default function Dashboard() {
  const { orders, products, sales, now } = useShop();
  const live = orders.filter((o) => o.status !== "Returned");
  const productSales = (list: typeof live) => list.reduce((a, o) => a + orderTotal(o, products) - o.delivery, 0);

  const posTotal = EARLIER_POS_TODAY + sales.reduce((a, s) => a + s.total, 0);
  const todayTotal = productSales(live) + posTotal;
  const yesterday = PAST_WEEK[PAST_WEEK.length - 1];
  const change = Math.round(((todayTotal - yesterday) / yesterday) * 100);
  const todo = orders.filter((o) => ["New", "Confirmed", "Packed"].includes(o.status));
  const shipped = orders.filter((o) => o.status === "Shipped");
  const codDue = shipped.reduce((a, o) => a + dueOnDelivery(o, products), 0);
  const bkash = orders.reduce((a, o) => a + o.paid, 0) + sales.filter((s) => s.payment === "bKash").reduce((a, s) => a + s.total, 0);

  const channels: { c: Channel; v: number }[] = [
    { c: "Facebook inbox", v: productSales(live.filter((o) => o.channel === "Facebook inbox")) },
    { c: "Website", v: productSales(live.filter((o) => o.channel === "Website")) },
    { c: "Shop (POS)", v: posTotal },
  ];

  const low = products
    .flatMap((p) => Object.entries(p.stock).map(([size, n]) => ({ p, size, n: n ?? 0 })))
    .filter((x) => x.n <= LOW_STOCK)
    .sort((a, b) => a.n - b.n);

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle title="Dashboard" sub={`Here is how ${SHOP.name} is doing today.`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<TrendingUp size={18} />} label="Today's sales" value={taka(todayTotal)}>
          <span className={change >= 0 ? "text-emerald-600" : "text-rose-600"}>{change >= 0 ? "▲" : "▼"} {Math.abs(change)}%</span> vs yesterday
        </Stat>
        <Stat icon={<ClipboardList size={18} />} label="Orders to handle" value={String(todo.length)}>
          {orders.filter((o) => o.status === "New").length} new, waiting to confirm
        </Stat>
        <Stat icon={<Truck size={18} />} label="COD with courier" value={taka(codDue)}>
          {shipped.length} parcel{shipped.length === 1 ? "" : "s"} on the way
        </Stat>
        <Stat icon={<Wallet size={18} />} label="bKash received" value={taka(bkash)}>
          Advance + full payments
        </Stat>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold">Sales, last 7 days</h2>
              <p className="text-sm text-stone-500">All channels together</p>
            </div>
            <p className="text-right">
              <span className="block text-xl font-semibold tabular-nums">{taka(PAST_WEEK.reduce((a, b) => a + b, 0) + todayTotal)}</span>
              <span className="text-xs text-stone-500">this week</span>
            </p>
          </div>
          <div className="mt-3">
            <WeekChart values={[...PAST_WEEK, todayTotal]} now={now} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Today by channel</h2>
          <p className="text-sm text-stone-500">Where the money came from</p>
          <ul className="mt-4 grid gap-4">
            {channels.map((x) => {
              const Icon = CHANNEL_ICON[x.c];
              const pct = Math.round((x.v / Math.max(todayTotal, 1)) * 100);
              return (
                <li key={x.c} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-brand">
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{x.c}</span>
                      <span className="font-semibold tabular-nums">{taka(x.v)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-stone-100">
                        <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-xs text-stone-500 tabular-nums">{pct}%</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex items-center gap-2 rounded-lg bg-stone-50 p-3 text-xs text-stone-600">
            <Banknote size={16} className="text-stone-400" />
            Cash in drawer: <b className="tabular-nums">{taka(posTotal - sales.filter((s) => s.payment === "bKash").reduce((a, s) => a + s.total, 0))}</b>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="font-semibold">Latest orders</h2>
            <Link href="/orders" className="flex items-center gap-1 text-sm font-medium text-brand">
              View all <ArrowRight size={15} />
            </Link>
          </div>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-y border-stone-100 bg-stone-50/70 text-left text-xs font-medium text-stone-500">
                <th className="px-5 py-2 font-medium">Order</th>
                <th className="py-2 font-medium">Customer</th>
                <th className="hidden py-2 font-medium sm:table-cell">Channel</th>
                <th className="py-2 pr-3 text-right font-medium">Total</th>
                <th className="py-2 pr-5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.slice(0, 6).map((o) => (
                <tr key={o.id} className={now - o.createdAt < 60_000 ? "flash" : ""}>
                  <td className="px-5 py-3 font-mono text-xs text-stone-500">#{o.id}</td>
                  <td className="py-3">
                    <p className="font-medium">{o.customer}</p>
                    <p className="text-xs text-stone-400">{timeAgo(o.createdAt, now)}</p>
                  </td>
                  <td className="hidden py-3 text-stone-600 sm:table-cell">
                    {o.channel} · {o.payment}
                  </td>
                  <td className="py-3 pr-3 text-right font-medium tabular-nums">{taka(orderTotal(o, products))}</td>
                  <td className="py-3 pr-5 text-right">
                    <StatusBadge s={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Low stock</h2>
            <Link href="/stock" className="flex items-center gap-1 text-sm font-medium text-brand">
              Stock <ArrowRight size={15} />
            </Link>
          </div>
          {low.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">All sizes are in stock.</p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {low.slice(0, 6).map((x) => (
                <li key={x.p.id + x.size} className="flex items-center gap-3">
                  <Swatch p={x.p} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{x.p.name}</span>
                    <span className="text-xs text-stone-500">Size {x.size}</span>
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${x.n === 0 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                    {x.n === 0 ? "Sold out" : `${x.n} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, children }: { icon: React.ReactNode; label: string; value: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">{label}</p>
        <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-brand sm:grid">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{children}</p>
    </Card>
  );
}
