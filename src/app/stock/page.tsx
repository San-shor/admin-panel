import type { Metadata } from "next";
import Stock from "@/components/Stock";

export const metadata: Metadata = { title: "Stock · Dokan Panel" };

export default function Page() {
  return <Stock />;
}
