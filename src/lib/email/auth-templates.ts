/**
 * Supabase Auth e-mails — confirm sign-up, magic link, password reset, e-mail change, invite, reauthentication — in
 * Turkish and English, in the same frame as the lifecycle e-mails (templates.ts).
 *
 * Supabase renders subject and body with Go's html/template (builtins only: printf, eq, and, or…).
 * goTemplate(kind) returns the subject and body to paste into Dashboard → Authentication → Emails (the copies in
 * supabase/email-templates/ are generated from here):
 *  - language: the sign-up language, user_metadata.lang (the sign-up form stores the page's language), else Turkish.
 *    Subject and body share this one-line rule (the dashboard caps the subject at 255 characters);
 *  - link: our server-side /auth/callback with token_hash (PKCE-safe). When the app passed its own callback as the
 *    redirect, its query is kept — someone who signs up from a team invite lands back on /join/<token>.
 * preview(kind, locale) renders one language with sample values for Admin → E-postalar.
 */
import { EMAIL_STYLE, emailShell, type EmailLocale } from "./templates";

export type AuthEmailKind = "confirmation" | "magic_link" | "recovery" | "email_change" | "invite" | "reauthentication";
export const AUTH_EMAIL_KINDS: AuthEmailKind[] = ["confirmation", "magic_link", "recovery", "email_change", "invite", "reauthentication"];

/** Where the app's callback links land when the request did not carry its own `next`. */
const DEFAULT_NEXT: Partial<Record<AuthEmailKind, Record<EmailLocale, string>>> = {
  confirmation: { tr: "/studio", en: "/en/studio" },
  magic_link: { tr: "/studio", en: "/en/studio" },
  recovery: { tr: "/account/password", en: "/en/account/password" },
};
/** verifyOtp type used by /auth/callback for token_hash links. */
const OTP_TYPE: Partial<Record<AuthEmailKind, string>> = { confirmation: "signup", magic_link: "magiclink", recovery: "recovery" };

/** The app's own callback (apex and www). When the e-mail's redirect is one of these, its query is kept. */
const CALLBACKS = ["https://prompter.monster/auth/callback?", "https://www.prompter.monster/auth/callback?"];
/** Supabase Dashboard rejects longer subjects ("expected string to have <=255 characters"). */
export const SUBJECT_MAX = 255;
/**
 * Go condition: the user signed up in English. printf "%v" keeps the comparison string-to-string, so empty metadata
 * or a non-string lang can't make the template fail.
 */
const GO_EN = `eq (printf "%v" .Data.lang) "en"`;

interface Copy {
  subject: string;
  preheader: string;
  title: string;
  intro: string;
  button?: string;
  note: string;
}

const COPY: Record<AuthEmailKind, Record<EmailLocale, Copy>> = {
  confirmation: {
    tr: {
      subject: "Prompter.Monster — e-posta adresini doğrula 👹",
      preheader: "Hesabını etkinleştirmek için tek tık yeter.",
      title: "Canavar seni bekliyor 👹",
      intro: "Prompter.Monster hesabını etkinleştirmek için e-posta adresini doğrula.",
      button: "E-postamı doğrula",
      note: "Bağlantı 1 saat geçerlidir ve yalnızca bir kez kullanılabilir. Bu kaydı sen yapmadıysan bu e-postayı yok sayabilirsin.",
    },
    en: {
      subject: "Prompter.Monster — confirm your email 👹",
      preheader: "One click and your account is ready.",
      title: "The monster is waiting for you 👹",
      intro: "Confirm your email address to activate your Prompter.Monster account.",
      button: "Confirm my email",
      note: "The link is valid for 1 hour and works once. If you didn't sign up, you can ignore this email.",
    },
  },
  magic_link: {
    tr: {
      subject: "Prompter.Monster giriş bağlantın 👹",
      preheader: "Şifresiz, tek tıkla giriş.",
      title: "Giriş bağlantın hazır 👹",
      intro: "Prompter.Monster'a tek tıkla giriş yapmak için aşağıdaki düğmeye bas.",
      button: "Giriş yap",
      note: "Bağlantı 1 saat geçerlidir ve yalnızca bir kez kullanılabilir. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.",
    },
    en: {
      subject: "Your Prompter.Monster sign-in link 👹",
      preheader: "Sign in with one click, no password needed.",
      title: "Your sign-in link is ready 👹",
      intro: "Press the button below to sign in to Prompter.Monster in one click.",
      button: "Sign in",
      note: "The link is valid for 1 hour and works once. If you didn't request it, you can ignore this email.",
    },
  },
  recovery: {
    tr: {
      subject: "Prompter.Monster şifre sıfırlama 🔑",
      preheader: "Yeni şifreni belirlemek için bağlantı.",
      title: "Yeni şifre belirle 🔑",
      intro: "Prompter.Monster hesabın için şifre sıfırlama isteği aldık. Yeni şifreni belirlemek için:",
      button: "Yeni şifre belirle",
      note: "Bağlantı 1 saat geçerlidir ve bir kez kullanılabilir. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; şifren değişmez.",
    },
    en: {
      subject: "Reset your Prompter.Monster password 🔑",
      preheader: "A link to choose a new password.",
      title: "Set a new password 🔑",
      intro: "We received a request to reset the password of your Prompter.Monster account. To choose a new one:",
      button: "Set a new password",
      note: "The link is valid for 1 hour and works once. If you didn't request this, ignore this email — your password stays the same.",
    },
  },
  email_change: {
    tr: {
      subject: "Prompter.Monster — yeni e-posta adresini doğrula",
      preheader: "E-posta değişikliğini onayla.",
      title: "Yeni e-posta adresini doğrula",
      intro: "Prompter.Monster hesabının e-posta adresini {{NEW_EMAIL}} olarak değiştirmek için onayla.",
      button: "Yeni adresi doğrula",
      note: "Bu değişikliği sen istemediysen bu e-postayı yok say ve şifreni değiştir.",
    },
    en: {
      subject: "Prompter.Monster — confirm your new email",
      preheader: "Confirm the change of your email address.",
      title: "Confirm your new email address",
      intro: "Confirm to change the email address of your Prompter.Monster account to {{NEW_EMAIL}}.",
      button: "Confirm new address",
      note: "If you didn't request this change, ignore this email and change your password.",
    },
  },
  invite: {
    tr: {
      subject: "Prompter.Monster'a davet edildin",
      preheader: "Daveti kabul edip hesabını oluştur.",
      title: "Prompter.Monster'a davet edildin 👹",
      intro: "Bir Prompter.Monster hesabı oluşturman için davet edildin. Kabul etmek için:",
      button: "Daveti kabul et",
      note: "Bu daveti beklemiyorsan bu e-postayı yok sayabilirsin.",
    },
    en: {
      subject: "You're invited to Prompter.Monster",
      preheader: "Accept the invite and create your account.",
      title: "You're invited to Prompter.Monster 👹",
      intro: "You've been invited to create a Prompter.Monster account. To accept:",
      button: "Accept the invite",
      note: "If you weren't expecting this invite, you can ignore this email.",
    },
  },
  reauthentication: {
    tr: {
      subject: "{{TOKEN}} — Prompter.Monster doğrulama kodun",
      preheader: "İşlemi onaylamak için kodun.",
      title: "Doğrulama kodun",
      intro: "Kimliğini doğrulamak için bu kodu kullan:",
      note: "Kod kısa süre geçerlidir. Bu isteği sen yapmadıysan şifreni değiştir.",
    },
    en: {
      subject: "{{TOKEN}} is your Prompter.Monster verification code",
      preheader: "Your code to confirm the action.",
      title: "Your verification code",
      intro: "Use this code to verify your identity:",
      note: "The code expires shortly. If you didn't request it, change your password.",
    },
  },
};

// Auth e-mails go out from noreply@ (Supabase SMTP), so replies would be lost: point to the contact address instead.
const CONTACT = `<a href="mailto:hello@prompter.monster" style="color:${EMAIL_STYLE.LINK};text-decoration:underline;">hello@prompter.monster</a>`;
const FOOTER: Record<EmailLocale, string> = {
  tr: `Bu e-postayı prompter.monster'daki hesabınla ilgili bir istek yapıldığı için aldın. Sorun mu var? ${CONTACT} adresine yaz.`,
  en: `You're receiving this because a request was made for your account on prompter.monster. Questions? Write to ${CONTACT}.`,
};

/** Values put into the HTML as-is: Go template actions for Supabase, or plain sample strings for previews. */
interface Slots {
  site: string;
  link: string;
  newEmail: string;
  token: string;
}

function body(kind: AuthEmailKind, locale: EmailLocale, v: Slots): { subject: string; html: string } {
  const c = COPY[kind][locale];
  const { FONT, INK, LIME, TEXT, MUTED } = EMAIL_STYLE;
  const fill = (s: string) => s.replace("{{NEW_EMAIL}}", `<strong>${v.newEmail}</strong>`).replace("{{TOKEN}}", v.token);
  const parts = [
    `<h1 style="margin:0 0 14px;font:700 22px/1.3 ${FONT};color:${TEXT};letter-spacing:-0.3px;">${c.title}</h1>`,
    `<p style="margin:0 0 14px;font:15px/1.6 ${FONT};color:${TEXT};">${fill(c.intro)}</p>`,
    c.button
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 22px;"><tr><td bgcolor="${LIME}" style="border-radius:10px;background:${LIME};">` +
        `<a href="${v.link}" style="display:inline-block;padding:13px 24px;font:700 15px/1.2 ${FONT};color:${INK};text-decoration:none;border-radius:10px;">${c.button} &rarr;</a></td></tr></table>`
      : `<p style="margin:18px 0 22px;font:700 30px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:6px;color:${INK};">${v.token}</p>`,
    `<p style="margin:0 0 14px;font:13px/1.6 ${FONT};color:${MUTED};">${c.note}</p>`,
  ];
  const html = emailShell({ locale, site: v.site, title: fill(c.subject), preheader: c.preheader, bodyHtml: parts.join(""), footerHtml: FOOTER[locale] });
  return { subject: fill(c.subject), html };
}

/** Go condition: $rt (the redirect URL as text) starts with p. printf "%.Ns" never fails, even on a missing value. */
const startsWith = (p: string) => `eq (printf "%.${p.length}s" $rt) "${p}"`;

/** Language + confirmation link (output nothing). */
function goHeader(kind: AuthEmailKind): string {
  const lang = `{{- $en := ${GO_EN} -}}\n`;
  const type = OTP_TYPE[kind];
  const next = DEFAULT_NEXT[kind];
  if (!type || !next) return lang;
  const own = CALLBACKS.map((cb) => `{{- if ${startsWith(cb)} -}}{{- $link = printf "%s&token_hash=%s&type=${type}" $rt .TokenHash -}}{{- end -}}`);
  return (
    lang +
    `{{- $next := "${next.tr}" -}}{{- if $en -}}{{- $next = "${next.en}" -}}{{- end -}}\n` +
    `{{- $rt := printf "%v" .RedirectTo -}}\n` +
    `{{- $link := printf "%s/auth/callback?token_hash=%s&type=${type}&next=%s" .SiteURL .TokenHash $next -}}${own.join("")}\n`
  );
}

/** The same language rule for the subject line (a separate template in Supabase). */
function goSubject(tr: string, en: string): string {
  return `{{if ${GO_EN}}}${en}{{else}}${tr}{{end}}`;
}

/** Subject + body for Supabase Dashboard → Authentication → Emails. */
export function goTemplate(kind: AuthEmailKind): { subject: string; content: string } {
  const slots: Slots = {
    site: "{{ .SiteURL }}",
    link: OTP_TYPE[kind] ? "{{ $link }}" : "{{ .ConfirmationURL }}",
    newEmail: "{{ .NewEmail }}",
    token: "{{ .Token }}",
  };
  const tr = body(kind, "tr", slots);
  const en = body(kind, "en", slots);
  const subject = goSubject(tr.subject, en.subject);
  if (subject.length > SUBJECT_MAX) throw new Error(`${kind}: subject template is ${subject.length} characters (max ${SUBJECT_MAX})`);
  return {
    subject,
    content: `${goHeader(kind)}{{- if $en -}}\n${en.html}\n{{- else -}}\n${tr.html}\n{{- end -}}\n`,
  };
}

/** One language with sample values, for previews. */
export function preview(kind: AuthEmailKind, locale: EmailLocale, site = "https://prompter.monster"): { subject: string; html: string } {
  const type = OTP_TYPE[kind];
  const next = DEFAULT_NEXT[kind]?.[locale] ?? "/";
  return body(kind, locale, {
    site,
    link: type ? `${site}/auth/callback?token_hash=pkce_0123456789abcdef&amp;type=${type}&amp;next=${next}` : `${site}/auth/v1/verify?token=0123456789abcdef`,
    newEmail: locale === "en" ? "new@example.com" : "yeni@ornek.com",
    token: "482913",
  });
}
