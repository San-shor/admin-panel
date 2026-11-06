import type { Metadata } from "next";
import Customers from "@/components/Customers";

export const metadata: Metadata = { title: "Customers · Dokan Panel" };

export default function Page() {
  return <Customers />;
}
