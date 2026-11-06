import type { Metadata } from "next";
import Reports from "@/components/Reports";

export const metadata: Metadata = { title: "Reports · Dokan Panel" };

export default function Page() {
  return <Reports />;
}
