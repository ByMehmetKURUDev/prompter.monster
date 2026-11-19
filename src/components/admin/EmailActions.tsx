"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Result = { kind: string; claimed: number; sent: number; failed: number; errors: string[] };

/** Admin → E-postalar: send a template to myself, or run the hourly job now. */
export function EmailActions({ enabled, adminEmail }: { enabled: boolean; adminEmail: string | null }) {
  const router = useRouter();
  const [kind, setKind] = useState<"welcome" | "nudge">("welcome");
  const [locale, setLocale] = useState<"tr" | "en">("tr");
  const [busy, setBusy] = useState<null | "test" | "run">(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const call = async (what: "test" | "run") => {
    setBusy(what);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(what === "test" ? { action: "test", kind, locale } : { action: "run" }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; to?: string; message?: string; error?: string; results?: Result[] };
      if (!r.ok || j.ok === false) {
        setMsg({ ok: false, text: j.message || j.error || `HTTP ${r.status}` });
        return;
      }
      if (what === "test") setMsg({ ok: true, text: `Gönderildi: ${j.to}. Gelen kutunu (ve spam klasörünü) kontrol et.` });
      else {
        const parts = (j.results ?? []).map((x) => `${x.kind === "welcome" ? "karşılama" : "hatırlatma"}: ${x.sent} gönderildi${x.failed ? `, ${x.failed} başarısız` : ""}`);
        const errors = (j.results ?? []).flatMap((x) => x.errors).slice(0, 3);
        setMsg({ ok: errors.length === 0, text: `${parts.join(" · ") || "Sırada kimse yok."}${errors.length ? ` — ${errors.join(" | ")}` : ""}` });
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, text: "İstek başarısız." });
    } finally {
      setBusy(null);
    }
  };

  const select = "h-9 px-2 rounded-lg bg-ink-900 border border-ink-600 text-[13px]";
  return (
    <div className="space-y-4 text-[13px]">
      <div>
        <div className="font-semibold">Kendime test gönder</div>
        <p className="mt-0.5 text-[12px] text-zinc-500">
          Seçilen şablonu {adminEmail ? <span className="text-zinc-300">{adminEmail}</span> : "kendi adresine"} gönderir (konu “[Test]” ile başlar, gönderim kaydına yazılmaz).
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <select aria-label="Şablon" value={kind} onChange={(e) => setKind(e.target.value === "nudge" ? "nudge" : "welcome")} className={select}>
            <option value="welcome">Karşılama</option>
            <option value="nudge">Başlangıç hatırlatması</option>
          </select>
          <select aria-label="Dil" value={locale} onChange={(e) => setLocale(e.target.value === "en" ? "en" : "tr")} className={select}>
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
          <button
            type="button"
            disabled={!enabled || busy !== null}
            onClick={() => call("test")}
            className="h-9 px-3 rounded-lg bg-lime text-black font-bold disabled:opacity-40"
          >
            {busy === "test" ? "Gönderiliyor…" : "Test gönder"}
          </button>
        </div>
      </div>
      <div>
        <div className="font-semibold">Şimdi çalıştır</div>
        <p className="mt-0.5 text-[12px] text-zinc-500">Saatlik işin aynısı: sırada olanlara gönderir (tür başına en fazla 10). Gönderilmiş olan tekrar gitmez.</p>
        <button
          type="button"
          disabled={!enabled || busy !== null}
          onClick={() => call("run")}
          className="mt-2 h-9 px-3 rounded-lg bg-ink-800 border border-ink-600 hover:border-ink-400 disabled:opacity-40"
        >
          {busy === "run" ? "Çalışıyor…" : "Şimdi çalıştır"}
        </button>
      </div>
      {!enabled && <p className="text-[12px] text-amber-300">RESEND_API_KEY eklenene kadar düğmeler kapalı.</p>}
      {msg && (
        <p role="status" className={msg.ok ? "text-lime" : "text-red-300"}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
