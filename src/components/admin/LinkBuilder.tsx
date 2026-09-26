"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster";

const PRESETS: { label: string; source: string; medium: string; campaign: string; code: string; path: string }[] = [
  { label: "Product Hunt", source: "producthunt", medium: "launch", campaign: "ph-2026", code: "PH40", path: "/" },
  { label: "YouTube içerik üreticisi", source: "youtube-kanaladi", medium: "creator", campaign: "lansman", code: "KANAL30", path: "/" },
  { label: "X / Twitter", source: "x", medium: "social", campaign: "lansman", code: "", path: "/" },
  { label: "LinkedIn", source: "linkedin", medium: "social", campaign: "lansman", code: "", path: "/" },
  { label: "Google Ads", source: "google", medium: "cpc", campaign: "brand-tr", code: "", path: "/" },
  { label: "Bülten / e-posta", source: "newsletter", medium: "email", campaign: "", code: "", path: "/pricing" },
];

/** Builds a campaign link (utm_* + optional ?code=) the admin can hand to a creator or paste in a post. */
export function LinkBuilder() {
  const [f, setF] = useState({ source: "", medium: "", campaign: "", code: "", path: "/" });
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    const u = new URL(f.path || "/", SITE);
    const clean = (v: string) => v.trim().toLowerCase().replace(/[^a-z0-9._+-]/g, "-");
    if (f.source) u.searchParams.set("utm_source", clean(f.source));
    if (f.medium) u.searchParams.set("utm_medium", clean(f.medium));
    if (f.campaign) u.searchParams.set("utm_campaign", clean(f.campaign));
    if (f.code) u.searchParams.set("code", f.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ""));
    return u.toString();
  }, [f]);

  const input = "h-9 px-3 rounded-lg bg-ink-950 border border-ink-600 text-[13px] focus:outline-none focus:border-violet w-full";

  return (
    <div className="space-y-4 text-[13px]">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setF({ source: p.source, medium: p.medium, campaign: p.campaign, code: p.code, path: p.path })}
            className="h-8 px-3 rounded-full border border-ink-600 bg-ink-800 text-zinc-300 hover:text-white hover:border-ink-400"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <label className="space-y-1">
          <span className="text-[11px] text-zinc-500">Kaynak (utm_source)</span>
          <input className={input} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} placeholder="producthunt" />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] text-zinc-500">Ortam (utm_medium)</span>
          <input className={input} value={f.medium} onChange={(e) => setF({ ...f, medium: e.target.value })} placeholder="creator / cpc / social" />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] text-zinc-500">Kampanya (utm_campaign)</span>
          <input className={input} value={f.campaign} onChange={(e) => setF({ ...f, campaign: e.target.value })} placeholder="lansman" />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] text-zinc-500">İndirim kodu (Lemon Squeezy)</span>
          <input className={input} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="PH40" />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] text-zinc-500">Açılış sayfası</span>
          <select className={input} value={f.path} onChange={(e) => setF({ ...f, path: e.target.value })}>
            <option value="/">Ana sayfa</option>
            <option value="/pricing">Fiyat</option>
            <option value="/studio">Studio</option>
            <option value="/prompt">Build prompt&apos;lar</option>
            <option value="/docs">Rehber</option>
          </select>
        </label>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 truncate rounded-lg bg-ink-950 border border-ink-600 px-3 h-10 flex items-center text-zinc-200">{url}</code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* clipboard blocked */
            }
          }}
          className="h-10 px-4 rounded-lg bg-lime text-black font-bold flex items-center gap-2 shrink-0"
        >
          {copied ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />} {copied ? "Kopyalandı" : "Kopyala"}
        </button>
      </div>
      <p className="text-[11.5px] text-zinc-500 leading-relaxed">
        {`Kod, Lemon Squeezy → Store → Discounts'ta aynı adla tanımlı olmalı (yoksa ödeme kodsuz devam eder). Bağlantıya tıklayan ziyaretçinin kodu 30 gün, kaynağı 90 gün saklanır; kayıt olursa bu sayfada kanalına yazılır, satın alırsa "Satın almalar" tablosuna düşer.`}
      </p>
    </div>
  );
}
