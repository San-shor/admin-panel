"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Bell,
  CircleCheck,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  RotateCcw,
  ScanBarcode,
  Settings,
  ShoppingBag,
  Sparkles,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { useShop } from "@/lib/store";
import { STUDIO, messengerLink } from "@/lib/config";
import SearchBox from "@/components/SearchBox";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/pos", label: "POS", icon: ScanBarcode },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

const MORE = [
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Shop settings", icon: Settings },
];

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/orders": "Orders",
  "/pos": "Point of sale",
  "/stock": "Stock",
  "/customers": "Customers",
  "/reports": "Reports",
  "/settings": "Shop settings",
};

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { orders, products, settings, now, toasts, dismiss } = useShop();
  const [more, setMore] = useState(false);
  const newCount = orders.filter((o) => o.status === "New").length;
  const lowCount = products.reduce((a, p) => a + Object.values(p.stock).filter((n) => (n ?? 0) <= settings.lowStock).length, 0);
  const badge = (href: string) => (href === "/orders" ? newCount : href === "/stock" ? lowCount : 0);
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const moreActive = MORE.some((n) => isActive(n.href));
  const today = now ? new Date(now).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "";

  return (
    <div className="flex min-h-screen flex-col">
      <div className="no-print flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-[#14123a] px-4 py-1.5 text-center text-xs text-indigo-100">
        <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">Live demo</span>
        <span>
          Sample shop for Facebook sellers · built by <b className="text-white">{STUDIO.name}</b>
        </span>
        <a href={messengerLink("Hi WebNest Studio, I want an order, stock and POS panel for my shop.")} className="font-semibold text-amber-200 underline-offset-2 hover:underline">
          Get this for your shop →
        </a>
      </div>

      <div className="flex flex-1">
        <div className="no-print hidden w-64 shrink-0 bg-[#14123a] md:block">
          <aside className="sticky top-0 flex h-screen flex-col px-4 py-5 text-indigo-100">
            <ShopName dark name={settings.name} city={settings.city} />
            <p className="mb-2 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-indigo-300/60">Menu</p>
            <nav className="grid gap-1">
              {NAV.map((n) => (
                <NavLink key={n.href} {...n} active={isActive(n.href)} badge={badge(n.href)} />
              ))}
            </nav>

            <div className="mt-auto grid gap-2">
              <Link
                href="/settings"
                className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive("/settings") ? "border-amber-300 bg-white/10 text-white" : "border-transparent text-indigo-200/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Settings size={18} strokeWidth={1.8} />
                Shop settings
              </Link>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-400/20 text-sm font-semibold text-indigo-100">NB</span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-medium text-white">Shop owner</p>
                  <p className="text-xs text-indigo-300/70">Admin · {settings.city}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <div className="md:hidden">
                <ShopName name={settings.name} city={settings.city} />
              </div>
              <h1 className="hidden text-lg font-semibold tracking-tight md:block">{TITLES[path] ?? ""}</h1>
              <div className="ml-auto hidden w-80 lg:block">
                <SearchBox />
              </div>
              <span className="ml-auto hidden text-sm text-stone-500 sm:block lg:ml-0">{today}</span>
              <Link href="/orders" className="relative ml-auto grid h-9 w-9 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 sm:ml-0" aria-label="New orders">
                <Bell size={19} strokeWidth={1.8} />
                {newCount > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{newCount}</span>}
              </Link>
            </div>
            <div className="px-4 pb-3 lg:hidden sm:px-6">
              <SearchBox />
            </div>
          </header>

          <main className="flex-1 px-4 py-5 pb-28 sm:px-6 md:py-6 md:pb-12">{children}</main>

          <nav className="no-print fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-stone-200 bg-white md:hidden">
            {NAV.slice(0, 4).map((n) => {
              const Icon = n.icon;
              const b = badge(n.href);
              return (
                <Link key={n.href} href={n.href} className={`relative flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${isActive(n.href) ? "text-brand" : "text-stone-500"}`}>
                  <Icon size={20} strokeWidth={1.8} />
                  {n.label}
                  {b > 0 && <span className="absolute right-[22%] top-1.5 h-2 w-2 rounded-full bg-rose-500" />}
                </Link>
              );
            })}
            <button onClick={() => setMore(true)} className={`relative flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${moreActive ? "text-brand" : "text-stone-500"}`}>
              <Menu size={20} strokeWidth={1.8} />
              More
            </button>
          </nav>
        </div>
      </div>

      {more && (
        <div className="no-print fixed inset-0 z-30 bg-stone-900/40 md:hidden" onClick={() => setMore(false)}>
          <div className="pop-in absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">More</p>
              <button onClick={() => setMore(false)} className="grid h-8 w-8 place-items-center rounded-full text-stone-400" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="grid gap-1">
              {MORE.map((n) => {
                const Icon = n.icon;
                return (
                  <Link key={n.href} href={n.href} onClick={() => setMore(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${isActive(n.href) ? "bg-indigo-50 text-brand" : "text-stone-700"}`}>
                    <Icon size={18} />
                    {n.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <DemoControls />

      <div className="no-print fixed right-4 top-16 z-40 grid w-80 max-w-[calc(100vw-2rem)] gap-2">
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

function NavLink({ href, label, icon: Icon, active, badge }: { href: string; label: string; icon: typeof LayoutDashboard; active: boolean; badge: number }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? "border-amber-300 bg-white/10 text-white" : "border-transparent text-indigo-200/80 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={18} strokeWidth={1.8} />
      {label}
      {badge > 0 && (
        <span className={`ml-auto min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums ${href === "/stock" ? "bg-rose-500 text-white" : "bg-amber-400 text-amber-950"}`}>
          {badge}
        </span>
      )}
    </Link>
  );
}

function DemoControls() {
  const { simulateIncoming, reset } = useShop();
  const [open, setOpen] = useState(false);
  return (
    <div className="no-print fixed bottom-20 right-4 z-30 md:bottom-6 md:left-6 md:right-auto">
      {open ? (
        <div className="pop-in w-64 rounded-2xl border border-stone-200 bg-white p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">For your video</p>
            <button onClick={() => setOpen(false)} className="text-stone-400" aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <button onClick={simulateIncoming} className="flex w-full items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            <Plus size={16} /> A customer just ordered
          </button>
          <button onClick={reset} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-50">
            <RotateCcw size={15} /> Reset sample data
          </button>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-full bg-amber-300 px-3.5 py-2 text-xs font-semibold text-amber-950 shadow-lg">
          <Sparkles size={14} /> Demo
        </button>
      )}
    </div>
  );
}

function ShopName({ dark = false, name, city }: { dark?: boolean; name: string; city: string }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-1">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-rose-500 to-amber-400 text-white shadow-sm" aria-hidden>
        <ShoppingBag size={18} strokeWidth={2} />
      </span>
      <span className="min-w-0 leading-tight">
        <span className={`block truncate text-[15px] font-semibold tracking-tight ${dark ? "text-white" : ""}`}>{name}</span>
        <span className={`block text-[11px] ${dark ? "text-indigo-300/70" : "text-stone-500"}`}>{city} · Admin</span>
      </span>
    </Link>
  );
}
