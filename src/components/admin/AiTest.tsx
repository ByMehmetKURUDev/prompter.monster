"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Spinner } from "@/components/studio/ui";

export function AiTest({ model }: { model: string }) {
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ ok: boolean; text: string } | null>(null);
  async function run() {
    setBusy(true);
    setOut(null);
    try {
      const r = await fetch("/api/admin/ai-test", { method: "POST" });
      const j = (await r.json()) as { ok: boolean; model?: string; reply?: string; ms?: number; usage?: { input_tokens: number; output_tokens: number }; message?: string };
      if (!r.ok || !j.ok) throw new Error(j.message || `HTTP ${r.status}`);
      setOut({ ok: true, text: `${j.model} yanıt verdi (${j.ms} ms, ${j.usage?.input_tokens ?? "?"} giriş / ${j.usage?.output_tokens ?? "?"} çıkış token): "${j.reply}"` });
    } catch (e) {
      setOut({ ok: false, text: e instanceof Error ? e.message : "Hata" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="text-[13px]">
      <p className="text-zinc-400">
        Aktif model: <code className="text-zinc-200">{model}</code>. Test, modele tek cümlelik bir istek gönderir (yaklaşık 50 token; kota harcamaz).
      </p>
      <button type="button" disabled={busy} onClick={run} className="mt-3 h-9 px-4 rounded-lg bg-lime text-black font-bold flex items-center gap-2 disabled:opacity-60">
        {busy ? <Spinner className="w-4 h-4" /> : <Play className="w-4 h-4" aria-hidden />} Testi çalıştır
      </button>
      {out && <div className={`mt-3 rounded-lg border p-3 ${out.ok ? "border-lime/30 bg-lime/10 text-lime" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>{out.text}</div>}
    </div>
  );
}
