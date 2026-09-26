"use client";

import { Check, Copy, KeyRound, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { SetupSnippets } from "@/components/site/SetupSnippets";
import { cx } from "@/lib/cx";
import type { Locale } from "@/lib/i18n";

export interface KeyItem {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  calls: number;
  revoked_at: string | null;
}

const COPY = {
  tr: {
    newKey: "Yeni anahtar",
    namePh: "Anahtar adı (ör. MacBook – Claude Code)",
    create: "Anahtar oluştur",
    creating: "Oluşturuluyor…",
    onceTitle: "Anahtarın hazır — şimdi kopyala",
    onceText: "Bu anahtar yalnız bir kez gösterilir; biz yalnız özetini saklıyoruz. Kaybedersen iptal edip yenisini oluştur.",
    copy: "Kopyala",
    copied: "Kopyalandı",
    yourKeys: "Anahtarların",
    none: "Henüz anahtarın yok. Anahtarsız da kullanabilirsin (Free sınırlarıyla); AI iyileştirme ve dosya export'u için anahtar gerekir.",
    active: "Aktif",
    revoked: "İptal edildi",
    created: "Oluşturma",
    lastUsed: "Son kullanım",
    never: "hiç",
    requests: "istek",
    revoke: "İptal et",
    confirm: "Emin misin? Bu anahtarı kullanan araçlar çalışmayı bırakır.",
    yes: "Evet, iptal et",
    cancel: "Vazgeç",
    setup: "Kurulum",
    setupText: "Aşağıdaki ayarlar yeni oluşturduğun anahtarla doldurulur. Anahtarı kimseyle paylaşma, depoya commit etme.",
    limit: (n: number) => `En fazla ${n} aktif anahtar.`,
    failed: "İşlem başarısız.",
  },
  en: {
    newKey: "New key",
    namePh: "Key name (e.g. MacBook – Claude Code)",
    create: "Create key",
    creating: "Creating…",
    onceTitle: "Your key is ready — copy it now",
    onceText: "It's shown only once; we store only a hash. If you lose it, revoke it and create a new one.",
    copy: "Copy",
    copied: "Copied",
    yourKeys: "Your keys",
    none: "No keys yet. You can use the API and MCP without one (Free limits); AI refine and file exports need a key.",
    active: "Active",
    revoked: "Revoked",
    created: "Created",
    lastUsed: "Last used",
    never: "never",
    requests: "requests",
    revoke: "Revoke",
    confirm: "Are you sure? Tools using this key will stop working.",
    yes: "Yes, revoke",
    cancel: "Cancel",
    setup: "Setup",
    setupText: "The snippets below are filled with the key you just created. Never share the key or commit it to a repository.",
    limit: (n: number) => `Up to ${n} active keys.`,
    failed: "Something went wrong.",
  },
} as const;

function fmt(d: string | null, locale: Locale, never: string) {
  if (!d) return never;
  return new Date(d).toLocaleString(locale === "en" ? "en-GB" : "tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

export function ApiKeysPanel({ locale, initial, max }: { locale: Locale; initial: KeyItem[]; max: number }) {
  const c = COPY[locale];
  const [keys, setKeys] = useState<KeyItem[]>(initial);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const activeCount = keys.filter((k) => !k.revoked_at).length;
  const headers = { "Content-Type": "application/json", "x-pm-locale": locale };

  const create = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/keys", { method: "POST", headers, body: JSON.stringify({ name: name.trim() || undefined }) });
      const j = (await r.json().catch(() => ({}))) as { key?: string; item?: KeyItem; error?: string };
      if (!r.ok || !j.key || !j.item) throw new Error(j.error || c.failed);
      setKeys((k) => [j.item!, ...k]);
      setFresh(j.key);
      setCopied(false);
      setName("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    setErr(null);
    try {
      const r = await fetch(`/api/keys/${id}`, { method: "DELETE", headers });
      const j = (await r.json().catch(() => ({}))) as { item?: KeyItem; error?: string };
      if (!r.ok || !j.item) throw new Error(j.error || c.failed);
      setKeys((k) => k.map((x) => (x.id === id ? j.item! : x)));
      setConfirmId(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const copyKey = async () => {
    if (!fresh) return;
    try {
      await navigator.clipboard.writeText(fresh);
      setCopied(true);
    } catch {
      /* select manually */
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-ink-800 border border-ink-600 p-5">
        <h2 className="text-[14px] font-bold flex items-center gap-2">
          <Plus className="w-4 h-4 text-lime" aria-hidden /> {c.newKey}
        </h2>
        <form
          className="mt-3 flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) void create();
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder={c.namePh}
            aria-label={c.namePh}
            className="flex-1 min-w-0 h-11 px-4 rounded-xl bg-ink-950 border border-ink-600 focus:border-ink-400 focus:outline-none text-[14px] placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={busy || activeCount >= max}
            className="h-11 px-5 rounded-xl bg-lime text-black text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" aria-hidden /> {busy ? c.creating : c.create}
          </button>
        </form>
        <p className="mt-2 text-[11.5px] text-zinc-500">{c.limit(max)}</p>
        {err && <p className="mt-2 text-[12.5px] text-red-300">{err}</p>}

        {fresh && (
          <div className="mt-4 rounded-xl border border-lime/40 bg-lime/10 p-4">
            <p className="text-[13px] font-bold text-lime flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" aria-hidden /> {c.onceTitle}
            </p>
            <p className="mt-1 text-[12px] text-zinc-300">{c.onceText}</p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <code className="flex-1 min-w-0 break-all rounded-lg bg-ink-950 border border-ink-600 px-3 py-2.5 text-[12.5px] text-zinc-100 select-all">{fresh}</code>
              <button type="button" onClick={copyKey} className="h-10 px-4 rounded-lg bg-white text-black text-[12.5px] font-bold flex items-center justify-center gap-1.5 shrink-0">
                {copied ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />} {copied ? c.copied : c.copy}
              </button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-[14px] font-bold mb-3">{c.yourKeys}</h2>
        {keys.length === 0 ? (
          <p className="text-[13px] text-zinc-500 rounded-2xl border border-dashed border-ink-600 p-5">{c.none}</p>
        ) : (
          <ul className="space-y-2">
            {keys.map((k) => (
              <li key={k.id} className={cx("rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3", k.revoked_at ? "border-ink-600 bg-ink-900 opacity-60" : "border-ink-600 bg-ink-800")}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[13.5px] truncate">{k.name}</span>
                    <code className="text-[11.5px] text-zinc-400 bg-ink-950 border border-ink-600 rounded px-1.5 py-0.5">{k.prefix}…</code>
                    <span className={cx("text-[10.5px] font-bold px-1.5 py-0.5 rounded", k.revoked_at ? "bg-ink-600 text-zinc-400" : "bg-lime/15 text-lime")}>
                      {k.revoked_at ? c.revoked : c.active}
                    </span>
                  </div>
                  <p className="mt-1 text-[11.5px] text-zinc-500">
                    {c.created}: {fmt(k.created_at, locale, c.never)} · {c.lastUsed}: {fmt(k.last_used_at, locale, c.never)} · {Number(k.calls).toLocaleString(locale === "en" ? "en-US" : "tr-TR")} {c.requests}
                  </p>
                </div>
                {!k.revoked_at &&
                  (confirmId === k.id ? (
                    <div className="flex flex-col sm:items-end gap-2">
                      <span className="text-[11.5px] text-zinc-400 max-w-[260px]">{c.confirm}</span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setConfirmId(null)} className="h-8 px-3 rounded-lg bg-ink-900 border border-ink-600 text-[12px]">
                          {c.cancel}
                        </button>
                        <button type="button" onClick={() => void revoke(k.id)} className="h-8 px-3 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-[12px] font-semibold">
                          {c.yes}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(k.id)}
                      className="self-start sm:self-auto h-8 px-3 rounded-lg bg-ink-900 border border-ink-600 text-[12px] text-zinc-300 flex items-center gap-1.5 hover:border-red-500/40 hover:text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden /> {c.revoke}
                    </button>
                  ))}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className={cx("text-[14px] font-bold", fresh ? "mb-1" : "mb-3")}>{c.setup}</h2>
        {fresh && <p className="text-[12px] text-zinc-400 mb-3">{c.setupText}</p>}
        <SetupSnippets locale={locale} apiKey={fresh} />
      </section>
    </div>
  );
}
