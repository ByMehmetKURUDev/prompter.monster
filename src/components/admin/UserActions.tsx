"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Crown, Lock, MoreHorizontal, ShieldCheck, StickyNote, Unlock } from "lucide-react";
import type { AdminUserRow } from "@/app/admin/users/page";
import { cx } from "@/lib/cx";

type Patch = Partial<{ plan: "free" | "pro"; role: "user" | "admin"; plan_locked: boolean; banned: boolean; note: string }>;

export function UserActions({ user, selfId }: { user: AdminUserRow; selfId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function apply(patch: Patch) {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      const j = (await r.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`);
      setOpen(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(false);
    }
  }

  const isSelf = user.id === selfId;

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-8 h-8 rounded-lg bg-ink-800 border border-ink-600 grid place-items-center hover:border-ink-400" aria-label="İşlemler">
        <MoreHorizontal className="w-4 h-4" aria-hidden />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-[240px] rounded-xl bg-ink-800 border border-ink-600 shadow-2xl p-1 text-[12.5px]">
          <Item busy={busy} onClick={() => apply({ plan: user.plan === "pro" ? "free" : "pro", plan_locked: user.plan !== "pro" })} icon={<Crown className="w-3.5 h-3.5" />}>
            {user.plan === "pro" ? "Free'ye düşür" : "Pro yap (kilitli)"}
          </Item>
          <Item busy={busy} onClick={() => apply({ plan_locked: !user.plan_locked })} icon={user.plan_locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}>
            {user.plan_locked ? "Plan kilidini aç (webhook yönetsin)" : "Planı kilitle"}
          </Item>
          <Item busy={busy || isSelf} onClick={() => apply({ role: user.role === "admin" ? "user" : "admin" })} icon={<ShieldCheck className="w-3.5 h-3.5" />}>
            {user.role === "admin" ? "Admin yetkisini al" : "Admin yap"}
          </Item>
          <Item
            busy={busy}
            onClick={() => {
              const note = window.prompt("Not (boş bırakırsan silinir):", user.note ?? "");
              if (note !== null) apply({ note });
            }}
            icon={<StickyNote className="w-3.5 h-3.5" />}
          >
            Not ekle / düzenle
          </Item>
          <Item busy={busy || isSelf} danger onClick={() => apply({ banned: !user.banned_at })} icon={<Ban className="w-3.5 h-3.5" />}>
            {user.banned_at ? "Yasağı kaldır" : "Yasakla (AI + üretim kapanır)"}
          </Item>
          {err && <div className="px-2 py-1 text-red-400">{err}</div>}
        </div>
      )}
    </div>
  );
}

function Item({ children, onClick, icon, busy, danger }: { children: React.ReactNode; onClick: () => void; icon: React.ReactNode; busy?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={cx("w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-left hover:bg-ink-700 disabled:opacity-50", danger ? "text-red-300" : "text-zinc-200")}
    >
      <span className="text-zinc-500">{icon}</span> {children}
    </button>
  );
}
