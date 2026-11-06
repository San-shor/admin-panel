"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useShop } from "@/lib/store";
import { taka } from "@/lib/data";

/** Header search across orders, products and customers. "/" focuses it. */
export default function SearchBox() {
  const router = useRouter();
  const { orders, products, focus } = useShop();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const query = q.trim().toLowerCase();
  const digits = query.replace(/\D/g, "");
  const phoneHit = (phone: string) => digits.length >= 3 && phone.replace(/\D/g, "").includes(digits);

  const orderHits = query
    ? orders.filter((o) => o.id.includes(query) || o.customer.toLowerCase().includes(query) || o.phone.toLowerCase().includes(query) || phoneHit(o.phone)).slice(0, 5)
    : [];

  const productHits = query ? products.filter((p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)).slice(0, 4) : [];

  const seen = new Set<string>();
  const customerHits = query
    ? orders.filter((o) => {
        if (seen.has(o.phone)) return false;
        const hit = o.customer.toLowerCase().includes(query) || o.phone.toLowerCase().includes(query) || phoneHit(o.phone);
        if (hit) seen.add(o.phone);
        return hit;
      }).slice(0, 4)
    : [];

  const empty = query.length > 0 && !orderHits.length && !productHits.length && !customerHits.length;

  function go(kind: "order" | "product" | "customer", id: string, href: string) {
    focus({ kind, id });
    router.push(href);
    setQ("");
    setOpen(false);
    input.current?.blur();
  }

  function onEnter() {
    if (orderHits[0]) go("order", orderHits[0].id, "/orders");
    else if (customerHits[0]) go("customer", customerHits[0].phone, "/customers");
    else if (productHits[0]) go("product", productHits[0].id, "/stock");
  }

  return (
    <div ref={box} className="relative w-full">
      <label className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500 focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
        <Search size={16} className="shrink-0" />
        <input
          ref={input}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEnter();
            if (e.key === "Escape") {
              setOpen(false);
              input.current?.blur();
            }
          }}
          placeholder="Search orders, customers, phone…"
          className="w-full bg-transparent text-stone-800 outline-none placeholder:text-stone-400"
          aria-label="Search orders, customers and products"
        />
        <kbd className="hidden rounded border border-stone-200 bg-white px-1.5 text-[10px] font-medium text-stone-400 sm:inline">/</kbd>
      </label>

      {open && query && (
        <div className="absolute left-0 right-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-xl shadow-stone-900/10">
          {empty && <p className="px-3 py-3 text-sm text-stone-500">No matches for “{q.trim()}”.</p>}
          {orderHits.length > 0 && (
            <Group label="Orders">
              {orderHits.map((o) => (
                <button key={o.id} onClick={() => go("order", o.id, "/orders")} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-stone-50">
                  <span className="font-mono text-xs text-stone-400">#{o.id}</span>
                  <span className="min-w-0 flex-1 truncate">{o.customer}</span>
                  <span className="text-xs text-stone-400">{o.status}</span>
                </button>
              ))}
            </Group>
          )}
          {customerHits.length > 0 && (
            <Group label="Customers">
              {customerHits.map((o) => (
                <button key={o.phone} onClick={() => go("customer", o.phone, "/customers")} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-stone-50">
                  <span className="min-w-0 flex-1 truncate">{o.customer}</span>
                  <span className="text-xs text-stone-400">{o.phone}</span>
                </button>
              ))}
            </Group>
          )}
          {productHits.length > 0 && (
            <Group label="Products">
              {productHits.map((p) => (
                <button key={p.id} onClick={() => go("product", p.id, "/stock")} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-stone-50">
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-stone-400">{taka(p.price)}</span>
                </button>
              ))}
            </Group>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">{label}</p>
      {children}
    </div>
  );
}
