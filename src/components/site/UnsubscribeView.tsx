import Link from "next/link";
import { PublicShell } from "@/components/site/PublicShell";
import { lhref, type Locale } from "@/lib/i18n";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const COPY = {
  tr: {
    title: "E-posta tercihin",
    ask: "Prompter.Monster'ın karşılama ve başlangıç hatırlatması e-postalarını almayı bırakmak istiyor musun?",
    askNote: "Giriş, şifre sıfırlama ve ödeme e-postaları bu ayardan etkilenmez.",
    out: "Abonelikten çık",
    doneOutTitle: "Abonelikten çıktın",
    doneOut: "Artık karşılama ve başlangıç hatırlatması e-postası almayacaksın. Giriş, şifre sıfırlama ve ödeme e-postaları gelmeye devam eder.",
    undo: "Yanlışlıkla mı oldu? Geri al",
    doneInTitle: "Yeniden açıldı",
    doneIn: "Başlangıç e-postaları yeniden açık. İstediğin zaman buradan ya da Hesabım sayfasından kapatabilirsin.",
    invalidTitle: "Bağlantı geçersiz",
    invalid: "Bu bağlantı geçersiz ya da eksik kopyalanmış olabilir. E-posta tercihini Hesabım sayfasından da değiştirebilirsin.",
    unavailableTitle: "Şu an işlenemedi",
    unavailable: "Lütfen biraz sonra tekrar dene ya da tercihini Hesabım sayfasından değiştir.",
    account: "Hesabım",
    studio: "Studio'ya dön",
  },
  en: {
    title: "Your e-mail preference",
    ask: "Do you want to stop receiving Prompter.Monster's welcome and getting-started reminder e-mails?",
    askNote: "Sign-in, password reset and billing e-mails aren't affected by this setting.",
    out: "Unsubscribe",
    doneOutTitle: "You're unsubscribed",
    doneOut: "You won't get welcome or getting-started reminder e-mails anymore. Sign-in, password reset and billing e-mails still arrive.",
    undo: "Changed your mind? Resubscribe",
    doneInTitle: "Subscribed again",
    doneIn: "Getting-started e-mails are back on. You can turn them off here or on your account page any time.",
    invalidTitle: "This link isn't valid",
    invalid: "The link may be incomplete or mistyped. You can also change your e-mail preference on your account page.",
    unavailableTitle: "Couldn't process that right now",
    unavailable: "Please try again in a moment, or change your preference on your account page.",
    account: "My account",
    studio: "Back to the Studio",
  },
} as const;

type Params = { t?: string; done?: string; error?: string };

/** /unsubscribe and /en/unsubscribe — lifecycle e-mail opt-out (0023). The GET never changes anything; the button POSTs. */
export function UnsubscribeView({ locale, searchParams }: { locale: Locale; searchParams: Params }) {
  const c = COPY[locale];
  const token = typeof searchParams.t === "string" && UUID.test(searchParams.t) ? searchParams.t : null;
  const state = searchParams.error === "unavailable" ? "unavailable" : !token || searchParams.error ? "invalid" : searchParams.done === "out" ? "out" : searchParams.done === "in" ? "in" : "ask";

  const form = (action: "out" | "in", label: string, primary: boolean) => (
    <form method="post" action="/api/email/unsubscribe" className="mt-6">
      <input type="hidden" name="t" value={token ?? ""} />
      <input type="hidden" name="a" value={action} />
      <input type="hidden" name="l" value={locale} />
      <button
        type="submit"
        className={primary ? "h-11 px-5 rounded-xl bg-lime text-black font-bold text-[14px]" : "h-10 px-4 rounded-xl bg-ink-800 border border-ink-600 text-[13px] hover:border-ink-400"}
      >
        {label}
      </button>
    </form>
  );

  const title = { ask: c.title, out: c.doneOutTitle, in: c.doneInTitle, invalid: c.invalidTitle, unavailable: c.unavailableTitle }[state];
  const text = { ask: c.ask, out: c.doneOut, in: c.doneIn, invalid: c.invalid, unavailable: c.unavailable }[state];

  return (
    <PublicShell locale={locale} langSwitch={false}>
      <main id="main" className="max-w-[560px] mx-auto px-4 py-16 md:py-24">
        <div className="rounded-2xl bg-ink-800 border border-ink-600 p-6 md:p-8">
          <div className="text-4xl" aria-hidden>
            {state === "out" ? "📭" : state === "in" ? "📬" : state === "ask" ? "✉️" : "👹"}
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-[14px] text-zinc-300 leading-relaxed">{text}</p>
          {state === "ask" && <p className="mt-2 text-[13px] text-zinc-500 leading-relaxed">{c.askNote}</p>}
          {state === "ask" && form("out", c.out, true)}
          {state === "out" && form("in", c.undo, false)}
          <div className="mt-8 pt-5 border-t border-ink-600 flex flex-wrap gap-4 text-[13px]">
            <Link href={lhref("/account", locale)} className="text-zinc-300 underline decoration-lime/40 underline-offset-2 hover:decoration-lime">
              {c.account}
            </Link>
            <Link href={lhref("/studio", locale)} className="text-zinc-300 underline decoration-lime/40 underline-offset-2 hover:decoration-lime">
              {c.studio}
            </Link>
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
