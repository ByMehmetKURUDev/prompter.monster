"use client";

import { Check, Copy, Download, ExternalLink, GitFork, Link2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { copyText, downloadText } from "@/lib/client";
import { cx } from "@/components/studio/ui";
import { claudeCodeUrl, cursorPromptUrl } from "@/lib/handoff";
import { lhref, type Locale } from "@/lib/i18n";

const COPY = {
  tr: {
    prompt: "Promptu kopyala",
    copied: "Kopyalandı",
    download: (ext: string) => `İndir (.${ext})`,
    link: "Bağlantıyı kopyala",
    linkCopied: "Bağlantı kopyalandı",
    fork: "Studio'da çatalla",
    claudeCode: "Claude Code'da aç",
    cursor: "Cursor'da aç",
  },
  en: {
    prompt: "Copy prompt",
    copied: "Copied",
    download: (ext: string) => `Download (.${ext})`,
    link: "Copy link",
    linkCopied: "Link copied",
    fork: "Fork in Studio",
    claudeCode: "Open in Claude Code",
    cursor: "Open in Cursor",
  },
} as const;

/** Copy / download / fork / AI-tool handoff controls on the public prompt page. */
export function ShareActions({
  slug,
  name,
  output,
  format,
  locale = "tr",
}: {
  slug: string;
  name: string;
  output: string;
  format: string;
  locale?: Locale;
}) {
  const [copied, setCopied] = useState<"prompt" | "link" | null>(null);
  const c = COPY[locale];

  const flash = (k: "prompt" | "link") => {
    setCopied(k);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const ext = format === "Claude XML" ? "xml" : format === "Cursor Rules" ? "cursorrules" : "md";
  const file = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "prompt"}.${ext}`;
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster").replace(/\/$/, "");
  const ccUrl = claudeCodeUrl(`${site}/p/${slug}/raw`);
  const cursorUrl = cursorPromptUrl(output);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={async () => {
          if (await copyText(output)) flash("prompt");
        }}
        className={cx(
          "h-10 px-4 rounded-xl font-bold text-[13px] flex items-center gap-2 transition",
          copied === "prompt" ? "bg-lime text-black" : "bg-white text-black hover:bg-zinc-200",
        )}
      >
        {copied === "prompt" ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
        {copied === "prompt" ? c.copied : c.prompt}
      </button>
      <button
        type="button"
        onClick={() => downloadText(file, output)}
        className="h-10 px-4 rounded-xl bg-ink-800 border border-ink-600 text-[13px] text-zinc-200 hover:text-white flex items-center gap-2"
      >
        <Download className="w-4 h-4" aria-hidden /> {c.download(ext)}
      </button>
      <button
        type="button"
        onClick={async () => {
          if (await copyText(window.location.href)) flash("link");
        }}
        className="h-10 px-4 rounded-xl bg-ink-800 border border-ink-600 text-[13px] text-zinc-200 hover:text-white flex items-center gap-2"
      >
        {copied === "link" ? <Check className="w-4 h-4" aria-hidden /> : <Link2 className="w-4 h-4" aria-hidden />}
        {copied === "link" ? c.linkCopied : c.link}
      </button>
      <a
        href={ccUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="h-10 px-4 rounded-xl bg-ink-800 border border-ink-600 text-[13px] text-zinc-200 hover:text-white flex items-center gap-2"
      >
        <ExternalLink className="w-4 h-4" aria-hidden /> {c.claudeCode}
      </a>
      {cursorUrl && (
        <a
          href={cursorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-10 px-4 rounded-xl bg-ink-800 border border-ink-600 text-[13px] text-zinc-200 hover:text-white flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" aria-hidden /> {c.cursor}
        </a>
      )}
      <Link
        href={lhref(`/studio?fork=${encodeURIComponent(slug)}`, locale)}
        className="h-10 px-4 rounded-xl bg-gradient-to-r from-lime to-violet text-black font-bold text-[13px] flex items-center gap-2"
      >
        <GitFork className="w-4 h-4" aria-hidden /> {c.fork}
      </Link>
    </div>
  );
}
