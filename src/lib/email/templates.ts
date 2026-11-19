/**
 * Lifecycle e-mails (migration 0023): a welcome note and one getting-started reminder, in Turkish and English.
 *
 * Plain string templates — no React, Next or "@/" imports — so the Cloudflare cron entry (custom-worker.ts) can bundle
 * this file as well. Content is informational only (how to use the account), never a promotion: the privacy policy
 * promises marketing e-mail only with a separate opt-in. Every dynamic value is HTML-escaped and user-provided text
 * (the name) never goes through the inline-markup parser.
 */

export type EmailKind = "welcome" | "nudge";
export type EmailLocale = "tr" | "en";
export const EMAIL_KINDS: EmailKind[] = ["welcome", "nudge"];

export interface EmailRecipient {
  /** First name, or null for a neutral greeting. */
  name: string | null;
  locale: EmailLocale;
  /** email_prefs.token — the unsubscribe key. */
  token: string;
}

export interface RenderedEmail {
  subject: string;
  preheader: string;
  html: string;
  text: string;
  /** Page with a confirm button (the visible footer link). */
  unsubscribeUrl: string;
  /** RFC 8058 one-click target for the List-Unsubscribe header (POST). */
  oneClickUrl: string;
}

type Block =
  | { t: "h1"; text: string }
  | { t: "p"; text: string; plain?: boolean }
  | { t: "steps"; items: { title: string; text: string }[] }
  | { t: "button"; label: string; href: string }
  | { t: "choices"; items: { icon: string; label: string; href: string }[] }
  | { t: "note"; text: string };

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const INK = "#0A0A0B";
const LIME = "#A3FF12";
const LINK = "#3f6212";
const TEXT = "#18181b";
const MUTED = "#52525b";

const QUICK_STARTS: { id: string; icon: string; label: string }[] = [
  { id: "saas-dash", icon: "📊", label: "SaaS Dashboard" },
  { id: "ai-wrapper", icon: "🤖", label: "AI SaaS Wrapper" },
  { id: "landing", icon: "✨", label: "Landing / Portfolio" },
  { id: "mobile", icon: "📱", label: "Mobile App" },
];

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/**
 * A name is only used when it looks like one (letters, spaces, apostrophes, dots, hyphens): no links, no e-mail
 * addresses, nothing a sign-up form could turn into spam inside our e-mail. First word, at most 40 characters.
 */
export function cleanName(name: string | null | undefined): string | null {
  const first = (name ?? "").trim().split(/\s+/)[0]?.slice(0, 40) ?? "";
  return /^[\p{L}\p{M}][\p{L}\p{M}'’.-]*$/u.test(first) ? first : null;
}

/** Inline markup for our own copy only: **bold** and [label](url). Escapes first, so input can't inject HTML. */
function md(s: string): string {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, `<a href="$2" style="color:${LINK};text-decoration:underline;">$1</a>`)
    .replace(/\n/g, "<br>");
}

function mdText(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1 ($2)");
}

function blockHtml(b: Block): string {
  switch (b.t) {
    case "h1":
      return `<h1 style="margin:0 0 14px;font:700 22px/1.3 ${FONT};color:${TEXT};letter-spacing:-0.3px;">${esc(b.text)}</h1>`;
    case "p":
      return `<p style="margin:0 0 14px;font:15px/1.6 ${FONT};color:${TEXT};">${b.plain ? esc(b.text) : md(b.text)}</p>`;
    case "note":
      return `<p style="margin:0 0 14px;font:13px/1.6 ${FONT};color:${MUTED};">${md(b.text)}</p>`;
    case "steps":
      return (
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 6px;">` +
        b.items
          .map(
            (it, i) =>
              `<tr><td valign="top" width="34" style="width:34px;padding:6px 0;">` +
              `<div style="width:24px;height:24px;border-radius:12px;background:${INK};color:${LIME};font:700 12px/24px ${FONT};text-align:center;">${i + 1}</div></td>` +
              `<td valign="top" style="padding:6px 0;font:15px/1.55 ${FONT};color:${TEXT};"><strong>${esc(it.title)}</strong><br>` +
              `<span style="color:${MUTED};">${md(it.text)}</span></td></tr>`,
          )
          .join("") +
        `</table>`
      );
    case "button":
      return (
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 22px;"><tr>` +
        `<td bgcolor="${LIME}" style="border-radius:10px;background:${LIME};">` +
        `<a href="${esc(b.href)}" style="display:inline-block;padding:13px 24px;font:700 15px/1.2 ${FONT};color:${INK};text-decoration:none;border-radius:10px;">${esc(b.label)} &rarr;</a>` +
        `</td></tr></table>`
      );
    case "choices":
      return (
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 18px;">` +
        b.items
          .map(
            (it) =>
              `<tr><td style="padding:0 0 8px;"><a href="${esc(it.href)}" style="display:block;padding:12px 14px;border:1px solid #e4e4e7;border-radius:10px;` +
              `font:600 14px/1.3 ${FONT};color:${TEXT};text-decoration:none;">${it.icon}&nbsp;&nbsp;${esc(it.label)}<span style="color:${LINK};"> &rarr;</span></a></td></tr>`,
          )
          .join("") +
        `</table>`
      );
  }
}

function blockText(b: Block): string {
  switch (b.t) {
    case "h1":
      return b.text;
    case "p":
      return b.plain ? b.text : mdText(b.text);
    case "note":
      return mdText(b.text);
    case "steps":
      return b.items.map((it, i) => `${i + 1}. ${it.title} — ${mdText(it.text)}`).join("\n");
    case "button":
      return `${b.label}: ${b.href}`;
    case "choices":
      return b.items.map((it) => `- ${it.label}: ${it.href}`).join("\n");
  }
}

/** Shared colours and font stack, also used by the Supabase Auth templates (auth-templates.ts). */
export const EMAIL_STYLE = { FONT, INK, LIME, LINK, TEXT, MUTED } as const;

/**
 * The branded e-mail frame: dark header with the logo, white card, footer. `bodyHtml` and `footerHtml` are inserted
 * as-is (callers build safe HTML); `site`, `title` and `preheader` are escaped.
 */
export function emailShell(o: { locale: EmailLocale; site: string; title: string; preheader: string; bodyHtml: string; footerHtml: string }): string {
  // Invisible filler keeps the client's preview text to the preheader instead of pulling in the body.
  const filler = "&#847;&zwnj;&nbsp;".repeat(60);
  return (
    `<!DOCTYPE html><html lang="${o.locale}"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting">` +
    `<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(o.title)}</title></head>` +
    `<body style="margin:0;padding:0;background:#f4f4f5;-webkit-text-size-adjust:100%;">` +
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(o.preheader)}${filler}</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;"><tr><td align="center" style="padding:28px 12px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;">` +
    `<tr><td style="background:${INK};padding:16px 28px;border-radius:16px 16px 0 0;">` +
    `<a href="${esc(o.site)}" style="text-decoration:none;"><img src="${esc(o.site)}/icon-192.png" width="32" height="32" alt="" style="vertical-align:middle;border:0;border-radius:8px;">` +
    `<span style="vertical-align:middle;padding-left:10px;font:700 16px/1 ${FONT};color:#ffffff;letter-spacing:-0.2px;">Prompter.Monster</span></a></td></tr>` +
    `<tr><td style="padding:28px 28px 10px;">${o.bodyHtml}</td></tr>` +
    `<tr><td style="padding:18px 28px 24px;border-top:1px solid #f0f0f2;font:12px/1.6 ${FONT};color:#71717a;">${o.footerHtml}</td></tr>` +
    `</table></td></tr></table></body></html>`
  );
}

function layout(o: { locale: EmailLocale; site: string; subject: string; preheader: string; body: Block[]; footer: string }): string {
  return emailShell({ locale: o.locale, site: o.site, title: o.subject, preheader: o.preheader, bodyHtml: o.body.map(blockHtml).join(""), footerHtml: md(o.footer) });
}

/** Adds UTM tags so returning sessions are attributed to the e-mail in GA4. */
function utm(url: string, campaign: EmailKind): string {
  const u = new URL(url);
  u.searchParams.set("utm_source", "email");
  u.searchParams.set("utm_medium", "lifecycle");
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}

function copy(kind: EmailKind, r: EmailRecipient, site: string) {
  const en = r.locale === "en";
  const name = cleanName(r.name);
  const base = `${site}${en ? "/en" : ""}`;
  const studio = utm(`${base}/studio`, kind);
  const sign = en ? "Happy building,\n**Prompter.Monster**" : "İyi üretimler,\n**Prompter.Monster**";

  if (kind === "welcome") {
    const developers = utm(`${base}/developers`, kind);
    return en
      ? {
          subject: "Welcome to Prompter.Monster — your first build prompt is 3 steps away",
          preheader: "Turn your idea into a master build prompt that Claude Code, Cursor, v0, Lovable and Bolt get right the first time.",
          body: [
            { t: "h1", text: name ? `Welcome, ${name}!` : "Welcome!" },
            {
              t: "p",
              text: "Prompter.Monster turns a product idea into a master build prompt — architecture, feature list, payment flow and constraints included — that you can paste straight into **Claude Code, Cursor, v0, Lovable or Bolt**.",
            },
            { t: "p", text: "Your first prompt in three steps:" },
            {
              t: "steps",
              items: [
                { title: "Describe your idea", text: "A name, a one-line pitch and your audience are enough. Or start from a project type: the recommended stack and features come pre-filled." },
                { title: "Pick your stack and features", text: "Payment provider and constraints like GDPR included — every choice ends up in the prompt." },
                { title: "Choose your experts and unleash the monster", text: "Experts like the CTO, PM and Designer each add their own task block. Copy the output and paste it into your AI tool." },
              ],
            },
            { t: "button", label: "Open the Studio", href: studio },
            {
              t: "p",
              text: `**Tip:** save your project and it stays in your library, so you can pick up where you left off. Rather stay in your editor? With the [MCP server](${developers}) you can generate prompts from Claude Code, Cursor or VS Code too.`,
            },
            { t: "p", text: sign },
          ] as Block[],
        }
      : {
          subject: "Prompter.Monster'a hoş geldin — ilk build prompt'un 3 adım uzakta",
          preheader: "Fikrini Claude Code, Cursor, v0, Lovable ve Bolt'un ilk seferde anlayacağı bir master build prompt'una çevir.",
          body: [
            { t: "h1", text: name ? `Hoş geldin, ${name}!` : "Hoş geldin!" },
            {
              t: "p",
              text: "Prompter.Monster'da bir ürün fikrini; mimarisi, özellik listesi, ödeme akışı ve kısıtlarıyla birlikte **Claude Code, Cursor, v0, Lovable ve Bolt**'a doğrudan yapıştırabileceğin bir master build prompt'una çeviriyorsun.",
            },
            { t: "p", text: "İlk prompt'un için üç adım:" },
            {
              t: "steps",
              items: [
                { title: "Fikrini anlat", text: "Ad, tek cümlelik pitch ve hedef kitle yeterli. İstersen bir proje tipiyle başla; önerilen stack ve özellikler hazır gelir." },
                { title: "Stack'i ve özellikleri seç", text: "Ödeme sağlayıcısı, KVKK/GDPR gibi kısıtlar dahil — her seçim prompt'a işlenir." },
                { title: "Uzmanları seç, canavarı serbest bırak", text: "CTO, PM, Design gibi uzmanlar kendi görev bloklarını ekler. Çıktıyı kopyala, AI aracına yapıştır." },
              ],
            },
            { t: "button", label: "Studio'yu aç", href: studio },
            {
              t: "p",
              text: `**İpucu:** Projeni kaydedersen kütüphanende durur; istediğin zaman kaldığın yerden devam edersin. Editöründen çıkmak istemiyorsan [MCP sunucusu](${developers}) ile Claude Code, Cursor veya VS Code'dan da prompt üretebilirsin.`,
            },
            { t: "p", text: sign },
          ] as Block[],
        };
  }

  const choices = QUICK_STARTS.map((q) => ({ icon: q.icon, label: q.label, href: utm(`${base}/studio?type=${q.id}`, kind) }));
  const explore = utm(`${base}/explore`, kind);
  return en
    ? {
        subject: "Start from a ready-made setup — your first prompt in 2 minutes",
        preheader: "Skip the blank page: pick a project type and the Studio opens with the recommended settings.",
        body: [
          { t: "h1", text: "Skip the blank page" },
          { t: "p", text: name ? `Hi ${name},` : "Hi there,", plain: true },
          {
            t: "p",
            text: "You opened a Prompter.Monster account but haven't saved a project yet. The fastest way in: pick a project type below and the Studio opens with the recommended experts, stack and features for it. All that's left is your idea's name and a one-line pitch.",
          },
          { t: "choices", items: choices },
          { t: "p", text: `Got a different idea? Browse the prompts the community shared in [Explore](${explore}) and use one as a starting point — or open a blank [Studio](${studio}).` },
          { t: "p", text: "When you're done, save your project: it stays in your library so you can pick up where you left off." },
          { t: "note", text: "This is the only reminder we'll send about your account." },
          { t: "p", text: sign },
        ] as Block[],
      }
    : {
        subject: "Hazır bir başlangıçla ilk prompt'unu 2 dakikada çıkar",
        preheader: "Boş sayfayla uğraşma: bir proje tipi seç, Studio önerilen ayarlarla açılsın.",
        body: [
          { t: "h1", text: "Boş sayfayla uğraşma" },
          { t: "p", text: name ? `Merhaba ${name},` : "Merhaba,", plain: true },
          {
            t: "p",
            text: "Prompter.Monster hesabını açtın ama henüz kayıtlı bir projen yok. En hızlı yol: aşağıdan bir proje tipi seç; Studio o tipe önerilen uzmanlar, stack ve özelliklerle açılsın. Sana kalan, fikrinin adını ve tek cümlelik pitch'ini yazmak.",
          },
          { t: "choices", items: choices },
          { t: "p", text: `Başka bir fikrin mi var? [Keşfet](${explore}) sayfasında topluluğun paylaştığı prompt'ları incele ve birini başlangıç yap ya da [Studio](${studio})'yu boş aç.` },
          { t: "p", text: "Bitirdiğinde projeni kaydetmeyi unutma: kütüphanende durur, kaldığın yerden devam edersin." },
          { t: "note", text: "Bu, hesabınla ilgili gönderdiğimiz tek hatırlatma." },
          { t: "p", text: sign },
        ] as Block[],
      };
}

/** Renders one lifecycle e-mail. `site` is the public origin without a trailing slash (https://prompter.monster). */
export function renderLifecycleEmail(kind: EmailKind, r: EmailRecipient, site: string): RenderedEmail {
  const origin = site.replace(/\/$/, "");
  const en = r.locale === "en";
  const t = encodeURIComponent(r.token);
  const unsubscribeUrl = `${origin}${en ? "/en" : ""}/unsubscribe?t=${t}`;
  const oneClickUrl = `${origin}/api/email/unsubscribe?t=${t}`;
  const c = copy(kind, r, origin);
  const footer = en
    ? `You're receiving this because you have a Prompter.Monster account — it's a note to help you get started, not a promotion. Don't want these? [Unsubscribe](${unsubscribeUrl}). Sign-in and security e-mails aren't affected. Questions? Just reply to this e-mail.\n[prompter.monster](${origin})`
    : `Bu e-postayı Prompter.Monster hesabın olduğu için aldın — hesabını kullanmaya başlaman için bir bilgilendirme, kampanya değil. Bu tür e-postaları istemiyorsan [buradan çık](${unsubscribeUrl}). Giriş ve güvenlik e-postaları bu ayardan etkilenmez. Sorun mu var? Bu e-postayı yanıtla.\n[prompter.monster](${origin})`;
  const html = layout({ locale: r.locale, site: origin, subject: c.subject, preheader: c.preheader, body: c.body, footer });
  const text = [...c.body.map(blockText), "—", mdText(footer)].join("\n\n");
  return { subject: c.subject, preheader: c.preheader, html, text, unsubscribeUrl, oneClickUrl };
}
