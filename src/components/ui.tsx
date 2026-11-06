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

export function Card({ className = "", children, id }: { className?: string; children: React.ReactNode; id?: string }) {
  return <div id={id} className={`rounded-xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)] ${className}`}>{children}</div>;
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

export const fieldClass =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-indigo-100";

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="no-print fixed inset-0 z-40 flex items-end justify-center bg-stone-900/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`pop-in max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl ${wide ? "max-w-lg" : "max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-xl leading-none text-stone-400 hover:bg-stone-100" aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
