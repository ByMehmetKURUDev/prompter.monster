import { ArrowRight, Clipboard, Command, Download, KeyRound, Puzzle, RefreshCw, ShieldCheck, Terminal } from "lucide-react";
import Link from "next/link";
import { CHROME_EXTENSION, CHROME_EXTENSION_SITES, RAYCAST_EXTENSION } from "@/lib/extensions";
import { lhref, type Locale } from "@/lib/i18n";
import { PublicShell } from "./PublicShell";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://prompter.monster").replace(/\/$/, "");

export const EXT_META = {
  tr: {
    title: "Prompter.Monster eklentileri: Chrome ve Raycast",
    description:
      "Chrome eklentisiyle master prompt'u ChatGPT, Claude ve Gemini'ye tek tıkla yapıştır; Raycast eklentisiyle Mac'inde prompt üret. İkisi de ücretsiz.",
  },
  en: {
    title: "Prompter.Monster extensions: Chrome and Raycast",
    description:
      "Paste your master prompt into ChatGPT, Claude and Gemini in one click with the Chrome extension, or generate prompts from Raycast on your Mac. Both free.",
  },
} as const;

const sites = CHROME_EXTENSION_SITES.join(", ");

const T = {
  tr: {
    badge: "Ücretsiz · Chrome · Raycast",
    h1: "Prompter.Monster'ı tarayıcına ve Mac'ine ekle",
    lead: "İki ücretsiz eklenti, hesap gerekmez. Chrome eklentisi kopyaladığın prompt'u AI sohbetine tek tıkla yapıştırır; Raycast eklentisi Mac'inde fikrinden master prompt üretir.",
    cards: {
      chrome: { title: "Chrome eklentisi", sub: "Chrome, Edge, Brave, Opera, Vivaldi, Arc", body: "Studio'da kopyaladığın prompt'u ChatGPT, Claude ya da Gemini'nin mesaj kutusuna tek tıkla yapıştırır.", go: "Chrome kurulumu" },
      raycast: { title: "Raycast eklentisi", sub: "Mac", body: "Tarayıcıyı açmadan, Raycast'in komut paletinden tek satırlık fikrinden master prompt üretir.", go: "Raycast kurulumu" },
    },
    chrome: {
      h2: "Chrome eklentisi: Tek Tık Aktar",
      lead: `Prompter.Monster'da kopyaladığın master prompt'u (ya da bir bölümünü) açık AI sohbetinin mesaj kutusuna yazar. Tanıdığı siteler: ${sites}; diğer sitelerde sayfadaki en büyük metin kutusunu bulur.`,
      features: [
        "Simgeye tıkla, Panodakini Yapıştır'a bas: metin mesaj kutusunda.",
        "İstersen yapıştırdıktan sonra otomatik gönderir (varsayılan kapalı).",
        "Tarayıcının diline göre Türkçe ya da İngilizce.",
      ],
      download: "Chrome eklentisini indir (.zip)",
      store: "Chrome Web Store'dan ekle",
      storeNote: "Eklenti henüz Chrome Web Store'da değil. Aşağıdaki adımlarla bir dakikada kurarsın.",
      installTitle: "Kurulum (1 dakika)",
      steps: [
        ["Zip'i indir ve aç", `İndirdiğin dosyaya çift tıkla; ${CHROME_EXTENSION.folder} klasörü çıkar. Klasörü silmeyeceğin bir yere taşı: Chrome eklentiyi oradan çalıştırır.`],
        ["Eklentiler sayfasını aç", "Adres çubuğuna chrome://extensions yaz. Edge'de edge://extensions, Brave'de brave://extensions."],
        ["Geliştirici modunu aç", "Sağ üstteki Geliştirici modu anahtarını aç."],
        ["Klasörü yükle", `Paketlenmemiş öğe yükle'ye tıkla ve ${CHROME_EXTENSION.folder} klasörünü seç. Sonra yapboz simgesinden Prompter.Monster'ı sabitle.`],
      ],
      useTitle: "Kullanım",
      use: "Studio'da Kopyala'ya bas, AI sohbet sekmesine geç, eklenti simgesine tıkla ve Panodakini Yapıştır'a bas.",
      permsTitle: "İzinler ve gizlilik",
      perms: [
        ["Etkin sekme + betik", "Yalnız simgeye tıkladığın sekmede, metni mesaj kutusuna yazmak için. Sitelere kalıcı erişim yok."],
        ["Panoyu okuma", "Pano yalnız Yapıştır'a bastığında okunur."],
        ["Depolama", "Yalnız otomatik gönder ayarını hatırlar."],
      ],
      privacy: "Veri toplamaz, hiçbir sunucuya bir şey göndermez, analitik içermez.",
      updateTitle: "Tarayıcılar ve güncelleme",
      browsers: "Chromium tabanlı masaüstü tarayıcılarda çalışır: Chrome, Edge, Brave, Opera, Vivaldi, Arc. Firefox ve Safari desteklenmiyor.",
      update: "Yeni sürüm çıkınca zip'i yeniden indir, eski klasörün yerine koy ve eklentiler sayfasında eklentinin yenile (↻) düğmesine bas.",
    },
    raycast: {
      h2: "Raycast eklentisi (Mac)",
      beta: "Beta",
      lead: "Raycast, Mac için ücretsiz bir komut paleti; Spotlight'ın yerine kullanılır. Eklenti iki komut ekler:",
      commands: [
        ["Generate Build Prompt", "Proje adı ve tek satırlık fikirden master build prompt'u üretir (ChatGPT Markdown, Claude XML, Cursor Rules, v0, Lovable/Bolt). Sonucu kopyala, öndeki uygulamaya yapıştır ya da Studio'da aç."],
        ["Browse Project Types", "28 proje tipini ara ve kimliğini kopyala; Generate komutunda hazır ayar olarak kullan."],
      ],
      requires: (raycast: string, node: string) => `Gerekenler: macOS, Raycast ${raycast} veya üstü, Node.js ${node} veya üstü.`,
      download: "Raycast eklentisini indir (.zip)",
      store: "Raycast Store'dan ekle",
      storeNote: "Eklenti henüz Raycast Store'da değil; şimdilik kaynak kodundan bir kez kurulur (2–3 dakika).",
      installTitle: "Kurulum (Mac, 2–3 dakika)",
      steps: [
        ["Raycast ve Node.js'i kur", "raycast.com'dan Raycast'i, nodejs.org'dan Node.js'in LTS sürümünü indirip kur."],
        ["Zip'i indir ve aç", `${RAYCAST_EXTENSION.folder} klasörünü kalıcı bir yere taşı (ör. Belgeler); güncellerken yine bu klasörü kullanırsın.`],
        ["Terminal'de klasöre geç", "Terminal'i aç, cd yazıp bir boşluk bırak, klasörü Terminal penceresine sürükle ve Enter'a bas."],
        ["Tek komutla kur", "Aşağıdaki komutu çalıştır. Raycast açılır ve Prompter.Monster komutları listenin en üstünde görünür. Sonra Terminal'de Ctrl+C'ye bas: eklenti Raycast'te kalır."],
      ],
      command: "npm install && npm run dev",
      keyTitle: "İsteğe bağlı: API anahtarı",
      key: "Anahtarsız Free sınırlarıyla çalışır: 3 uzman, ChatGPT Markdown ve Claude XML. Pro'daysan hesabından bir pm_live_… anahtarı oluştur ve Raycast Ayarları → Extensions → Prompter.Monster'daki API Key alanına yapıştır: 18 uzman ve bütün formatlar açılır. Dil (TR/EN) de aynı yerden.",
      keyLink: "API anahtarı oluştur",
      updateTitle: "Güncelleme",
      update: "Yeni sürüm çıkınca zip'i yeniden indir, klasörün yerine koy ve aynı komutu tekrar çalıştır.",
    },
    faqTitle: "Sık sorulanlar",
    faq: [
      ["Ücretli mi?", "Hayır, iki eklenti de ücretsiz ve hesap istemez. Raycast eklentisine Pro API anahtarı girersen Pro sınırları geçerli olur."],
      ["Chrome eklentisi verilerimi görüyor mu?", "Hayır. Panoyu yalnız Yapıştır'a bastığında okur ve metni sadece o sekmenin mesaj kutusuna yazar. Hiçbir sunucuya veri göndermez."],
      ["Neden Geliştirici modu gerekiyor?", "Eklenti henüz Chrome Web Store'da değil; mağaza dışından eklenti kurmanın Chrome'daki yolu bu. Eklentinin bütün dosyaları indirdiğin klasörde, okunabilir halde duruyor."],
      ["\"Sohbet kutusu bulunamadı\" diyor", "Sayfanın tam yüklendiğinden emin ol, mesaj kutusuna bir kez tıkla ve tekrar dene. Sorun sürerse eklentinin en yeni sürümünü bu sayfadan indir."],
      ["Raycast eklentisi neye bağlanıyor?", "Prompt'u üretmek için yazdığın fikri Prompter.Monster'ın herkese açık API'sine gönderir; Studio'nun kullandığı motorun aynısı. Ayrıntılar geliştirici sayfasında."],
    ],
    devLink: "API ve MCP",
    ctaTitle: "Önce prompt'unu üret",
    ctaBody: "Eklentiler Studio'da ürettiğin prompt'u araçlarına taşır. Fikrini yaz, 18 uzman master prompt'unu hazırlasın.",
    cta: "Studio'yu aç",
    version: (v: string) => `Sürüm ${v}`,
  },
  en: {
    badge: "Free · Chrome · Raycast",
    h1: "Add Prompter.Monster to your browser and your Mac",
    lead: "Two free extensions, no account needed. The Chrome extension pastes the prompt you copied into your AI chat in one click; the Raycast extension turns an idea into a master prompt right on your Mac.",
    cards: {
      chrome: { title: "Chrome extension", sub: "Chrome, Edge, Brave, Opera, Vivaldi, Arc", body: "Pastes the prompt you copied in the Studio into the ChatGPT, Claude or Gemini message box in one click.", go: "Install for Chrome" },
      raycast: { title: "Raycast extension", sub: "Mac", body: "Turns a one-line idea into a master prompt from Raycast's command palette, without opening the browser.", go: "Install for Raycast" },
    },
    chrome: {
      h2: "Chrome extension: One-Click Paste",
      lead: `Writes the master prompt you copied on Prompter.Monster (or any section of it) into the message box of the open AI chat. Sites it knows by name: ${sites}; anywhere else it finds the largest text box on the page.`,
      features: [
        "Click the icon, press Paste from Clipboard: the text is in the message box.",
        "Can send it for you after pasting (off by default).",
        "English or Turkish, following your browser's language.",
      ],
      download: "Download the Chrome extension (.zip)",
      store: "Add from the Chrome Web Store",
      storeNote: "The extension isn't on the Chrome Web Store yet. Install it in a minute with the steps below.",
      installTitle: "Install (1 minute)",
      steps: [
        ["Download and unzip", `Double-click the file you downloaded to get the ${CHROME_EXTENSION.folder} folder. Move it somewhere you won't delete it: Chrome runs the extension from there.`],
        ["Open the extensions page", "Type chrome://extensions in the address bar. On Edge it's edge://extensions, on Brave brave://extensions."],
        ["Turn on Developer mode", "Flip the Developer mode switch in the top right corner."],
        ["Load the folder", `Click Load unpacked and pick the ${CHROME_EXTENSION.folder} folder. Then pin Prompter.Monster from the puzzle icon.`],
      ],
      useTitle: "How to use it",
      use: "Press Copy in the Studio, switch to your AI chat tab, click the extension icon and press Paste from Clipboard.",
      permsTitle: "Permissions and privacy",
      perms: [
        ["Active tab + scripting", "Only on the tab where you click the icon, to write the text into the message box. No standing access to any site."],
        ["Read clipboard", "The clipboard is read only when you press Paste."],
        ["Storage", "Remembers your auto-send setting, nothing else."],
      ],
      privacy: "Collects no data, sends nothing to any server, no analytics.",
      updateTitle: "Browsers and updates",
      browsers: "Works in Chromium-based desktop browsers: Chrome, Edge, Brave, Opera, Vivaldi, Arc. Firefox and Safari aren't supported.",
      update: "When a new version is out, download the zip again, replace the old folder and press the extension's reload (↻) button on the extensions page.",
    },
    raycast: {
      h2: "Raycast extension (Mac)",
      beta: "Beta",
      lead: "Raycast is a free command palette for the Mac that people use instead of Spotlight. The extension adds two commands:",
      commands: [
        ["Generate Build Prompt", "Turns a project name and a one-line idea into a master build prompt (ChatGPT Markdown, Claude XML, Cursor Rules, v0, Lovable/Bolt). Copy the result, paste it into the frontmost app or open it in the Studio."],
        ["Browse Project Types", "Search the 28 project types and copy an ID to use as presets in Generate."],
      ],
      requires: (raycast: string, node: string) => `You need macOS, Raycast ${raycast} or later and Node.js ${node} or later.`,
      download: "Download the Raycast extension (.zip)",
      store: "Add from the Raycast Store",
      storeNote: "The extension isn't in the Raycast Store yet; for now you install it once from source (2–3 minutes).",
      installTitle: "Install (Mac, 2–3 minutes)",
      steps: [
        ["Install Raycast and Node.js", "Get Raycast from raycast.com and the LTS version of Node.js from nodejs.org."],
        ["Download and unzip", `Move the ${RAYCAST_EXTENSION.folder} folder somewhere permanent (Documents, say); you'll use it again to update.`],
        ["Open the folder in Terminal", "Open Terminal, type cd followed by a space, drag the folder onto the Terminal window and press Enter."],
        ["Install with one command", "Run the command below. Raycast opens with the Prompter.Monster commands at the top of the list. Then press Ctrl+C in Terminal: the extension stays in Raycast."],
      ],
      command: "npm install && npm run dev",
      keyTitle: "Optional: API key",
      key: "Without a key it runs on the Free limits: 3 experts, ChatGPT Markdown and Claude XML. On Pro, create a pm_live_… key in your account and paste it into the API Key field under Raycast Settings → Extensions → Prompter.Monster: all 18 experts and every format unlock. The language (EN/TR) is set there too.",
      keyLink: "Create an API key",
      updateTitle: "Updates",
      update: "When a new version is out, download the zip again, replace the folder and run the same command again.",
    },
    faqTitle: "FAQ",
    faq: [
      ["Do they cost anything?", "No. Both extensions are free and need no account. Add a Pro API key to the Raycast extension and the Pro limits apply."],
      ["Can the Chrome extension see my data?", "No. It reads the clipboard only when you press Paste and writes the text only into that tab's message box. It sends nothing to any server."],
      ["Why is Developer mode needed?", "The extension isn't on the Chrome Web Store yet, and this is how Chrome installs extensions from outside the store. Every file of the extension sits, readable, in the folder you downloaded."],
      ["It says \"No chat box found\"", "Make sure the page has finished loading, click into the message box once and try again. If it keeps happening, download the latest version from this page."],
      ["What does the Raycast extension connect to?", "To generate the prompt it sends your idea to Prompter.Monster's public API, the same engine the Studio uses. Details are on the developer page."],
    ],
    devLink: "API & MCP",
    ctaTitle: "Generate your prompt first",
    ctaBody: "The extensions carry the prompt you make in the Studio into your tools. Write your idea and let 18 experts draft your master prompt.",
    cta: "Open the Studio",
    version: (v: string) => `Version ${v}`,
  },
} as const;

function Steps({ steps }: { steps: readonly (readonly [string, string])[] }) {
  return (
    <ol className="mt-4 grid sm:grid-cols-2 gap-3">
      {steps.map(([title, body], i) => (
        <li key={title} className="rounded-2xl bg-ink-900 border border-ink-600 p-5">
          <div className="w-7 h-7 rounded-lg bg-lime text-black text-[13px] font-black grid place-items-center">{i + 1}</div>
          <h4 className="mt-3 text-[14.5px] font-bold">{title}</h4>
          <p className="mt-1.5 text-[13px] text-zinc-400 leading-relaxed">{body}</p>
        </li>
      ))}
    </ol>
  );
}

/** /extensions and /en/extensions: download + install steps for the Chrome and Raycast extensions. */
export function ExtensionsView({ locale }: { locale: Locale }) {
  const t = T[locale];
  const L = (p: string) => lhref(p, locale);
  const pageUrl = `${SITE_URL}${locale === "en" ? "/en" : ""}/extensions`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: locale === "en" ? "Prompter.Monster — One-Click Paste" : "Prompter.Monster — Tek Tık Aktar",
        description: t.chrome.lead,
        applicationCategory: "BrowserApplication",
        operatingSystem: "Chrome, Edge, Brave, Opera, Vivaldi, Arc",
        softwareVersion: CHROME_EXTENSION.version,
        downloadUrl: `${SITE_URL}${CHROME_EXTENSION.zip}`,
        url: `${pageUrl}#chrome`,
        inLanguage: ["en", "tr"],
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@type": "Organization", name: "Prompter.Monster", url: SITE_URL },
      },
      {
        "@type": "SoftwareApplication",
        name: "Prompter.Monster for Raycast",
        description: t.raycast.commands.map(([name, body]) => `${name}: ${body}`).join(" "),
        applicationCategory: "DeveloperApplication",
        operatingSystem: "macOS",
        downloadUrl: `${SITE_URL}${RAYCAST_EXTENSION.zip}`,
        url: `${pageUrl}#raycast`,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@type": "Organization", name: "Prompter.Monster", url: SITE_URL },
      },
    ],
  };
  const primary = "h-11 px-5 rounded-xl bg-lime text-black text-[13px] font-bold inline-flex items-center gap-2";
  const secondary = "h-11 px-5 rounded-xl bg-ink-800 border border-ink-600 text-[13px] font-semibold inline-flex items-center gap-2";
  const h2 = "text-xl md:text-2xl font-bold tracking-tight flex flex-wrap items-center gap-x-2.5 gap-y-1.5";
  const link = "text-lime underline decoration-lime/40 underline-offset-2 hover:decoration-lime";

  return (
    <PublicShell locale={locale}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="max-w-[960px] mx-auto px-4 lg:px-8 py-12">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800 border border-ink-600 text-[12px] text-zinc-400">
          <Puzzle className="w-3.5 h-3.5 text-lime" aria-hidden /> {t.badge}
        </span>
        <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">{t.h1}</h1>
        <p className="mt-4 text-[15px] text-zinc-400 leading-relaxed max-w-[720px]">{t.lead}</p>

        <div className="mt-8 grid md:grid-cols-2 gap-3">
          {(["chrome", "raycast"] as const).map((id) => {
            const c = t.cards[id];
            const Icon = id === "chrome" ? Puzzle : Command;
            return (
              <a key={id} href={`#${id}`} className="group rounded-2xl bg-ink-900 border border-ink-600 hover:border-lime/50 p-5 flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-lime/10 border border-lime/30 grid place-items-center">
                    <Icon className="w-5 h-5 text-lime" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold">{c.title}</span>
                    <span className="block text-[12px] text-zinc-500">{c.sub}</span>
                  </span>
                </div>
                <p className="mt-3 text-[13px] text-zinc-400 leading-relaxed flex-1">{c.body}</p>
                <span className="mt-4 text-[13px] font-semibold text-lime inline-flex items-center gap-1.5">
                  {c.go} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </a>
            );
          })}
        </div>

        <section id="chrome" className="mt-14 scroll-mt-20">
          <h2 className={h2}>
            <span className="flex items-center gap-2 min-w-0">
              <Puzzle className="w-5 h-5 text-lime shrink-0" aria-hidden />
              <span>{t.chrome.h2}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-ink-800 border border-ink-600 text-[11px] font-semibold text-zinc-400">{t.version(CHROME_EXTENSION.version)}</span>
          </h2>
          <p className="mt-3 text-[14px] text-zinc-400 leading-relaxed max-w-[760px]">{t.chrome.lead}</p>
          <ul className="mt-3 space-y-1.5 text-[13.5px] text-zinc-300">
            {t.chrome.features.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            {CHROME_EXTENSION.storeUrl && (
              <a href={CHROME_EXTENSION.storeUrl} className={primary} target="_blank" rel="noopener noreferrer">
                <Puzzle className="w-4 h-4" aria-hidden /> {t.chrome.store}
              </a>
            )}
            <a href={CHROME_EXTENSION.zip} download className={CHROME_EXTENSION.storeUrl ? secondary : primary}>
              <Download className="w-4 h-4" aria-hidden /> {t.chrome.download}
            </a>
          </div>
          {!CHROME_EXTENSION.storeUrl && <p className="mt-2 text-[12.5px] text-zinc-500">{t.chrome.storeNote}</p>}

          <h3 className="mt-8 text-[16px] font-bold">{t.chrome.installTitle}</h3>
          <Steps steps={t.chrome.steps} />
          <p className="mt-4 rounded-xl bg-ink-900 border border-ink-600 px-4 py-3 text-[13px] text-zinc-300 flex items-start gap-2">
            <Clipboard className="w-4 h-4 mt-0.5 text-lime shrink-0" aria-hidden />
            <span>
              <strong className="font-semibold text-zinc-100">{t.chrome.useTitle}:</strong> {t.chrome.use}
            </span>
          </p>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-ink-900 border border-ink-600 p-5">
              <h3 className="text-[15px] font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-lime" aria-hidden /> {t.chrome.permsTitle}
              </h3>
              <dl className="mt-3 space-y-2.5 text-[13px]">
                {t.chrome.perms.map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-semibold text-zinc-200">{k}</dt>
                    <dd className="text-zinc-400">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[13px] text-zinc-300">{t.chrome.privacy}</p>
            </div>
            <div className="rounded-2xl bg-ink-900 border border-ink-600 p-5">
              <h3 className="text-[15px] font-bold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-lime" aria-hidden /> {t.chrome.updateTitle}
              </h3>
              <p className="mt-3 text-[13px] text-zinc-400 leading-relaxed">{t.chrome.browsers}</p>
              <p className="mt-2.5 text-[13px] text-zinc-400 leading-relaxed">{t.chrome.update}</p>
            </div>
          </div>
        </section>

        <section id="raycast" className="mt-14 scroll-mt-20">
          <h2 className={h2}>
            <span className="flex items-center gap-2 min-w-0">
              <Command className="w-5 h-5 text-lime shrink-0" aria-hidden />
              <span>{t.raycast.h2}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-violet/15 border border-violet/40 text-[11px] font-semibold text-violet-300">{t.raycast.beta}</span>
          </h2>
          <p className="mt-3 text-[14px] text-zinc-400 leading-relaxed max-w-[760px]">
            {t.raycast.lead}
          </p>
          <ul className="mt-3 grid sm:grid-cols-2 gap-2">
            {t.raycast.commands.map(([name, body]) => (
              <li key={name} className="rounded-xl bg-ink-900 border border-ink-600 px-4 py-3">
                <span className="text-[13.5px] font-bold text-zinc-100">{name}</span>
                <p className="mt-1 text-[12.5px] text-zinc-400 leading-relaxed">{body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-zinc-400">{t.raycast.requires(RAYCAST_EXTENSION.minRaycast, RAYCAST_EXTENSION.minNode)}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {RAYCAST_EXTENSION.storeUrl && (
              <a href={RAYCAST_EXTENSION.storeUrl} className={primary} target="_blank" rel="noopener noreferrer">
                <Command className="w-4 h-4" aria-hidden /> {t.raycast.store}
              </a>
            )}
            <a href={RAYCAST_EXTENSION.zip} download className={RAYCAST_EXTENSION.storeUrl ? secondary : primary}>
              <Download className="w-4 h-4" aria-hidden /> {t.raycast.download}
            </a>
            <a href="https://www.raycast.com" className={secondary} target="_blank" rel="noopener noreferrer">
              raycast.com
            </a>
          </div>
          {!RAYCAST_EXTENSION.storeUrl && <p className="mt-2 text-[12.5px] text-zinc-500">{t.raycast.storeNote}</p>}

          <h3 className="mt-8 text-[16px] font-bold">{t.raycast.installTitle}</h3>
          <Steps steps={t.raycast.steps} />
          <div className="mt-4 rounded-2xl bg-ink-900 border border-ink-600 p-4 font-mono text-[13px] text-zinc-200 flex items-center gap-2 overflow-x-auto">
            <Terminal className="w-4 h-4 text-lime shrink-0" aria-hidden />
            <code className="whitespace-nowrap">{t.raycast.command}</code>
          </div>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-ink-900 border border-ink-600 p-5">
              <h3 className="text-[15px] font-bold flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-lime" aria-hidden /> {t.raycast.keyTitle}
              </h3>
              <p className="mt-3 text-[13px] text-zinc-400 leading-relaxed">{t.raycast.key}</p>
              <Link href={L("/account/api")} className={`mt-3 inline-block text-[13px] ${link}`}>
                {t.raycast.keyLink}
              </Link>
            </div>
            <div className="rounded-2xl bg-ink-900 border border-ink-600 p-5">
              <h3 className="text-[15px] font-bold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-lime" aria-hidden /> {t.raycast.updateTitle}
              </h3>
              <p className="mt-3 text-[13px] text-zinc-400 leading-relaxed">{t.raycast.update}</p>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <h2 className={h2}>{t.faqTitle}</h2>
          <dl className="mt-4 rounded-2xl border border-ink-600 divide-y divide-ink-600 overflow-hidden">
            {t.faq.map(([q, a], i) => (
              <div key={q} className="px-5 py-4 bg-ink-900/40">
                <dt className="text-[14px] font-semibold text-zinc-100">{q}</dt>
                <dd className="mt-1.5 text-[13px] text-zinc-400 leading-relaxed">
                  {a}
                  {i === t.faq.length - 1 && (
                    <>
                      {" "}
                      <Link href={L("/developers")} className={link}>
                        {t.devLink}
                      </Link>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12 rounded-2xl border border-lime/30 bg-gradient-to-br from-lime/10 to-violet/10 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-bold">{t.ctaTitle}</h2>
            <p className="mt-1 text-[13px] text-zinc-400">{t.ctaBody}</p>
          </div>
          <Link href={L("/studio?new=1")} className="h-11 px-5 rounded-xl bg-lime text-black text-[13px] font-bold flex items-center justify-center gap-2 shrink-0">
            {t.cta} <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </section>
      </main>
    </PublicShell>
  );
}
