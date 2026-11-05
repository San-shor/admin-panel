import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";

export const metadata: Metadata = { title: "Dashboard · Dokan Panel" };

export default function Page() {
  return <Dashboard />;
}
