"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Clock, MoreHorizontal, StickyNote, Users } from "lucide-react";
import { cx } from "@/lib/cx";

type Patch = Partial<{ status: "pending" | "active" | "canceled"; seats: number; note: string }>;

export interface AdminTeamActionRow {
  id: string;
  name: string;
  status: "pending" | "active" | "canceled";
  seats: number;
  members: number;
  note: string | null;
}

export function TeamAdminActions({ team }: { team: AdminTeamActionRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function apply(patch: Patch, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/teams/${team.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
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

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-8 h-8 rounded-lg bg-ink-800 border border-ink-600 grid place-items-center hover:border-ink-400" aria-label="İşlemler">
        <MoreHorizontal className="w-4 h-4" aria-hidden />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-[260px] rounded-xl bg-ink-800 border border-ink-600 shadow-2xl p-1 text-[12.5px]">
          {team.status !== "active" && (
            <Item busy={busy} onClick={() => apply({ status: "active" }, `"${team.name}" aktifleştirilsin mi? ${team.members} üyenin planı Pro olur.`)} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
              Aktifleştir (üyeler Pro olur)
            </Item>
          )}
          {team.status !== "pending" && (
            <Item busy={busy} onClick={() => apply({ status: "pending" })} icon={<Clock className="w-3.5 h-3.5" />}>
              Beklemeye al (Pro kapanır)
            </Item>
          )}
          <Item
            busy={busy}
            onClick={() => {
              const v = window.prompt(`Koltuk sayısı (şu an ${team.seats}, üye ${team.members}):`, String(team.seats));
              if (v === null) return;
              const n = Math.round(Number(v));
              if (!Number.isFinite(n) || n < 1 || n > 1000) return setErr("Koltuk sayısı 1–1000 arasında olmalı.");
              apply({ seats: n });
            }}
            icon={<Users className="w-3.5 h-3.5" />}
          >
            Koltuk sayısını değiştir
          </Item>
          <Item
            busy={busy}
            onClick={() => {
              const note = window.prompt("Not (fatura no, iletişim kişisi…; boş bırakırsan silinir):", team.note ?? "");
              if (note !== null) apply({ note });
            }}
            icon={<StickyNote className="w-3.5 h-3.5" />}
          >
            Not ekle / düzenle
          </Item>
          {team.status !== "canceled" && (
            <Item busy={busy} danger onClick={() => apply({ status: "canceled" }, `"${team.name}" iptal edilsin mi? Üyelerin takım üzerinden gelen Pro'su kapanır, yeni davet kabul edilmez.`)} icon={<Ban className="w-3.5 h-3.5" />}>
              İptal et
            </Item>
          )}
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
