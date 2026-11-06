"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useShop } from "@/lib/store";
import { Card, Modal, PageTitle, Swatch, fieldClass } from "@/components/ui";
import { PALETTES, taka, totalStock, type Category, type Size } from "@/lib/data";

const CATS: Category[] = ["Kurti", "Three-piece", "Saree", "Hijab"];

/** Size-wise stock. Goes down with every order and POS sale. */
export default function Stock() {
  const { products, settings, restock, updateProduct, spotlight, clearFocus, notify } = useShop();
  const [query, setQuery] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [flashId, setFlashId] = useState<string | null>(null);

  useEffect(() => {
    if (spotlight?.kind !== "product") return;
    const id = spotlight.id;
    setOnlyLow(false);
    setQuery("");
    setFlashId(id);
    clearFocus();
    requestAnimationFrame(() => document.getElementById(`product-${id}`)?.scrollIntoView({ block: "center" }));
  }, [spotlight, clearFocus]);

  const units = products.reduce((a, p) => a + totalStock(p), 0);
  const value = products.reduce((a, p) => a + totalStock(p) * p.cost, 0);
  const retail = products.reduce((a, p) => a + totalStock(p) * p.price, 0);
  const lowCount = products.reduce((a, p) => a + Object.values(p.stock).filter((n) => (n ?? 0) <= settings.lowStock).length, 0);

  const q = query.trim().toLowerCase();
  const list = products.filter((p) => {
    const low = Object.values(p.stock).some((n) => (n ?? 0) <= settings.lowStock);
    if (onlyLow && !low) return false;
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  function openEdit(id: string, currentPrice: number, currentCost: number) {
    setEditId(id);
    setPrice(currentPrice);
    setCost(currentCost);
  }

  function saveEdit() {
    if (!editId) return;
    updateProduct(editId, { price, cost });
    notify({ tone: "ok", title: "Price updated", body: price < cost ? "Selling price is below cost." : "New orders and the POS use this price." });
    setEditId(null);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle
        title="Stock"
        sub="Size by size. An inbox order and a counter sale take from the same shelf."
        right={
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark">
            <Plus size={16} /> Add product
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-stone-500">Pieces in stock</p>
          <p className="text-xl font-semibold tabular-nums">{units}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-stone-500">Stock at cost</p>
          <p className="text-xl font-semibold tabular-nums">{taka(value)}</p>
          <p className="text-xs text-stone-400">Retail {taka(retail)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-stone-500">Sizes running low</p>
          <p className={`text-xl font-semibold tabular-nums ${lowCount ? "text-rose-600" : ""}`}>{lowCount}</p>
        </Card>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="flex min-w-48 flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-500 focus-within:border-brand focus-within:ring-2 focus-within:ring-indigo-100">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" className="w-full bg-transparent text-stone-800 outline-none placeholder:text-stone-400" aria-label="Search products" />
        </label>
        <button onClick={() => setOnlyLow((v) => !v)} className={`rounded-xl px-3 py-2 text-sm font-medium ring-1 ${onlyLow ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-white text-stone-600 ring-stone-200"}`}>
          Running low{lowCount ? ` · ${lowCount}` : ""}
        </button>
      </div>

      <div className="grid gap-3">
        {list.length === 0 && <Card className="p-8 text-center text-sm text-stone-500">No products match.</Card>}
        {list.map((p) => (
          <Card key={p.id} id={`product-${p.id}`} className={`p-3 ${flashId === p.id ? "flash" : ""}`}>
            <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
              <Swatch p={p} size={46} />
              <div className="min-w-0 flex-1 basis-40">
                <p className="font-medium leading-snug">{p.name}</p>
                <p className="text-xs text-stone-500">
                  {p.category} · sell {taka(p.price)} · profit {taka(p.price - p.cost)}/pc
                </p>
                <button onClick={() => openEdit(p.id, p.price, p.cost)} className="mt-1 text-xs font-medium text-brand">
                  Edit price
                </button>
              </div>
              <div className="flex gap-2">
                {Object.entries(p.stock).map(([size, n = 0]) => (
                  <div key={size} className={`w-[4.5rem] rounded-xl p-2 text-center ring-1 ${n === 0 ? "bg-rose-50 ring-rose-200" : n <= settings.lowStock ? "bg-amber-50 ring-amber-200" : "bg-white ring-stone-200"}`}>
                    <p className="text-[11px] text-stone-500">{size === "Free" ? "Stock" : size}</p>
                    <p className={`text-lg font-semibold leading-tight tabular-nums ${n === 0 ? "text-rose-600" : n <= settings.lowStock ? "text-amber-700" : ""}`}>{n}</p>
                    <div className="mt-0.5 flex justify-center gap-1.5 text-[11px] font-medium text-brand">
                      <button onClick={() => restock(p.id, size, 1)}>+1</button>
                      <button onClick={() => restock(p.id, size, 5)}>+5</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {editId === p.id && (
              <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-3">
                <label className="text-xs text-stone-500">
                  Selling price
                  <input type="number" min={0} className={`${fieldClass} mt-1 w-28`} value={price || ""} onChange={(e) => setPrice(Number(e.target.value) || 0)} />
                </label>
                <label className="text-xs text-stone-500">
                  Your cost
                  <input type="number" min={0} className={`${fieldClass} mt-1 w-28`} value={cost || ""} onChange={(e) => setCost(Number(e.target.value) || 0)} />
                </label>
                <button onClick={saveEdit} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white">Save</button>
                <button onClick={() => setEditId(null)} className="rounded-lg px-3 py-2 text-sm text-stone-500">Cancel</button>
                {price < cost && <p className="w-full text-xs text-rose-600">This price is below what the piece costs you.</p>}
              </div>
            )}
          </Card>
        ))}
      </div>

      {adding && <AddProduct onClose={() => setAdding(false)} />}
    </div>
  );
}

function AddProduct({ onClose }: { onClose: () => void }) {
  const { addProduct, notify } = useShop();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Kurti");
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [sized, setSized] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({ M: 0, L: 0, XL: 0, Free: 0 });
  const [palette, setPalette] = useState(0);

  const ok = name.trim().length > 1 && price > 0;

  function save() {
    if (!ok) return;
    const stock = sized
      ? { M: counts.M || 0, L: counts.L || 0, XL: counts.XL || 0 }
      : { Free: counts.Free || 0 };
    addProduct({ name: name.trim(), category, price: Math.round(price), cost: Math.round(Math.max(0, cost)), colors: PALETTES[palette], stock });
    notify({ tone: "ok", title: "Product added", body: `${name.trim()} is on the POS and in new orders.` });
    onClose();
  }

  const sizes: Size[] = sized ? ["M", "L", "XL"] : ["Free"];

  return (
    <Modal title="Add product" onClose={onClose} wide>
      <div className="grid gap-3">
        <input className={fieldClass} placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c);
                setSized(c === "Kurti" || c === "Three-piece");
              }}
              className={`rounded-lg px-3 py-1.5 text-sm ring-1 ${category === c ? "bg-brand text-white ring-brand" : "bg-white ring-stone-200"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-stone-500">
            Selling price
            <input type="number" min={0} className={`${fieldClass} mt-1`} value={price || ""} placeholder="0" onChange={(e) => setPrice(Number(e.target.value) || 0)} />
          </label>
          <label className="text-xs text-stone-500">
            Your cost
            <input type="number" min={0} className={`${fieldClass} mt-1`} value={cost || ""} placeholder="0" onChange={(e) => setCost(Number(e.target.value) || 0)} />
          </label>
        </div>
        <div>
          <p className="mb-1.5 text-xs text-stone-500">Opening stock</p>
          <div className="flex gap-2">
            {sizes.map((s) => (
              <label key={s} className="text-xs text-stone-500">
                {s === "Free" ? "Pieces" : s}
                <input type="number" min={0} className={`${fieldClass} mt-1 w-20`} value={counts[s] || ""} placeholder="0" onChange={(e) => setCounts((c) => ({ ...c, [s]: Math.max(0, Number(e.target.value) || 0) }))} />
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs text-stone-500">Colour</p>
          <div className="flex gap-2">
            {PALETTES.map(([a], i) => (
              <button key={a} onClick={() => setPalette(i)} className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ${palette === i ? "ring-brand" : "ring-transparent"}`} style={{ background: a }} aria-label={`Colour ${i + 1}`} />
            ))}
          </div>
        </div>
        {price > 0 && <p className="text-sm text-stone-500">Profit {taka(price - cost)} per piece.</p>}
        <button onClick={save} disabled={!ok} className="rounded-xl bg-brand py-3 font-semibold text-white disabled:opacity-40">
          Save product
        </button>
      </div>
    </Modal>
  );
}
