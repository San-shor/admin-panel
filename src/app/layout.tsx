import type { Metadata } from "next";
import { Geist, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { ShopProvider } from "@/lib/store";
import Shell from "@/components/Shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const hind = Hind_Siliguri({
  variable: "--font-bn",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Dokan Panel: orders, stock and POS for Facebook shops",
  description:
    "One panel for inbox orders, website orders and shop sales. COD and bKash tracking, size-wise stock, courier status and a POS. A demo by WebNest Studio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${hind.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ShopProvider>
          <Shell>{children}</Shell>
        </ShopProvider>
      </body>
    </html>
  );
}
