import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PasswordForm } from "@/components/auth/PasswordForm";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Yeni şifre", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PasswordPage() {
  if (!supabaseConfigured()) redirect("/studio");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/password");

  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100 flex flex-col">
      <header className="h-[56px] border-b border-ink-600 flex items-center px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime to-violet flex items-center justify-center text-black font-bold">👹</div>
          <span className="font-bold tracking-tight text-[15px]">Prompt.Monster</span>
        </Link>
      </header>
      <main className="flex-1 grid place-items-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime to-violet grid place-items-center text-black text-xl">🔑</div>
            <div>
              <h1 className="text-[18px] font-bold">Yeni şifre belirle</h1>
              <p className="text-[12px] text-zinc-500 truncate max-w-[300px]">{user.email}</p>
            </div>
          </div>
          <PasswordForm />
          <p className="mt-6 text-[11px] text-zinc-600">
            <Link href="/studio" className="text-zinc-400 underline">
              Studio&apos;ya dön
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
