"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { lhref, type Locale } from "@/lib/i18n";

const COPY = {
  tr: { join: "Takıma katıl" },
  en: { join: "Join the team" },
} as const;

/** Accepts a team invite (POST /api/team {action:"join"}) and goes to the account page's team panel. */
export function JoinTeamButton({ locale, token }: { locale: Locale; token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function join() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-pm-locale": locale },
        body: JSON.stringify({ action: "join", token }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      router.push(`${lhref("/account", locale)}#team`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={join}
        disabled={busy}
        className="h-11 px-6 rounded-xl bg-lime text-black text-[14px] font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <UserPlus className="w-4 h-4" aria-hidden />} {COPY[locale].join}
      </button>
      {err && (
        <p className="mt-3 text-[13px] text-red-400" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}
