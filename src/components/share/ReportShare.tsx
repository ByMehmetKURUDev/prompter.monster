"use client";

import { useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n";

const COPY = {
  tr: { link: "Uygunsuz içerik mi? Bildir", placeholder: "Neden uygunsuz olduğunu kısaca yaz…", send: "Gönder", sent: "Teşekkürler, inceleyeceğiz.", cancel: "Vazgeç" },
  en: { link: "Inappropriate content? Report it", placeholder: "Briefly say why…", send: "Send", sent: "Thanks, we'll take a look.", cancel: "Cancel" },
} as const;

/** Lightweight report link on the public share page — feeds supabase/migrations/0010's feedback table + admin/shares. */
export function ReportShare({ slug, locale }: { slug: string; locale: Locale }) {
  const c = COPY[locale];
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");

  if (!supabaseConfigured()) return null;
  if (state === "sent") return <p className="text-[12px] text-zinc-500">{c.sent}</p>;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-[12px] text-zinc-600 hover:text-zinc-400 underline underline-offset-2">
        {c.link}
      </button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2 max-w-[520px]"
      onSubmit={async (e) => {
        e.preventDefault();
        if (text.trim().length < 3) return;
        setState("busy");
        try {
          const supabase = createClient();
          await supabase.rpc("submit_feedback", { p_message: text.trim(), p_slug: slug });
        } catch {
          /* best-effort */
        } finally {
          setState("sent");
        }
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={c.placeholder}
        maxLength={300}
        className="h-8 px-3 rounded-lg bg-ink-800 border border-ink-600 text-[12px] flex-1 min-w-[200px]"
      />
      <button type="submit" disabled={state === "busy"} className="h-8 px-3 rounded-lg bg-ink-700 border border-ink-600 text-[12px] disabled:opacity-50">
        {c.send}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-[12px] text-zinc-600 hover:text-zinc-400">
        {c.cancel}
      </button>
    </form>
  );
}
