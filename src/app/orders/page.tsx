import type { Metadata } from "next";
import Orders from "@/components/Orders";

export const metadata: Metadata = { title: "Orders · Dokan Panel" };

export default function Page() {
  return <Orders />;
}
