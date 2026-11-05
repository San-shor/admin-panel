// Sample shop data for the demo. Everything here is made up.

export const SHOP = {
  name: "Your Shop",
  tagline: "Kurti · Three-piece · Saree · Hijab",
  city: "Dhaka",
};

export const SIZES = ["M", "L", "XL"] as const;
export type Size = (typeof SIZES)[number] | "Free";

export type Category = "Kurti" | "Three-piece" | "Saree" | "Hijab";

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  cost: number;
  /** Two colors used to draw the fabric swatch. */
  colors: [string, string];
  stock: Partial<Record<Size, number>>;
};

export type Channel = "Facebook inbox" | "Website" | "Shop (POS)";
export type Payment = "COD" | "bKash" | "Cash";
export type Status = "New" | "Confirmed" | "Packed" | "Shipped" | "Delivered" | "Returned";

export const FLOW: Status[] = ["New", "Confirmed", "Packed", "Shipped", "Delivered"];

export type Item = { productId: string; size: Size; qty: number };

export type Order = {
  id: string;
  createdAt: number;
  customer: string;
  phone: string;
  address: string;
  insideDhaka: boolean;
  channel: Channel;
  payment: Payment;
  /** Money already received (bKash advance or full bKash payment). */
  paid: number;
  items: Item[];
  delivery: number;
  status: Status;
  courier?: string;
  /** Unix ms of each status change, for the timeline. */
  history: Partial<Record<Status, number>>;
};

export const DELIVERY = { inside: 70, outside: 130 };
export const LOW_STOCK = 2;

export const PRODUCTS: Product[] = [
  { id: "p1", name: "Block-print cotton kurti", category: "Kurti", price: 1250, cost: 720, colors: ["#0f766e", "#fde68a"], stock: { M: 4, L: 6, XL: 2 } },
  { id: "p2", name: "Paisley lawn three-piece", category: "Three-piece", price: 2450, cost: 1500, colors: ["#7c2d12", "#fdba74"], stock: { M: 3, L: 1, XL: 4 } },
  { id: "p3", name: "Embroidered georgette kurti", category: "Kurti", price: 1890, cost: 1100, colors: ["#831843", "#f9a8d4"], stock: { M: 5, L: 7, XL: 0 } },
  { id: "p4", name: "Tangail cotton saree", category: "Saree", price: 1650, cost: 980, colors: ["#b91c1c", "#fef3c7"], stock: { Free: 9 } },
  { id: "p5", name: "Jersey hijab (pack of 2)", category: "Hijab", price: 450, cost: 210, colors: ["#334155", "#cbd5e1"], stock: { Free: 22 } },
  { id: "p6", name: "Linen Eid three-piece", category: "Three-piece", price: 3200, cost: 2050, colors: ["#3f6212", "#d9f99d"], stock: { M: 2, L: 3, XL: 1 } },
  { id: "p7", name: "Jamdani half-silk saree", category: "Saree", price: 4800, cost: 3300, colors: ["#1e3a8a", "#fcd34d"], stock: { Free: 3 } },
  { id: "p8", name: "Short tunic kurti", category: "Kurti", price: 990, cost: 560, colors: ["#6b21a8", "#e9d5ff"], stock: { M: 8, L: 5, XL: 6 } },
];

/** Past customers by phone. Used for the "returned before" warning. */
export const CUSTOMER_HISTORY: Record<string, { orders: number; returned: number }> = {
  "01712-448210": { orders: 6, returned: 0 },
  "01988-301776": { orders: 3, returned: 2 },
  "01633-920145": { orders: 2, returned: 0 },
};

export const COURIERS = ["Steadfast", "Pathao", "RedX"];

// Seed orders. Times are minutes before "now" so the demo always looks fresh.
type Seed = Omit<Order, "createdAt" | "history"> & { ago: number };

const SEED: Seed[] = [
  { id: "1048", ago: 12, customer: "Nusrat Jahan", phone: "01712-448210", address: "House 14, Road 3, Dhanmondi", insideDhaka: true, channel: "Facebook inbox", payment: "COD", paid: 0, items: [{ productId: "p3", size: "L", qty: 1 }], delivery: 70, status: "New" },
  { id: "1047", ago: 38, customer: "Farhana Akter", phone: "01988-301776", address: "Kandirpar, Cumilla", insideDhaka: false, channel: "Facebook inbox", payment: "COD", paid: 0, items: [{ productId: "p2", size: "M", qty: 1 }, { productId: "p5", size: "Free", qty: 1 }], delivery: 130, status: "New" },
  { id: "1046", ago: 75, customer: "Sadia Islam", phone: "01633-920145", address: "Sector 7, Uttara", insideDhaka: true, channel: "Website", payment: "bKash", paid: 1890, items: [{ productId: "p3", size: "M", qty: 1 }], delivery: 70, status: "Confirmed" },
  { id: "1045", ago: 140, customer: "Tania Rahman", phone: "01819-554032", address: "Zindabazar, Sylhet", insideDhaka: false, channel: "Facebook inbox", payment: "COD", paid: 200, items: [{ productId: "p6", size: "L", qty: 1 }], delivery: 130, status: "Packed" },
  { id: "1044", ago: 260, customer: "Mim Chowdhury", phone: "01557-118904", address: "GEC Circle, Chattogram", insideDhaka: false, channel: "Website", payment: "COD", paid: 0, items: [{ productId: "p4", size: "Free", qty: 1 }, { productId: "p5", size: "Free", qty: 2 }], delivery: 130, status: "Shipped", courier: "Steadfast" },
  { id: "1043", ago: 400, customer: "Rumana Haque", phone: "01711-670233", address: "Block C, Mirpur 10", insideDhaka: true, channel: "Facebook inbox", payment: "bKash", paid: 1320, items: [{ productId: "p1", size: "XL", qty: 1 }], delivery: 70, status: "Delivered", courier: "Pathao" },
];

const flowUpTo = (s: Status) => (s === "Returned" ? [...FLOW.slice(0, 4), "Returned" as Status] : FLOW.slice(0, FLOW.indexOf(s) + 1));

export function seedOrders(now: number): Order[] {
  return SEED.map(({ ago, ...o }) => {
    const createdAt = now - ago * 60_000;
    const steps = flowUpTo(o.status);
    const history: Order["history"] = {};
    const gap = (ago * 60_000) / steps.length;
    steps.forEach((s, i) => (history[s] = createdAt + i * gap));
    return { ...o, createdAt, history };
  });
}

/** Earlier sales today that are not in the order list (shop counter). */
export const EARLIER_POS_TODAY = 6420;

// An incoming order used by the "New order arrives" demo button.
export const INCOMING: Omit<Order, "id" | "createdAt" | "history" | "status"> [] = [
  { customer: "Ayesha Siddika", phone: "01745-207519", address: "Rampura, Dhaka", insideDhaka: true, channel: "Facebook inbox", payment: "COD", paid: 0, items: [{ productId: "p6", size: "M", qty: 1 }], delivery: 70 },
  { customer: "Shirin Sultana", phone: "01988-301776", address: "Kandirpar, Cumilla", insideDhaka: false, channel: "Facebook inbox", payment: "COD", paid: 0, items: [{ productId: "p7", size: "Free", qty: 1 }], delivery: 130 },
  { customer: "Lamia Hossain", phone: "01916-334287", address: "Banani, Dhaka", insideDhaka: true, channel: "Website", payment: "bKash", paid: 2520, items: [{ productId: "p2", size: "L", qty: 1 }], delivery: 70 },
];

// ---------- helpers ----------

export const taka = (n: number) => `৳${Math.round(n).toLocaleString("en-IN")}`;

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id)!;

export const itemsTotal = (items: Item[], products: Product[]) =>
  items.reduce((sum, it) => sum + (products.find((p) => p.id === it.productId)?.price ?? 0) * it.qty, 0);

export const orderTotal = (o: Order, products: Product[]) => itemsTotal(o.items, products) + o.delivery;

/** Money the courier still has to collect from the customer. */
export const dueOnDelivery = (o: Order, products: Product[]) => Math.max(orderTotal(o, products) - o.paid, 0);

export const totalStock = (p: Product) => Object.values(p.stock).reduce((a, b) => a + (b ?? 0), 0);

export function timeAgo(ms: number, now: number) {
  const m = Math.max(0, Math.round((now - ms) / 60_000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return `${h} hr${h > 1 ? "s" : ""} ago`;
}

export const STATUS_STYLE: Record<Status, string> = {
  New: "bg-amber-100 text-amber-800 ring-amber-200",
  Confirmed: "bg-sky-100 text-sky-800 ring-sky-200",
  Packed: "bg-violet-100 text-violet-800 ring-violet-200",
  Shipped: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  Delivered: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Returned: "bg-rose-100 text-rose-800 ring-rose-200",
};

/** Total sales of the 6 days before today (oldest first), for the weekly chart. */
export const PAST_WEEK = [14250, 18900, 11600, 22400, 16850, 19300];
