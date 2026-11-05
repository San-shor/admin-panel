"use client";

import { useShop } from "@/lib/store";
import { Card, PageTitle, Swatch } from "@/components/ui";
import { LOW_STOCK, taka, totalStock } from "@/lib/data";

/** Size-wise stock. Goes down with every order and POS sale. */
export default function Stock() {
  const { products, restock } = useShop();
  const units = products.reduce((a, p) => a + totalStock(p), 0);
  const value = products.reduce((a, p) => a + totalStock(p) * p.cost, 0);
  const lowCount = products.reduce((a, p) => a + Object.values(p.stock).filter((n) => (n ?? 0) <= LOW_STOCK).length, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle title="Stock" sub="Size by size. Updates by itself when you get an order or sell at the shop." />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-stone-500">Pieces in stock</p>
          <p className="text-xl font-semibold">{units}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-stone-500">Stock value (cost)</p>
          <p className="text-xl font-semibold">{taka(value)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-stone-500">Sizes running low</p>
          <p className={`text-xl font-semibold ${lowCount ? "text-rose-600" : ""}`}>{lowCount}</p>
        </Card>
      </div>

      <div className="grid gap-3">
        {products.map((p) => (
          <Card key={p.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
            <Swatch p={p} size={46} />
            <div className="min-w-0 flex-1 basis-40">
              <p className="font-medium leading-snug">{p.name}</p>
              <p className="text-xs text-stone-500">
                {p.category} · sell {taka(p.price)} · profit {taka(p.price - p.cost)}/pc
              </p>
            </div>
            <div className="flex gap-2">
              {Object.entries(p.stock).map(([size, n = 0]) => (
                <div
                  key={size}
                  className={`w-16 rounded-xl p-2 text-center ring-1 ${n === 0 ? "bg-rose-50 ring-rose-200" : n <= LOW_STOCK ? "bg-amber-50 ring-amber-200" : "bg-white ring-stone-200"}`}
                >
                  <p className="text-[11px] text-stone-500">{size === "Free" ? "Stock" : size}</p>
                  <p className={`text-lg font-semibold leading-tight ${n === 0 ? "text-rose-600" : n <= LOW_STOCK ? "text-amber-700" : ""}`}>{n}</p>
                  <button onClick={() => restock(p.id, size, 5)} className="mt-0.5 text-[11px] font-medium text-brand">
                    +5
                  </button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
