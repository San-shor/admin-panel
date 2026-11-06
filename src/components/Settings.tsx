"use client";

import { useEffect, useState } from "react";
import { useShop } from "@/lib/store";
import { Card, PageTitle, fieldClass } from "@/components/ui";
import type { ShopSettings } from "@/lib/data";

export default function Settings() {
  const { settings, updateSettings, notify } = useShop();
  const [form, setForm] = useState<ShopSettings>(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  function set<K extends keyof ShopSettings>(key: K, value: ShopSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    const name = form.name.trim();
    if (!name) return;
    updateSettings({
      ...form,
      name,
      tagline: form.tagline.trim(),
      city: form.city.trim() || "Dhaka",
      phone: form.phone.trim(),
      address: form.address.trim(),
      bkash: form.bkash.trim(),
      deliveryInside: Math.max(0, Math.round(Number(form.deliveryInside) || 0)),
      deliveryOutside: Math.max(0, Math.round(Number(form.deliveryOutside) || 0)),
      lowStock: Math.max(0, Math.round(Number(form.lowStock) || 0)),
    });
    notify({ tone: "ok", title: "Shop details saved", body: "The sidebar, receipts and packing slips use this name." });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="Shop settings" sub="Put the real shop name here. Receipts, packing slips and delivery charges follow it." />

      <Card className="grid gap-4 p-5">
        <Field label="Shop name">
          <input className={fieldClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="What you sell">
          <input className={fieldClass} value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City">
            <input className={fieldClass} value={form.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Shop phone">
            <input className={fieldClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
        </div>
        <Field label="Address on the receipt">
          <input className={fieldClass} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="bKash / Nagad number printed on slips">
          <input className={fieldClass} value={form.bkash} onChange={(e) => set("bkash", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Delivery inside Dhaka">
            <input type="number" min={0} className={fieldClass} value={form.deliveryInside} onChange={(e) => set("deliveryInside", Number(e.target.value) || 0)} />
          </Field>
          <Field label="Delivery outside">
            <input type="number" min={0} className={fieldClass} value={form.deliveryOutside} onChange={(e) => set("deliveryOutside", Number(e.target.value) || 0)} />
          </Field>
          <Field label="Low-stock warning at">
            <input type="number" min={0} className={fieldClass} value={form.lowStock} onChange={(e) => set("lowStock", Number(e.target.value) || 0)} />
          </Field>
        </div>
        <button onClick={save} disabled={!form.name.trim()} className="rounded-xl bg-brand py-3 font-semibold text-white disabled:opacity-40">
          Save shop details
        </button>
        <p className="text-xs text-stone-400">This demo remembers the name in this browser. Reset sample data brings Noor Boutique back.</p>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-stone-700">
      {label}
      <div className="mt-1.5 font-normal">{children}</div>
    </label>
  );
}
