import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100 grid place-items-center px-4">
      <div className="text-center max-w-[480px]">
        <div className="text-6xl" aria-hidden>
          👹
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Canavar bunu bulamadı</h1>
        <p className="mt-2 text-[14px] text-zinc-400 leading-relaxed">Aradığın sayfa yok ya da paylaşım bağlantısı kaldırılmış olabilir.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="h-10 px-4 rounded-xl bg-ink-800 border border-ink-600 text-[13px] flex items-center">
            Ana sayfa
          </Link>
          <Link href="/studio" className="h-10 px-4 rounded-xl bg-lime text-black font-bold text-[13px] flex items-center">
            Studio&apos;yu aç
          </Link>
        </div>
      </div>
    </div>
  );
}
