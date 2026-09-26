"use client";

import { Bell, Crown, FolderOpen, KeyRound, LogIn, LogOut, Save, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/site/LocaleProvider";
import type { MeResponse } from "@/lib/db";
import { lhref } from "@/lib/i18n";
import { Spinner, cx } from "./ui";
import { useT } from "./useT";

const TABS = ["Studio", "Templates", "Chain Builder", "Analytics", "Docs"] as const;

export function Nav({
  active,
  onTab,
  me,
  onSave,
  saving,
  dirty,
}: {
  active: string;
  onTab: (tab: string) => void;
  me: MeResponse | null;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
}) {
  const [menu, setMenu] = useState(false);
  const locale = useLocale();
  const t = useT().nav;
  const user = me?.user ?? null;
  const initial = (user?.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <nav className="h-[56px] border-b border-ink-600 bg-ink-950/80 backdrop-blur-xl sticky top-0 z-50 flex items-center px-4 lg:px-5 gap-3 lg:gap-4">
      <Link href={lhref("/", locale)} className="flex items-center gap-3 shrink-0" aria-label={t.homeAria}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime to-violet flex items-center justify-center text-black font-bold">👹</div>
        <span className="font-bold tracking-tight text-[15px]">Prompt.Monster</span>
        <span className="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded bg-lime text-black font-bold tracking-widest">ULTIMATE</span>
      </Link>

      {/* Tabs shrink and scroll inside the nav instead of widening the page on tablet widths. */}
      <div className="hidden md:flex items-center gap-1 ml-2 lg:ml-6 min-w-0 shrink overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTab(t)}
            className={cx(
              "px-3 py-1.5 rounded-md text-[13px] font-medium transition border whitespace-nowrap",
              active === t ? "bg-ink-800 text-white border-ink-600" : "text-zinc-500 hover:text-zinc-200 border-transparent",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2 shrink-0">
        <div className="hidden xl:flex items-center gap-2 px-3 h-8 rounded-full bg-ink-800 border border-ink-600 text-[12px] text-zinc-400">
          <Search className="w-3.5 h-3.5" aria-hidden />
          <span>Search</span>
          <span className="ml-2 px-1 py-0.5 rounded bg-ink-600 text-[10px]">⌘K</span>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          title={user ? t.saveTitle : t.saveTitleSignedOut}
          className={cx(
            "h-8 px-3 rounded-full border text-[12px] font-semibold flex items-center gap-1.5 transition disabled:opacity-60",
            dirty && user ? "bg-lime text-black border-lime" : "bg-ink-800 border-ink-600 text-zinc-300 hover:text-white",
          )}
        >
          {saving ? <Spinner className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" aria-hidden />}
          {t.save}
        </button>

        <button type="button" className="w-8 h-8 rounded-full bg-ink-800 border border-ink-600 grid place-items-center" aria-label={t.notifications}>
          <Bell className="w-4 h-4 text-zinc-400" />
        </button>

        <span className="hidden sm:flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-gradient-to-r from-lime/20 to-violet/20 border border-lime/30 text-[11px] font-semibold text-lime">
          <Crown className="w-3 h-3" aria-hidden /> {me?.plan === "pro" ? "PRO" : "FREE"}
        </span>

        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              aria-haspopup="menu"
              aria-expanded={menu}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 border border-ink-600 text-[12px] font-bold text-white grid place-items-center"
            >
              {initial}
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl bg-ink-800 border border-ink-600 shadow-xl p-1.5 z-50">
                <div className="px-3 py-2 text-[11px] text-zinc-500 truncate">{user.email}</div>
                <Link href={lhref("/library", locale)} role="menuitem" className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] hover:bg-ink-600">
                  <FolderOpen className="w-4 h-4" aria-hidden /> {t.myProjects}
                </Link>
                <Link href={lhref("/pricing", locale)} role="menuitem" className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] hover:bg-ink-600">
                  <Crown className="w-4 h-4" aria-hidden /> {me?.plan === "pro" ? t.myPlanPro : t.goPro}
                </Link>
                <Link href={lhref("/account/password", locale)} role="menuitem" className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] hover:bg-ink-600">
                  <KeyRound className="w-4 h-4" aria-hidden /> {t.changePassword}
                </Link>
                <form action="/auth/signout" method="post">
                  <button type="submit" role="menuitem" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-zinc-300 hover:bg-ink-600">
                    <LogOut className="w-4 h-4" aria-hidden /> {t.signOut}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <Link
            href={lhref(`/login?next=${lhref("/studio", locale)}`, locale)}
            className="h-8 px-3 rounded-full bg-white text-black text-[12px] font-bold flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" aria-hidden /> {t.signIn}
          </Link>
        )}
      </div>
    </nav>
  );
}
