import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) notFound(); // non-admins get the same 404 as a missing page

  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100">
      <header className="h-[52px] border-b border-ink-600 bg-ink-950/90 backdrop-blur-xl sticky top-0 z-50 flex items-center px-4 gap-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-lime to-violet flex items-center justify-center text-black font-bold text-sm">👹</div>
          <span className="font-bold tracking-tight text-[14px]">Prompt.Monster</span>
        </Link>
        <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded bg-violet/20 text-violet border border-violet/30 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" aria-hidden /> ADMIN
        </span>
        <div className="ml-auto flex items-center gap-3 text-[12px] text-zinc-500">
          <span className="hidden sm:inline truncate max-w-[220px]">{admin.user.email}</span>
          <Link href="/studio" className="h-8 px-3 rounded-lg bg-ink-800 border border-ink-600 flex items-center hover:border-ink-400">
            Studio
          </Link>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden md:block w-[220px] shrink-0 border-r border-ink-600 min-h-[calc(100vh-52px)] p-3">
          <AdminNav />
        </aside>
        <main className="flex-1 min-w-0 p-4 md:p-8 max-w-[1200px]">
          <div className="md:hidden mb-4 overflow-x-auto scrollbar-none">
            <AdminNav horizontal />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
