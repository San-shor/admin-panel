import { STATUS_STYLE, type Product, type Status } from "@/lib/data";

/** A small drawn fabric swatch, so the demo needs no photos. */
export function Swatch({ p, size = 44 }: { p: Product; size?: number }) {
  const [a, b] = p.colors;
  const id = `sw-${p.id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="shrink-0 rounded-xl" aria-hidden>
      <defs>
        <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill={a} />
          {p.category === "Saree" ? (
            <path d="M0 8h10" stroke={b} strokeWidth="1.5" />
          ) : p.category === "Hijab" ? (
            <circle cx="5" cy="5" r="0.8" fill={b} opacity="0.5" />
          ) : (
            <path d="M5 1.5c2 1.5 2 4 0 5.5c-2-1.5-2-4 0-5.5z" fill={b} opacity="0.85" />
          )}
        </pattern>
      </defs>
      <rect width="40" height="40" fill={`url(#${id})`} />
      {p.category === "Saree" && <rect y="30" width="40" height="10" fill={b} opacity="0.9" />}
    </svg>
  );
}

export function StatusBadge({ s }: { s: Status }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_STYLE[s]}`}>{s}</span>;
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)] ${className}`}>{children}</div>;
}

export function PageTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:hidden">{title}</h1>
        {sub && <p className="text-sm text-stone-500">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
