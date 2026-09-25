import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Giriş", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; msg?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/studio";
  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100 flex flex-col">
      <header className="h-[56px] border-b border-ink-600 flex items-center px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime to-violet flex items-center justify-center text-black font-bold">👹</div>
          <span className="font-bold tracking-tight text-[15px]">Prompt.Monster</span>
        </Link>
      </header>
      <main className="flex-1 grid place-items-center px-4 py-12">
        <LoginForm next={next} initialError={sp.error} initialMessage={sp.msg} />
      </main>
    </div>
  );
}
