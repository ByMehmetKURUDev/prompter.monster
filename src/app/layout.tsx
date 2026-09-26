import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ConsentManager } from "@/components/site/ConsentManager";
import { SiteNotice } from "@/components/site/SiteNotice";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Prompt.Monster — Fikirden master build prompt'a",
    template: "%s · Prompt.Monster",
  },
  description:
    "Proje fikrini 12 uzman canavar persona ile Claude Code, Cursor, v0, Lovable ve Bolt için kopyala-yapıştır çalışan master build prompt'lara dönüştür.",
  keywords: ["prompt generator", "vibe coding", "build prompt", "Claude Code", "Cursor", "v0", "Lovable", "Bolt", "SaaS spec"],
  openGraph: {
    type: "website",
    siteName: "Prompt.Monster",
    title: "Prompt.Monster — Fikirden master build prompt'a",
    description: "12 uzman canavar, 8 adımlı mega chain, 5 çıktı formatı. Fikrini AI kodlama araçlarına hazır prompt'a çevir.",
    url: SITE,
  },
  twitter: { card: "summary_large_image", title: "Prompt.Monster", description: "Fikirden master build prompt'a." },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-ink-950 text-zinc-100 antialiased">
        <SiteNotice />
        {children}
        <ConsentManager />
      </body>
    </html>
  );
}
