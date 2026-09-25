"use client";

import { Bell, Crown, Search } from "lucide-react";
import Link from "next/link";
import { cx } from "./ui";

const TABS = ["Studio", "Templates", "Chain Builder", "Analytics", "Docs"] as const;

export function Nav({
  active,
  onTab,
}: {
  active: string;
  onTab: (tab: string) => void;
}) {
  return (
    <nav className="h-[56px] border-b border-ink-600 bg-ink-950/80 backdrop-blur-xl sticky top-0 z-50 flex items-center px-4 lg:px-5 gap-4">
      <Link href="/" className="flex items-center gap-3" aria-label="Prompt.Monster ana sayfa">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime to-violet flex items-center justify-center text-black font-bold">👹</div>
        <span className="font-bold tracking-tight text-[15px]">Prompt.Monster</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-lime text-black font-bold tracking-widest">ULTIMATE</span>
      </Link>

      <div className="hidden md:flex items-center gap-1 ml-6">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTab(t)}
            className={cx(
              "px-3 py-1.5 rounded-md text-[13px] font-medium transition border",
              active === t ? "bg-ink-800 text-white border-ink-600" : "text-zinc-500 hover:text-zinc-200 border-transparent",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-2 px-3 h-8 rounded-full bg-ink-800 border border-ink-600 text-[12px] text-zinc-400">
          <Search className="w-3.5 h-3.5" aria-hidden />
          <span>Search</span>
          <span className="ml-2 px-1 py-0.5 rounded bg-ink-600 text-[10px]">⌘K</span>
        </div>
        <button type="button" className="w-8 h-8 rounded-full bg-ink-800 border border-ink-600 grid place-items-center" aria-label="Bildirimler">
          <Bell className="w-4 h-4 text-zinc-400" />
        </button>
        <span className="hidden sm:flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-gradient-to-r from-lime/20 to-violet/20 border border-lime/30 text-[11px] font-semibold text-lime">
          <Crown className="w-3 h-3" aria-hidden /> FREE
        </span>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 border border-ink-600" aria-hidden />
      </div>
    </nav>
  );
}
