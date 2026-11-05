import type { Metadata } from "next";
import Pos from "@/components/Pos";

export const metadata: Metadata = { title: "POS · Dokan Panel" };

export default function Page() {
  return <Pos />;
}
