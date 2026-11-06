"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, TriangleAlert } from "lucide-react";
import { useShop } from "@/lib/store";
import { Card, PageTitle, StatusBadge } from "@/components/ui";
import { customerRows, isRisky, orderTotal, taka, timeAgo } from "@/lib/data";

export default function Customers() {
  const { orders, products, now, spotlight, clearFocus, focus } = useShop();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const scrollTo = useRef<string | null>(null);

  useEffect(() => {
    if (spotlight?.kind !== "customer") return;
    scrollTo.current = spotlight.id;
    setQuery("");
    setOpen(spotlight.id);
    clearFocus();
  }, [spotlight, clearFocus]);

  useEffect(() => {
    if (!open || scrollTo.current !== open) return;
    scrollTo.current = null;
    document.getElementById(`customer-${open}`)?.scrollIntoView({ block: "center" });
  }, [open]);

  const rows = customerRows(orders, products);
  const q = query.trim().toLowerCase();
  const digits = q.replace(/\D/g, "");
  const list = rows.filter((r) => {
    if (!q) return true;
    return r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q) || (digits.length >= 3 && r.phone.replace(/\D/g, "").includes(digits));
  });
  const riskyCount = rows.filter((r) => isRisky(r.phone, r.returns)).length;
  const repeat = rows.filter((r) => (r.prior?.orders ?? r.orders.length) > 1).length;

  function openOrder(id: string) {
    focus({ kind: "order", id });
    router.push("/orders");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle title="Customers" sub="Everyone who ordered, with spend and anyone who has sent parcels back." />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-stone-500">Customers</p>
          <p className="text-xl font-semibold tabular-nums">{rows.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-stone-500">Ordered before</p>
          <p className="text-xl font-semibold tabular-nums">{repeat}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-stone-500">Return risk</p>
          <p className={`text-xl font-semibold tabular-nums ${riskyCount ? "text-rose-600" : ""}`}>{riskyCount}</p>
        </Card>
      </div>

      <label className="mb-3 flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-500 focus-within:border-brand focus-within:ring-2 focus-within:ring-indigo-100">
        <Search size={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or phone" className="w-full bg-transparent text-stone-800 outline-none placeholder:text-stone-400" aria-label="Search customers" />
      </label>

      <Card className="overflow-hidden">
        {list.length === 0 && <p className="p-10 text-center text-sm text-stone-500">No customers match.</p>}
        <div className="divide-y divide-stone-100">
          {list.map((r) => {
            const risky = isRisky(r.phone, r.returns);
            const shown = open === r.phone;
            return (
              <div key={r.phone} id={`customer-${r.phone}`}>
                <button onClick={() => setOpen(shown ? null : r.phone)} className={`flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-stone-50 ${shown ? "bg-stone-50" : ""}`}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-semibold text-brand">
                    {r.name.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="truncate">{r.name}</span>
                      {risky && <TriangleAlert size={14} className="shrink-0 text-rose-500" aria-label="Returned before" />}
                    </span>
                    <span className="block text-xs text-stone-400">{r.phone}</span>
                  </span>
                  <span className="hidden text-right text-xs text-stone-500 sm:block">
                    {r.orders.length} order{r.orders.length === 1 ? "" : "s"}
                    <span className="block">{timeAgo(r.orders[0].createdAt, now)}</span>
                  </span>
                  <span className="w-24 text-right text-sm font-semibold tabular-nums">{taka(r.spent)}</span>
                </button>
                {shown && (
                  <div className="pop-in border-t border-stone-100 bg-stone-50/70 px-5 py-4">
                    <p className="text-sm text-stone-600">{r.address}</p>
                    {r.prior && (
                      <p className={`mt-2 text-sm ${risky ? "text-rose-700" : "text-emerald-700"}`}>
                        {risky
                          ? `Earlier record: ${r.prior.returned} of ${r.prior.orders} orders were returned. Ask for a delivery-charge advance.`
                          : `Earlier record: ${r.prior.orders} orders, no returns.`}
                      </p>
                    )}
                    {!r.prior && r.returns > 0 && <p className="mt-2 text-sm text-rose-700">{r.returns} returned in this panel.</p>}
                    <ul className="mt-3 grid gap-1.5">
                      {r.orders.map((o) => (
                        <li key={o.id}>
                          <button onClick={() => openOrder(o.id)} className="flex w-full items-center gap-3 rounded-lg bg-white px-3 py-2 text-left text-sm ring-1 ring-stone-200 hover:ring-brand">
                            <span className="font-mono text-xs text-stone-400">#{o.id}</span>
                            <span className="text-stone-500">{o.channel}</span>
                            <span className="ml-auto"><StatusBadge s={o.status} /></span>
                            <span className="w-20 text-right font-medium tabular-nums">{taka(orderTotal(o, products))}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
