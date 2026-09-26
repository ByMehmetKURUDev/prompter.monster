import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { lhref, type Locale } from "@/lib/i18n";
import { LanguageSwitch } from "./LanguageSwitch";
import { LegalLinks } from "./LegalLinks";

const NAV = {
  tr: { prompts: "Build prompt'lar", guide: "Rehber", pricing: "Fiyat", studio: "Studio'yu aç", footerPrompts: "Proje tipine göre build prompt'lar" },
  en: { prompts: "Build prompts", guide: "Guide", pricing: "Pricing", studio: "Open Studio", footerPrompts: "Build prompts by project type" },
} as const;

/** Header + footer used by the public marketing pages (/prompt, /docs, /legal …). */
export function PublicShell({ children, cta, locale = "tr", langSwitch = false }: { children: ReactNode; cta?: { href: string; label: string }; locale?: Locale; langSwitch?: boolean }) {
  const n = NAV[locale];
  const action = cta ?? { href: lhref("/studio?new=1", locale), label: n.studio };
  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100">
      <header className="h-[56px] border-b border-ink-600 bg-ink-950/80 backdrop-blur-xl sticky top-0 z-50 flex items-center px-4 lg:px-8 gap-4">
        <Link href={lhref("/", locale)} className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime to-violet flex items-center justify-center text-black font-bold">👹</div>
          <span className={langSwitch ? "font-bold tracking-tight text-[15px] max-[400px]:hidden" : "font-bold tracking-tight text-[15px]"}>Prompt.Monster</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-[13px]">
          <Link href={lhref("/prompt", locale)} className="hidden sm:block px-3 py-1.5 text-zinc-400 hover:text-white">
            {n.prompts}
          </Link>
          <Link href={lhref("/docs", locale)} className="hidden md:block px-3 py-1.5 text-zinc-400 hover:text-white">
            {n.guide}
          </Link>
          <Link href={lhref("/pricing", locale)} className="hidden sm:block px-3 py-1.5 text-zinc-400 hover:text-white">
            {n.pricing}
          </Link>
          {langSwitch && <LanguageSwitch className="ml-1" />}
          <Link href={action.href} className="h-9 px-3 sm:px-4 rounded-lg bg-lime text-black font-bold flex items-center gap-1.5 ml-2 whitespace-nowrap text-[12px] sm:text-[13px]">
            {action.label} <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </nav>
      </header>

      {children}

      <footer className="border-t border-ink-600 px-4 lg:px-8 py-6 text-[12px] text-zinc-600 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span>Prompt.Monster © {new Date().getFullYear()}</span>
        <span aria-hidden>•</span>
        <Link href={lhref("/prompt", locale)} className="hover:text-zinc-300">
          {n.footerPrompts}
        </Link>
        <span aria-hidden>•</span>
        <Link href={lhref("/docs", locale)} className="hover:text-zinc-300">
          {n.guide}
        </Link>
        <span aria-hidden>•</span>
        <LegalLinks locale={locale} />
        <Link href={lhref("/studio", locale)} className="ml-auto text-zinc-400 hover:text-white">
          Studio →
        </Link>
      </footer>
    </div>
  );
}
