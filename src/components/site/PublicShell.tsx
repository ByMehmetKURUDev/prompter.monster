import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** Header + footer used by the public marketing pages (/prompt, /prompt/[slug]). */
export function PublicShell({ children, cta = { href: "/studio?new=1", label: "Studio'yu aç" } }: { children: ReactNode; cta?: { href: string; label: string } }) {
  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100">
      <header className="h-[56px] border-b border-ink-600 bg-ink-950/80 backdrop-blur-xl sticky top-0 z-50 flex items-center px-4 lg:px-8 gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime to-violet flex items-center justify-center text-black font-bold">👹</div>
          <span className="font-bold tracking-tight text-[15px]">Prompt.Monster</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-[13px]">
          <Link href="/prompt" className="hidden sm:block px-3 py-1.5 text-zinc-400 hover:text-white">
            Build prompt&apos;lar
          </Link>
          <Link href="/pricing" className="hidden sm:block px-3 py-1.5 text-zinc-400 hover:text-white">
            Fiyat
          </Link>
          <Link href={cta.href} className="h-9 px-3 sm:px-4 rounded-lg bg-lime text-black font-bold flex items-center gap-1.5 ml-2 whitespace-nowrap text-[12px] sm:text-[13px]">
            {cta.label} <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </nav>
      </header>

      {children}

      <footer className="border-t border-ink-600 px-4 lg:px-8 py-6 text-[12px] text-zinc-600 flex flex-wrap items-center gap-3">
        <span>Prompt.Monster © {new Date().getFullYear()}</span>
        <span>•</span>
        <Link href="/prompt" className="hover:text-zinc-300">
          Proje tipine göre build prompt&apos;lar
        </Link>
        <span>•</span>
        <a href="https://github.com/ByMehmetKURUDev/prompter.monster" className="hover:text-zinc-300" target="_blank" rel="noopener noreferrer">
          Açık kaynak
        </a>
        <Link href="/studio" className="ml-auto text-zinc-400 hover:text-white">
          Studio →
        </Link>
      </footer>
    </div>
  );
}
