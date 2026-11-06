import type { Metadata } from "next";
import Settings from "@/components/Settings";

export const metadata: Metadata = { title: "Shop settings · Dokan Panel" };

export default function Page() {
  return <Settings />;
}
