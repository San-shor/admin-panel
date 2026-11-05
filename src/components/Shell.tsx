"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, ClipboardList, LayoutDashboard, Package, Plus, RotateCcw, ScanBarcode, Search, ShoppingBag, Sparkles, TriangleAlert, CircleCheck, X } from "lucide-react";
import { useShop } from "@/lib/store";
import { SHOP, LOW_STOCK } from "@/lib/data";
import { STUDIO, messengerLink } from "@/lib/config";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/pos", label: "POS", icon: ScanBarcode },
  { href: "/stock", label: "Stock", icon: Package },
];

const TITLES: Record<string, string> = { "/": "Dashboard", "/orders": "Orders", "/pos": "Point of sale", "/stock": "Stock" };

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { orders, products, now, toasts, dismiss } = useShop();
  const newCount = orders.filter((o) => o.status === "New").length;
  const lowCount = products.reduce((a, p) => a + Object.values(p.stock).filter((n) => (n ?? 0) <= LOW_STOCK).length, 0);
  const badge = (href: string) => (href === "/orders" ? newCount : href === "/stock" ? lowCount : 0);
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const today = now ? new Date(now).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "";

  return (
    <div className="flex min-h-screen flex-col">
      <div className="no-print bg-stone-950 px-4 py-1.5 text-center text-xs text-stone-300">
        Demo by <b className="text-white">{STUDIO.name}</b> · sample shop, made-up data
        <a href={messengerLink("Hi WebNest Studio, I want an order & stock panel for my shop.")} className="ml-2 font-semibold text-indigo-300 underline-offset-2 hover:underline">
          Get this for your shop →
        </a>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="no-print hidden w-64 shrink-0 bg-[#14123a] md:block">
        <aside className="sticky top-0 flex h-screen flex-col px-4 py-5 text-indigo-100">
          <ShopName dark />
          <p className="mb-2 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-indigo-300/60">Menu</p>
          <nav className="grid gap-1">
            {NAV.map((n) => {
              const b = badge(n.href);
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(n.href) ? "bg-white/10 text-white" : "text-indigo-200/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {n.label}
                  {b > 0 && (
                    <span className={`ml-auto min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums ${n.href === "/stock" ? "bg-rose-500 text-white" : "bg-amber-400 text-amber-950"}`}>
                      {b}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-400/20 text-sm font-semibold text-indigo-100">SO</span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium text-white">Shop Owner</p>
              <p className="text-xs text-indigo-300/70">Admin</p>
            </div>
          </div>
        </aside>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="no-print sticky top-0 z-20 flex items-center gap-3 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
            <div className="md:hidden">
              <ShopName />
            </div>
            <h1 className="hidden text-lg font-semibold tracking-tight md:block">{TITLES[path] ?? ""}</h1>
            <div className="ml-auto hidden w-72 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400 lg:flex">
              <Search size={16} />
              Search orders, customers, phone…
            </div>
            <span className="ml-auto hidden text-sm text-stone-500 sm:block lg:ml-0">{today}</span>
            <Link href="/orders" className="relative ml-auto grid h-9 w-9 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 sm:ml-0" aria-label="New orders">
              <Bell size={19} strokeWidth={1.8} />
              {newCount > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{newCount}</span>}
            </Link>
          </header>

          <main className="flex-1 px-4 py-5 pb-28 sm:px-6 md:py-6 md:pb-12">{children}</main>

          {/* Bottom nav (mobile) */}
          <nav className="no-print fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-stone-200 bg-white md:hidden">
            {NAV.map((n) => {
              const Icon = n.icon;
              const b = badge(n.href);
              return (
                <Link key={n.href} href={n.href} className={`relative flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${isActive(n.href) ? "text-brand" : "text-stone-500"}`}>
                  <Icon size={20} strokeWidth={1.8} />
                  {n.label}
                  {b > 0 && <span className="absolute right-[24%] top-1.5 h-2 w-2 rounded-full bg-rose-500" />}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <DemoControls />

      {/* Toasts */}
      <div className="no-print fixed right-4 top-16 z-40 grid w-80 gap-2">
        {toasts.map((t) => (
          <button key={t.id} onClick={() => dismiss(t.id)} className="toast-in flex gap-3 rounded-xl border border-stone-200 bg-white p-3.5 text-left shadow-xl shadow-stone-900/10">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${t.tone === "new" ? "bg-indigo-50 text-brand" : t.tone === "warn" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
              {t.tone === "new" ? <ShoppingBag size={18} /> : t.tone === "warn" ? <TriangleAlert size={18} /> : <CircleCheck size={18} />}
            </span>
            <span>
              <span className="block text-sm font-semibold">{t.title}</span>
              <span className="block text-xs text-stone-500">{t.body}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Small floating panel for the demo-only buttons, kept away from the real UI. */
function DemoControls() {
  const { simulateIncoming, reset } = useShop();
  const [open, setOpen] = useState(false);
  return (
    <div className="no-print fixed bottom-20 right-4 z-30 md:bottom-28 md:left-6 md:right-auto">
      {open ? (
        <div className="pop-in w-60 rounded-2xl border border-stone-200 bg-white p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Demo controls</p>
            <button onClick={() => setOpen(false)} className="text-stone-400" aria-label="Close"><X size={16} /></button>
          </div>
          <button onClick={simulateIncoming} className="flex w-full items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            <Plus size={16} /> Send a test order
          </button>
          <button onClick={reset} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-50">
            <RotateCcw size={15} /> Reset demo data
          </button>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white shadow-lg">
          <Sparkles size={14} /> Demo
        </button>
      )}
    </div>
  );
}

function ShopName({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-1">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-rose-500 to-amber-400 text-white shadow-sm" aria-hidden>
        <ShoppingBag size={18} strokeWidth={2} />
      </span>
      <span className="leading-tight">
        <span className={`block text-[15px] font-semibold tracking-tight ${dark ? "text-white" : ""}`}>{SHOP.name}</span>
        <span className={`block text-[11px] ${dark ? "text-indigo-300/70" : "text-stone-500"}`}>Shop admin</span>
      </span>
    </Link>
  );
}
