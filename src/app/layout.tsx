import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZecWild — Shielded Sealed-Bid Auctions & Open Marketplace",
  description:
    "Direct wallet-to-wallet shielded ZEC payments, zero platform custody, and cryptographically sealed bids powered by Zcash Orchard and Sapling.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#F3F2EE] text-[#1A1816] antialiased selection:bg-[#D96522]/20 selection:text-[#A7430B]">
        {children}
      </body>
    </html>
  );
}
