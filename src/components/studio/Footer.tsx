import { Globe } from "lucide-react";
import { LegalLinks } from "@/components/site/LegalLinks";
import { CHANGELOG } from "@/lib/changelog";

export function Footer() {
  return (
    <div className="border-t border-ink-600 bg-ink-950 px-4 lg:px-8 py-3 flex flex-wrap items-center gap-3 text-[11px] text-zinc-600">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-lime" /> 24 proje tipi • 15+ template • 8 ödeme • 12 uzman
      </span>
      <span className="hidden md:flex items-center gap-1.5">
        • <Globe className="w-3 h-3" aria-hidden /> Iyzico + PayTR TR desteği
      </span>
      <LegalLinks className="hidden sm:inline-flex" />
      <span className="ml-auto flex items-center gap-2">
        <span className="px-2 py-1 rounded-full bg-ink-800 border border-ink-600">v{CHANGELOG[0]?.version ?? "4.0"}</span>
        <span>Prompt.Monster © {new Date().getFullYear()}</span>
      </span>
    </div>
  );
}
