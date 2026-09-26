import Link from "next/link";

/** Global 404 — bilingual because it serves both the Turkish and the /en routes. */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100 grid place-items-center px-4">
      <div className="text-center max-w-[520px]">
        <div className="text-6xl" aria-hidden>
          👹
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Canavar bunu bulamadı</h1>
        <p className="mt-2 text-[14px] text-zinc-400 leading-relaxed">Aradığın sayfa yok ya da paylaşım bağlantısı kaldırılmış olabilir.</p>
        <p lang="en" className="mt-4 text-[13px] text-zinc-500 leading-relaxed">
          The monster couldn&apos;t find this page — it doesn&apos;t exist or the shared link was removed.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="h-10 px-4 rounded-xl bg-ink-800 border border-ink-600 text-[13px] flex items-center">
            Ana sayfa
          </Link>
          <Link href="/studio" className="h-10 px-4 rounded-xl bg-lime text-black font-bold text-[13px] flex items-center">
            Studio&apos;yu aç
          </Link>
          <Link href="/en" className="h-10 px-4 rounded-xl bg-ink-800 border border-ink-600 text-[13px] flex items-center" hrefLang="en">
            English home
          </Link>
        </div>
      </div>
    </div>
  );
}
