"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Save } from "lucide-react";
import type { SettingDef, SettingsMap } from "@/lib/settings";
import { cx } from "@/components/studio/ui";

type Def = SettingDef & { isNew: boolean; overridden: boolean; updated_at: string | null };

export function SettingsForm({ defs, values }: { defs: Def[]; values: SettingsMap }) {
  const router = useRouter();
  const [draft, setDraft] = useState<SettingsMap>(values);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const groups = useMemo(() => {
    const m = new Map<string, Def[]>();
    for (const d of defs) m.set(d.group, [...(m.get(d.group) ?? []), d]);
    return [...m.entries()];
  }, [defs]);

  const dirty = useMemo(() => defs.filter((d) => draft[d.key] !== values[d.key]).map((d) => d.key), [defs, draft, values]);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const patch: Record<string, unknown> = {};
      for (const k of dirty) patch[k] = draft[k];
      const r = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      const j = (await r.json().catch(() => ({}))) as { message?: string; saved?: string[] };
      if (!r.ok) throw new Error(j.message || `HTTP ${r.status}`);
      setMsg({ ok: true, text: `${j.saved?.length ?? dirty.length} ayar kaydedildi.` });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Kaydedilemedi" });
    } finally {
      setBusy(false);
    }
  }

  async function reset(key: string) {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: null }) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const def = defs.find((d) => d.key === key)!;
      setDraft((s) => ({ ...s, [key]: def.default }));
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Sıfırlanamadı" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {groups.map(([group, list]) => (
        <section key={group} className="rounded-2xl bg-ink-900 border border-ink-600">
          <div className="px-4 h-11 border-b border-ink-600 flex items-center text-[11px] font-semibold tracking-widest text-zinc-400 uppercase">{group}</div>
          <div className="divide-y divide-ink-600">
            {list.map((d) => (
              <div key={d.key} className="p-4 grid md:grid-cols-[1fr_320px] gap-3 items-start">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold">{d.label}</span>
                    <code className="text-[10px] text-zinc-600">{d.key}</code>
                    {d.isNew && <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-lime/15 text-lime border border-lime/30">YENİ</span>}
                    {d.overridden && <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-violet/15 text-violet border border-violet/30">DEĞİŞTİRİLDİ</span>}
                  </div>
                  <p className="mt-1 text-[12px] text-zinc-500 leading-relaxed">{d.description}</p>
                  <p className="mt-1 text-[10px] text-zinc-600">
                    Varsayılan: <code>{String(d.default) || "(boş)"}</code>
                    {d.updated_at && <> • son değişiklik {new Date(d.updated_at).toLocaleString("tr-TR")}</>}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Field def={d} value={draft[d.key]} onChange={(v) => setDraft((s) => ({ ...s, [d.key]: v }))} />
                  {d.overridden && (
                    <button type="button" disabled={busy} onClick={() => reset(d.key)} title="Varsayılana dön" className="w-9 h-9 shrink-0 rounded-lg bg-ink-800 border border-ink-600 grid place-items-center text-zinc-400 hover:text-white disabled:opacity-50">
                      <RotateCcw className="w-4 h-4" aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="sticky bottom-4 flex items-center gap-3 rounded-2xl bg-ink-800/95 backdrop-blur border border-ink-600 p-3">
        <button
          type="button"
          disabled={busy || dirty.length === 0}
          onClick={save}
          className={cx("h-10 px-4 rounded-xl font-bold text-[13px] flex items-center gap-2", dirty.length ? "bg-lime text-black" : "bg-ink-700 text-zinc-500", "disabled:opacity-60")}
        >
          <Save className="w-4 h-4" aria-hidden /> {dirty.length ? `${dirty.length} değişikliği kaydet` : "Değişiklik yok"}
        </button>
        {msg && <span className={cx("text-[12px]", msg.ok ? "text-lime" : "text-red-400")}>{msg.text}</span>}
      </div>
    </div>
  );
}

function Field({ def, value, onChange }: { def: Def; value: boolean | number | string; onChange: (v: boolean | number | string) => void }) {
  const base = "w-full h-9 px-3 rounded-lg bg-ink-950 border border-ink-600 text-[13px] focus:outline-none focus:border-violet";
  if (def.type === "boolean") {
    const on = Boolean(value);
    return (
      <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={cx("h-9 px-1 w-[72px] rounded-full border flex items-center transition", on ? "bg-lime/20 border-lime/40 justify-end" : "bg-ink-950 border-ink-600 justify-start")}>
        <span className={cx("w-7 h-7 rounded-full grid place-items-center text-[10px] font-bold", on ? "bg-lime text-black" : "bg-ink-600 text-zinc-400")}>{on ? "AÇIK" : "KAPALI"}</span>
      </button>
    );
  }
  if (def.type === "number") {
    return <input type="number" className={base} value={Number(value)} min={def.min} max={def.max} onChange={(e) => onChange(Number(e.target.value))} />;
  }
  if (def.type === "text") {
    return <textarea className={cx(base, "h-20 py-2 resize-y")} value={String(value)} onChange={(e) => onChange(e.target.value)} />;
  }
  return <input type="text" className={base} value={String(value)} onChange={(e) => onChange(e.target.value)} />;
}
