"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cx } from "@/lib/cx";
import type { Locale } from "@/lib/i18n";
import { setupSnippets, KEY_PLACEHOLDER } from "@/lib/mcp-setup";

/** Tabbed setup instructions (MCP clients + REST + GPT Actions) with one-click copy. */
export function SetupSnippets({ locale, apiKey, only }: { locale: Locale; apiKey?: string | null; only?: string[] }) {
  const all = setupSnippets(apiKey || KEY_PLACEHOLDER);
  const items = only ? all.filter((s) => only.includes(s.id)) : all;
  const [active, setActive] = useState(items[0]?.id);
  const [copied, setCopied] = useState(false);
  const cur = items.find((s) => s.id === active) ?? items[0];
  if (!cur) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cur.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the code stays selectable */
    }
  };

  return (
    <div className="rounded-2xl bg-ink-900 border border-ink-600 overflow-hidden">
      <div role="tablist" className="flex gap-1 p-1.5 border-b border-ink-600 overflow-x-auto scrollbar-none">
        {items.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === cur.id}
            onClick={() => {
              setActive(s.id);
              setCopied(false);
            }}
            className={cx(
              "px-3 h-8 rounded-lg text-[12px] font-semibold whitespace-nowrap transition",
              s.id === cur.id ? "bg-ink-700 text-white" : "text-zinc-500 hover:text-zinc-200",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11.5px] text-zinc-500 min-w-0 truncate">{cur.where[locale]}</span>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 h-8 px-3 rounded-lg bg-ink-800 border border-ink-600 text-[12px] font-semibold flex items-center gap-1.5 hover:border-ink-400"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-lime" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
            {copied ? (locale === "en" ? "Copied" : "Kopyalandı") : locale === "en" ? "Copy" : "Kopyala"}
          </button>
        </div>
        <pre className="text-[12px] leading-relaxed text-zinc-200 bg-ink-950 border border-ink-600 rounded-xl p-3 overflow-x-auto whitespace-pre">
          <code>{cur.code}</code>
        </pre>
        {cur.note && <p className="text-[12px] text-zinc-400 leading-relaxed">{cur.note[locale]}</p>}
      </div>
    </div>
  );
}
