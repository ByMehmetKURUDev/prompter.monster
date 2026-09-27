"use client";

import { AlertTriangle, Check, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { cx } from "@/lib/cx";
import { lhref, type Locale } from "@/lib/i18n";

const COPY = {
  tr: {
    dataTitle: "Verilerini indir",
    dataText: "Profilin, projelerin, tüm versiyonlar, paylaşım bağlantıların, abonelik ve AI kullanım kayıtların tek bir JSON dosyasında. API anahtarlarının yalnız adı ve ön eki yer alır.",
    download: "Verilerimi indir (.json)",
    deleteTitle: "Hesabını sil",
    deleteText:
      "Hesabın, projelerin, versiyonların, paylaşım sayfaların ve API anahtarların kalıcı olarak silinir. Aktif Pro aboneliğin varsa yenilemesi iptal edilir; ödenmiş dönem için iade İade Politikası'na göre değerlendirilir. AI kullanım kayıtların kimliğinden ayrılarak yalnız anonim istatistik olarak kalır. Bu işlem geri alınamaz.",
    deleteBtn: "Hesabımı sil",
    confirmLabel: "Onaylamak için SİL yaz",
    confirmWord: "SİL",
    confirmBtn: "Kalıcı olarak sil",
    deleting: "Siliniyor…",
    cancel: "Vazgeç",
    adminNote: "Bu bir admin hesabı; buradan silinemez.",
    done: "Hesabın silindi. Prompt.Monster'ı denediğin için teşekkürler.",
    home: "Ana sayfaya dön",
    failed: "Hesap silinemedi, tekrar dene.",
  },
  en: {
    dataTitle: "Download your data",
    dataText: "Your profile, projects, every version, share links, subscription and AI usage records in one JSON file. API keys appear only by name and prefix.",
    download: "Download my data (.json)",
    deleteTitle: "Delete your account",
    deleteText:
      "Your account, projects, versions, share pages and API keys are deleted permanently. An active Pro subscription stops renewing; refunds for the paid period follow the Refund Policy. Your AI usage records are kept only as anonymous statistics, without your identity. This can't be undone.",
    deleteBtn: "Delete my account",
    confirmLabel: "Type DELETE to confirm",
    confirmWord: "DELETE",
    confirmBtn: "Delete permanently",
    deleting: "Deleting…",
    cancel: "Cancel",
    adminNote: "This is an admin account; it can't be deleted here.",
    done: "Your account has been deleted. Thanks for trying Prompt.Monster.",
    home: "Back to the home page",
    failed: "The account couldn't be deleted, please try again.",
  },
} as const;

/** Data export + permanent account deletion (typed confirmation). */
export function AccountDanger({ locale, isAdmin }: { locale: Locale; isAdmin: boolean }) {
  const c = COPY[locale];
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const ready = word.trim().toLocaleUpperCase(locale === "tr" ? "tr-TR" : "en-US") === c.confirmWord || (locale === "tr" && word.trim().toUpperCase() === "SIL");

  const remove = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-pm-locale": locale },
        body: JSON.stringify({ confirm: word.trim() }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!r.ok || !j.ok) {
        setErr(j.error ?? c.failed);
        return;
      }
      try {
        localStorage.removeItem("prompt-monster:studio:v1");
      } catch {
        /* storage unavailable */
      }
      setDone(true);
    } catch {
      setErr(c.failed);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <section className="rounded-2xl border border-lime/30 bg-lime/10 p-6 text-center">
        <Check className="w-6 h-6 text-lime mx-auto" aria-hidden />
        <p className="mt-3 text-[14px] font-semibold">{c.done}</p>
        <a href={lhref("/", locale)} className="mt-4 inline-flex h-10 px-4 rounded-lg bg-white text-black text-[13px] font-bold items-center">
          {c.home}
        </a>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-ink-800 border border-ink-600 p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold">{c.dataTitle}</h2>
          <p className="mt-1 text-[12.5px] text-zinc-400 leading-relaxed">{c.dataText}</p>
        </div>
        <a
          href="/api/account/export"
          download
          className="h-10 px-4 rounded-lg bg-white text-black text-[13px] font-bold flex items-center justify-center gap-2 shrink-0"
        >
          <Download className="w-4 h-4" aria-hidden /> {c.download}
        </a>
      </section>

      <section className="rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold text-red-200">{c.deleteTitle}</h2>
            <p className="mt-1 text-[12.5px] text-zinc-400 leading-relaxed">{c.deleteText}</p>
            {isAdmin ? (
              <p className="mt-3 text-[12px] text-amber-300">{c.adminNote}</p>
            ) : !open ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-4 h-10 px-4 rounded-lg border border-red-500/50 text-red-300 hover:bg-red-500/10 text-[13px] font-semibold flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" aria-hidden /> {c.deleteBtn}
              </button>
            ) : (
              <div className="mt-4 space-y-3 max-w-[420px]">
                <label className="block text-[12px] text-zinc-300">
                  {c.confirmLabel}
                  <input
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    className="mt-1.5 w-full h-10 px-3 rounded-lg bg-ink-950 border border-ink-600 focus:border-red-400 outline-none text-[14px] font-mono tracking-widest"
                    aria-label={c.confirmLabel}
                  />
                </label>
                {err && <p className="text-[12px] text-red-300">{err}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={remove}
                    disabled={!ready || busy}
                    className={cx(
                      "h-10 px-4 rounded-lg text-[13px] font-bold flex items-center gap-2",
                      ready && !busy ? "bg-red-500 text-white hover:bg-red-600" : "bg-ink-700 text-zinc-500 cursor-not-allowed",
                    )}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden /> {busy ? c.deleting : c.confirmBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setWord("");
                      setErr(null);
                    }}
                    className="h-10 px-4 rounded-lg bg-ink-800 border border-ink-600 text-[13px]"
                  >
                    {c.cancel}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
