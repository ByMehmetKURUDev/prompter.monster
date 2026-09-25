"use client";

import { Check, Copy, Download, GitFork, Link2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { copyText, downloadText } from "@/lib/client";
import { cx } from "@/components/studio/ui";

/** Copy / download / fork controls on the public prompt page. */
export function ShareActions({ slug, name, output, format }: { slug: string; name: string; output: string; format: string }) {
  const [copied, setCopied] = useState<"prompt" | "link" | null>(null);

  const flash = (k: "prompt" | "link") => {
    setCopied(k);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const ext = format === "Claude XML" ? "xml" : format === "Cursor Rules" ? "cursorrules" : "md";
  const file = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "prompt"}.${ext}`;

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
        {copied === "prompt" ? "Kopyalandı" : "Promptu kopyala"}
      </button>
      <button
        type="button"
        onClick={() => downloadText(file, output)}
        className="h-10 px-4 rounded-xl bg-ink-800 border border-ink-600 text-[13px] text-zinc-200 hover:text-white flex items-center gap-2"
      >
        <Download className="w-4 h-4" aria-hidden /> İndir (.{ext})
      </button>
      <button
        type="button"
        onClick={async () => {
          if (await copyText(window.location.href)) flash("link");
        }}
        className="h-10 px-4 rounded-xl bg-ink-800 border border-ink-600 text-[13px] text-zinc-200 hover:text-white flex items-center gap-2"
      >
        {copied === "link" ? <Check className="w-4 h-4" aria-hidden /> : <Link2 className="w-4 h-4" aria-hidden />}
        {copied === "link" ? "Bağlantı kopyalandı" : "Bağlantıyı kopyala"}
      </button>
      <Link
        href={`/studio?fork=${encodeURIComponent(slug)}`}
        className="h-10 px-4 rounded-xl bg-gradient-to-r from-lime to-violet text-black font-bold text-[13px] flex items-center gap-2"
      >
        <GitFork className="w-4 h-4" aria-hidden /> Studio&apos;da çatalla
      </Link>
    </div>
  );
}
