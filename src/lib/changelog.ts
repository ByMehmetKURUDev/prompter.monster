/**
 * Product changelog — newest first. `title` / `items` are the admin notes (Turkish, may name migrations and
 * internals; shown in /admin). `public` is the user-facing wording for the public "Yenilikler" page
 * (/changelog, /en/changelog and their RSS feeds); a release without it stays admin-only.
 * Add an entry at the top with each release. Server-side only: don't import this into client components.
 */
export interface ChangelogNote {
  title: string;
  items: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string; // ISO
  title: string;
  items: string[];
  /** Setting keys introduced with this release (rendered as quick links in the panel). */
  settings?: string[];
  /** Public notes in both languages (no internals: no migrations, RPCs, admin pages). */
  public?: { tr: ChangelogNote; en: ChangelogNote };
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "4.19.3",
    date: "2026-11-19",
    title: "www adresi ana adrese yönleniyor; CI'da actions v7",
    items: [
      "www.prompter.monster sayfaları artık 301 ile prompter.monster'a yönleniyor (Worker). Önceden www ayrı bir kopya gibi açılıyordu: arama motorları için çift adres, girişte de ayrı oturum (Supabase giriş bağlantılarını yalnız ana adrese gönderir). /api/ yolları yönlendirilmez; webhook ve MCP istemcileri yönlendirme izlemez.",
      "GitHub Actions: actions/checkout ve actions/setup-node v4 → v7 (Node 24). 'Node.js 20 actions are deprecated' uyarısı kalktı.",
    ],
  },
  {
    version: "4.19.2",
    date: "2026-11-19",
    title: "Canlı site taraması: İngilizce sayfalarda lang, site haritası, uzun açıklamalar",
    items: [
      "Canlı tarama: site haritasındaki 173 sayfa ve sayfalardan çıkan 70 iç bağlantı 200 döndü; hepsinde başlık, açıklama, canonical, hreflang, paylaşım görseli ve tek h1 var; 11 önemli sayfada konsol hatası yok; İngilizce sayfalarda Türkçe başlık ya da açıklama kalmamış.",
      "İngilizce sayfaların HTML'i <html lang=\"tr\"> ile geliyordu (tarayıcıda bir betik düzeltiyordu, ama arama motoru botları, bağlantı önizlemeleri ve doğrulayıcılar ham HTML'i okur). Worker artık /en altındaki HTML belgelerinde lang=\"en\" yazıyor; hydration uyarısı da susturuldu.",
      "Site haritasına /explore/leaderboard ve /en/explore/leaderboard eklendi (sayfalardan bağlantılıydı ama listede yoktu).",
      "160 karakteri aşan 7 açıklama kısaltıldı (fiyatlandırma, geliştiriciler, build prompt'lar, İngilizce kılavuz).",
    ],
  },
  {
    version: "4.19.1",
    date: "2026-11-19",
    title: "Veritabanı davranış testleri canlıda; admin hunisi düzeltmesi (0025)",
    items: [
      "0021 (takım kuralları), 0022 (admin huni) ve 0023 (e-postalar) davranış testleri canlı veritabanında çalıştırıldı, test verisi geri alındı: 0021 ve 0023'ün bütün kontrolleri beklenenle aynı.",
      "0022'de tek sapma: admin olmayan bir kullanıcı admin_funnel'dan boş liste yerine değerleri sıfır olan tek bir 'toplam' satırı alıyordu (grouping sets'in boş kümesi, girdi olmasa da bir satır üretir). Gerçek veri yoktu. Migration 0025 bu satırı da 'having is_admin()' ile süzer; admin sonuçları değişmez.",
      "0022 testine sızıntı kontrolü eklendi (leak=f): admin olmayana dönen satırlarda sıfırdan büyük sayı ya da kanal bilgisi olmamalı.",
    ],
  },
  {
    version: "4.19",
    date: "2026-11-19",
    title: "Haftalık admin özeti: her pazartesi 08:17'de son 7 günün e-postası",
    items: [
      "Her pazartesi 08:17'de (İstanbul) admin hesaplarına son 7 günün özeti gider: yeni kayıt, aktif kullanıcı, üretim ve AI çağrısı (önceki 7 güne göre oklarla), kredi, yeni proje, paylaşım, Pro ilgisi ve abonelikler, takımlar, bilgilendirme e-postaları, kayıt kanalları (Kanallar sayfasıyla aynı etiketler), en çok üretilen proje tipleri ve 'Göz at' listesi (başarısız AI çağrısı, gönderilemeyen e-posta, yeni bildirim, biten abonelik).",
      "Admin → E-postalar → Haftalık admin özeti: canlı önizleme, alıcı sayısı ve 'Özeti şimdi bana gönder' (konu [Test] ile başlar).",
      "Migration 0024: admin_weekly_summary() — yalnız servis rolü çağırabilir (anon/authenticated kapalı). 0024 uygulanmadan özet hazırlanmaz; sayfa uyarı gösterir.",
      "Saatlik cron'a bağlı, ayrı tetikleyici yok; aynı gün aynı kişiye iki kez gitmez (Resend idempotency). RESEND_API_KEY eklenene kadar kapalı; WEEKLY_SUMMARY = off ile ayrıca kapatılır (LIFECYCLE_EMAILS'ten bağımsız).",
    ],
  },
  {
    version: "4.18",
    date: "2026-11-19",
    title: "Herkese açık Yenilikler sayfası (/changelog, /en/changelog) ve RSS akışı",
    items: [
      "Yeni /changelog ve /en/changelog: CHANGELOG girdilerindeki `public` (TR/EN) notlarından üretilir, aya göre gruplu, her sürüme bağlantı (#v4-18). Admin notları (migration, RPC, iç ayrıntılar) gösterilmez; `public` notu olmayan sürümler (yalnız admin/altyapı) listelenmez.",
      "RSS: /changelog/rss.xml ve /en/changelog/rss.xml, sayfalarda <link rel=alternate> ile duyurulur. Sitemap ve hreflang'e eklendi; site alt bilgilerinde ve Studio'daki sürüm rozetinde 'Yenilikler' bağlantısı.",
      "Studio alt bilgisindeki sürüm artık sunucudan geliyor: sürüm notları tarayıcıya giden Studio paketinden çıktı.",
      "Yeni sürüm eklerken: admin notları (title/items) ve public.tr / public.en yaz; yalnız iç değişiklikse public'i yazma.",
    ],
    public: {
      tr: {
        title: "Yenilikler sayfası",
        items: ["Prompt.Monster'daki tüm yenilikler artık bu sayfada, en yenisi en üstte. RSS akışıyla takip edebilirsin."],
      },
      en: {
        title: "What's new page",
        items: ["Everything new in Prompt.Monster now lives on this page, newest first. Follow along with the RSS feed."],
      },
    },
  },
  {
    version: "4.17",
    date: "2026-11-19",
    public: {
      tr: {
        title: "Studio otomatik kaydediyor",
        items: [
          "Giriş yaptıysan Studio'daki değişikliklerin, yazmayı bıraktığın anda kütüphanene kaydedilir; ayrıca Kaydet'e basman gerekmez.",
          "Sağ üstteki durum yazısı ne olduğunu gösterir: Kaydediliyor… / Kaydedildi. Bağlantı koparsa birkaç saniye sonra yeniden denenir.",
          "Studio'yu yeniden açınca kaldığın projeye devam edersin; sekmeyi kapatırken bekleyen değişiklik de kaydedilir.",
        ],
      },
      en: {
        title: "Studio saves automatically",
        items: [
          "When you're signed in, your Studio changes are saved to your library as soon as you stop typing — no need to press Save.",
          "The status at the top right shows where things stand: Saving… / Saved. If the connection drops, it retries a few seconds later.",
          "Reopen Studio and you continue the project you left; closing the tab saves any pending change too.",
        ],
      },
    },
    title: "Studio otomatik kaydetme: giriş yaptıysan işin kendiliğinden kütüphanene kaydedilir",
    items: [
      "Değişikliklerin yazmayı bıraktıktan 2 saniye sonra (sürekli yazarken en geç 10 saniyede bir) kütüphanene kaydedilir; ilk değişiklikte proje kendiliğinden oluşur. Sağ üstte durum görünür: Kaydediliyor… / Kaydedildi / Kaydedilemedi (birkaç saniye sonra yeniden denenir).",
      "Yalnız senin değişikliklerin kaydedilir: adımlar arasında gezinmek, hazır proje tipiyle başlamak, paylaşılan ya da takımdan bir projeyi açmak ve Free plan kısıtlaması tek başına proje oluşturmaz.",
      "Sekmeyi kapatınca ya da başka sekmeye geçince bekleyen değişiklik hemen yazılır. Studio'yu yeniden açınca kaldığın kütüphane projesine devam edersin, kopya oluşmaz; başka yerde silinmiş bir projede çalışıyorsan işin yeni proje olarak saklanır.",
      "Kaydet düğmesi ve her üretimin versiyon olarak saklanması aynen duruyor; tüm kayıtlar tek sırayla yapılır, birbirini ezmez.",
    ],
  },
  {
    version: "4.16",
    date: "2026-11-19",
    public: {
      tr: {
        title: "Giriş e-postaları artık Türkçe ve İngilizce",
        items: [
          "Kayıt doğrulama, sihirli giriş bağlantısı ve şifre sıfırlama e-postaları kaydolduğun dilde ve yeni tasarımla geliyor.",
          "Süresi dolmuş ya da kullanılmış bir bağlantıya tıklarsan, isteği yaptığın dildeki giriş sayfası nedenini söylüyor.",
        ],
      },
      en: {
        title: "Sign-in emails in English and Turkish",
        items: [
          "Sign-up confirmation, magic sign-in link and password reset emails now arrive in the language you signed up in, with a new design.",
          "Click an expired or already-used link and the sign-in page explains why, in the language you used.",
        ],
      },
    },
    title: "Giriş e-postaları Türkçe ve İngilizce: kayıt doğrulama, sihirli bağlantı, şifre sıfırlama",
    items: [
      "Supabase'in gönderdiği altı e-posta (kayıt doğrulama, sihirli bağlantı, şifre sıfırlama, e-posta değişikliği, davet, doğrulama kodu) karşılama e-postalarıyla aynı tasarımda ve iki dilde.",
      "Dil, kişinin kaydolduğu dildir (kayıt formu sayfanın dilini hesaba yazar); bilinmiyorsa Türkçe. Bozuk ya da süresi dolmuş bağlantı kişiyi isteği yaptığı dildeki giriş sayfasına götürür (giriş formu bağlantıya ?lang= ekler).",
      "Bağlantılar sunucu tarafı doğrulama yapan /auth/callback?token_hash=… adresine gider; kişi kaydı nereden başlattıysa (ör. ekip daveti /join/…) oraya döner.",
      "Şablonlar supabase/email-templates/ içinde (src/lib/email/auth-templates.ts'den üretilir); Admin → E-postalar'da önizlemesi var.",
    ],
  },
  {
    version: "4.15",
    date: "2026-11-19",
    public: {
      tr: {
        title: "E-posta tercihleri",
        items: [
          "Hesabım → E-posta: Prompt.Monster'ın bilgilendirme e-postalarını (karşılama ve başlangıç ipuçları) kapatabilir, dillerini seçebilirsin.",
          "Her bilgilendirme e-postasında tek tıkla abonelikten çıkış bağlantısı var. Kampanya ya da reklam e-postası göndermiyoruz.",
        ],
      },
      en: {
        title: "Email preferences",
        items: [
          "Account → Email: turn off Prompt.Monster's informational emails (welcome and getting-started tips) and pick their language.",
          "Every informational email has a one-click unsubscribe link. We don't send promotional emails.",
        ],
      },
    },
    title: "Karşılama ve başlangıç hatırlatması e-postaları (Resend), tek tıkla çıkış",
    items: [
      "Karşılama e-postası: e-postası doğrulanmış yeni hesaba bir kez — girişten hemen sonra (hızlı yol) ya da en geç bir saat içinde (saatlik cron, her saat :17). Başlangıç hatırlatması: 1–7 günlük, hiç proje kaydetmemiş hesaba bir kez; hazır proje tipi bağlantılarıyla Studio'yu önerilen ayarlarla açar.",
      "Türkçe ve İngilizce şablonlar (kayıt dili / giriş sayfasının dili; Hesabım'dan değiştirilebilir). İçerik yalnız kullanım bilgilendirmesi, kampanya içermez; gizlilik metni buna göre güncellendi (2026-11-19).",
      "Çıkış: her e-postada bağlantı (/unsubscribe, onay düğmeli) + Gmail/Yahoo için RFC 8058 tek tık List-Unsubscribe başlığı; Hesabım → E-posta bölümünden aç/kapat ve dil seçimi. Veri indirmeye e-posta tercihi ve gönderim geçmişi eklendi.",
      "Admin → E-postalar: durum, son 30 gün sayıları, sıradakiler, son gönderimler, şablon önizlemeleri, 'kendime test gönder' ve 'şimdi çalıştır'. Sistem sayfasına RESEND_API_KEY kontrolü.",
      "Migration 0023: email_prefs + email_log (RLS açık, politika yok) ve SECURITY DEFINER fonksiyonlar; (kullanıcı × e-posta türü) tekil olduğundan aynı e-posta iki kez gitmez, başarısız gönderim 1 saat arayla en fazla 3 kez denenir. RESEND_API_KEY eklenene kadar hiçbir e-posta gitmez; LIFECYCLE_EMAILS = off duraklatır.",
      "Altyapı: Worker girişi custom-worker.ts (OpenNext fetch işleyicisi + scheduled); wrangler.jsonc'de saatlik cron ve EMAIL_FROM.",
    ],
  },
  {
    version: "4.14",
    date: "2026-11-19",
    title: "Admin → Huni: kayıttan ödemeye kullanıcı yolculuğu, kanal ve gün bazında",
    items: [
      "Yeni Admin → Huni sayfası: seçilen dönemde (7/30/90/365 gün) kaydolanların proje kaydetme, prompt üretme, AI kullanma, paylaşma, Pro ilgisi ve ödeme adımlarına ulaşma oranı; aktivasyon oranı ve kayıttan ilk üretime medyan süre.",
      "Kanal bazında huni (etiketler Kanallar sayfasıyla aynı; yalnız davet linkiyle gelenler 'davet' satırında) ve günlük grafikler: kayıt / prompt üreten kişi, AI çağrısı / paylaşım (Türkiye saatiyle gün).",
      "Migration 0022: admin_funnel ve admin_activity_daily — yalnız okuma, is_admin() ile süzülür, anonim erişim kapalı. 0022 uygulanmadan önce sayfa bir uyarı gösterir.",
    ],
  },
  {
    version: "4.13",
    date: "2026-11-19",
    public: {
      tr: {
        title: "Takım kuralları",
        items: [
          "Takım sahibi ve yöneticiler takımın ortak stack'ini, kod kurallarını ve marka sesini bir kez yazar; üyelerin her master prompt'una ve ajan dosyasına otomatik eklenir.",
          "Kurallar paylaşılan sayfalara ve kayıtlı versiyonlara girmez; istersen proje bazında kapatabilirsin.",
        ],
      },
      en: {
        title: "Team conventions",
        items: [
          "Team owners and admins write the team's shared stack, coding rules and brand voice once; they're added to every member's master prompt and agent files.",
          "Conventions never appear on shared pages or in saved versions, and you can switch them off per project.",
        ],
      },
    },
    title: "Takım kuralları: takımın ortak stack'i, kod kuralları ve marka sesi her master prompt'a eklenir",
    items: [
      "Hesabım → Takım kuralları: sahip/yönetici takımın stack ve altyapısını, kod kurallarını ve marka sesini yazar (1.500 / 3.000 / 1.500 karakter); 'Üyelerin prompt'larına ekle' ile açıp kapatır. Üyeler salt okunur görür. Takım beklemedeyken hazırlanabilir, aktifken geçerli olur.",
      "Studio: aktif takım üyelerinin master prompt'larına 'TAKIM KURALLARI / TEAM CONVENTIONS' bölümü eklenir — Mega Chain'de başlıktan hemen sonra bir kez, tek uzman prompt'larında bağlamdan sonra; CLAUDE.md, AGENTS.md, .cursor/rules, Copilot ve Task Master dosyalarında da. Çıktı panelindeki düğmeyle proje bazında kapatılabilir (projeyle kaydedilir).",
      "API ve MCP: anahtar sahibinin aktif takım kuralları generate_build_prompt / export_files / POST /api/v1/generate çıktısına eklenir ve yanıtta not olarak belirtilir.",
      "Gizlilik: takım kuralları kayıtlı versiyonlara ve paylaşım sayfalarına eklenmez (kayıtta state'ten ayıklanır). Migration 0021: teams.rules_* sütunları, my_team_rules / set_team_rules (yetki kontrollü) ve yalnız servis rolüne açık team_rules_for. 0021 uygulanmadan önce özellik görünmez.",
    ],
  },
  {
    version: "4.12",
    date: "2026-11-19",
    public: {
      tr: {
        title: "Daha erişilebilir, paylaşırken daha güzel",
        items: [
          "Paylaştığın bağlantılar sosyal medyada ve mesajlaşma uygulamalarında sayfaya özel başlık ve önizleme görseliyle görünüyor.",
          "Erişilebilirlik iyileştirmeleri: daha okunaklı kontrast, klavyeyle gezinme ve ekran okuyucu etiketleri.",
          "Telefonda Studio üst çubuğu taşmıyor; siteyi ana ekrana uygulama gibi ekleyebilirsin.",
        ],
      },
      en: {
        title: "More accessible, nicer to share",
        items: [
          "Links you share now show a page-specific title and preview image on social media and in chat apps.",
          "Accessibility improvements: more readable contrast, keyboard navigation and screen reader labels.",
          "Studio's top bar no longer overflows on phones, and you can add the site to your home screen like an app.",
        ],
      },
    },
    title: "Lansman kalite turu: bağlantı önizlemeleri, erişilebilirlik, SEO, güvenlik başlıkları",
    items: [
      "Bağlantı önizlemeleri: her sayfada 1200×630 önizleme görseli (TR ve EN ayrı, public/og/), og:url artık sayfanın kendi adresi (önceden birçok sayfa ana sayfayı gösteriyordu); Studio, Keşfet, lider tablosu, tip/uzman ve profil sayfalarına sayfaya özel başlık/açıklama.",
      "SEO: başlık ve açıklama etiketleri her ziyaretçide <head> içinde (htmlLimitedBots); Keşfet başlıklarında çift 'Prompt.Monster' ve emoji kaldırıldı; ana sayfalara schema.org (Organization, WebSite, SoftwareApplication + Free/Pro fiyatları); /en sayfaları ilk HTML'den itibaren lang=\"en\".",
      "Erişilebilirlik (WCAG AA): ikincil metin renkleri (zinc-500/600) ve mor etiketler 4.5:1 kontrasta çekildi; ana sayfa ve 404'te <main>; Studio'da h1 ve ikon düğmesine erişilebilir ad; Keşfet filtrelerine etiket; kaydırılabilir kod/ tablo alanları klavyeyle odaklanabilir; metin içi bağlantılar altı çizili; dil düğmesi ve menü işaretleri düzeltildi. Lighthouse erişilebilirlik puanı 90–96 → 100.",
      "Mobil: Studio üst çubuğu 390 px telefonlarda yatay kaymaya yol açmıyor. Simgeler: favicon.ico, apple-touch-icon, 192/512 PNG ve /manifest.webmanifest (ana ekrana ekleme). Güvenlik: Strict-Transport-Security ve Permissions-Policy başlıkları; statik görseller middleware'den geçmiyor.",
    ],
  },
  {
    version: "4.11",
    date: "2026-11-19",
    public: {
      tr: {
        title: "Takım kütüphanesi",
        items: [
          "Projelerim'den bir projeyi takımınla paylaşabilirsin; takım arkadaşların onun kendi kopyasını Studio'da açar, orijinal değişmez.",
        ],
      },
      en: {
        title: "Team library",
        items: [
          "Share a project with your team from My projects; teammates open their own copy in Studio and the original stays untouched.",
        ],
      },
    },
    title: "Takım kütüphanesi: projeyi takımla paylaş, takımın paylaştıklarının kopyasını aç",
    items: [
      "Projelerim: aktif bir takımdaysan her projede 'Takımla paylaş' düğmesi; altta 'Takım kütüphanesi' bölümü — üyelerin paylaştığı projeler (kim paylaştı, tip, versiyon sayısı).",
      "'Kopyasını aç' projeyi Studio'da senin kaydedilmemiş kopyan olarak açar (?teamProject=<id>); kaydedince kendi projelerine eklenir, orijinal değişmez. Kendi paylaştığın proje normal şekilde açılır.",
      "Migration 0020: team_projects tablosu (RLS açık, erişim yalnız RPC'lerle), set_project_team_share / my_team_shared_projects / team_library / team_project; yalnız proje sahibi ve yalnız kendi aktif takımına paylaşır; üye takımdan çıkınca paylaştıkları otomatik kalkar; projects tablosuna ve updated_at'e dokunulmaz.",
      "Hesabım → Takım: aktif takımda 'Takım kütüphanesi →' bağlantısı. 0020 uygulanmadan önce bu özellikler görünmez.",
    ],
  },
  {
    version: "4.10",
    date: "2026-11-19",
    public: {
      tr: {
        title: "Girdi Koçu",
        items: [
          "Studio'nun ilk adımında fikrini 0–100 arası puanlayan bir kontrol listesi: ad, pitch, açıklama, hedef kitle, rakipler ve fark yaratan özellik için somut ipuçları.",
          "Tek tıkla örnek fikirlerle iyi bir girdinin nasıl göründüğünü gör. Puanlama tarayıcında çalışır, AI kredisi harcamaz.",
        ],
      },
      en: {
        title: "Input Coach",
        items: [
          "A checklist on Studio's first step scores your idea from 0 to 100, with concrete tips for the name, pitch, description, audience, competitors and USP.",
          "Load an example idea in one click to see what a strong input looks like. Scoring runs in your browser and uses no AI credits.",
        ],
      },
    },
    title: "Girdi Koçu: Studio'nun ilk adımında içerik kontrol listesi ve örnek fikirler",
    items: [
      "Studio → Fikir & Vizyon: yeni Girdi Koçu kartı. 0–100 'Girdi Kalitesi' skoru ve 6 maddelik ağırlıklı kontrol listesi (proje adı 10, pitch 25, açıklama 20, hedef kitle 20, rakipler 10, USP 15); her madde için somut ipucu (klişe pitch, genel USP, eksik acı noktası gibi). Üstteki 'Quality' göstergesi değişmedi.",
      "Tek tıkla örnek fikir: StudioFlow, ShipDeck, Nestegg — adım 1'i (ad, pitch, açıklama, hedef kitle, rakipler, USP, proje tipi, gelir modeli) doldurur; kendi girdilerin varsa önce onay ister. TR ve EN (/en/studio) ayrı metinlerle.",
      "Kart 'Gizle' ile daraltılabilir; tercih tarayıcıda hatırlanır. Skorlama yerel ve ücretsiz — AI kredisi harcamaz, hiçbir şey sunucuya gitmez.",
      "Paylaşımlar: migration 0019 (get_shared_v2, admin_shares_v2) — paylaşım sayfasında çatal sayısı ve Admin → Paylaşımlar'da galeri/öne çıkar/gizle durumu artık doğru geliyor (0010'un DROP gerektiren kalan kısmı, DROP'suz). Uygulama 0019 yoksa eski fonksiyonlara düşer.",
    ],
  },
  {
    version: "4.9.1",
    date: "2026-11-19",
    title: "Otomatik deploy açıldı, admin rolü düzeltmesi, RPC sertleştirmesi",
    items: [
      "GitHub Actions artık main'e her push'ta Cloudflare'e otomatik deploy ediyor (CLOUDFLARE_API_TOKEN eklendi).",
      "Admin paneli: veritabanı sahibi admin olarak tanımıyorsa (profiles.role ≠ 'admin') her admin sayfasının üstünde uyarı ve tek satırlık düzeltme SQL'i çıkar. Migration 0018 sahip hesabının rolünü düzeltir; önceden istatistikler boş görünüyor, takım aktivasyonu 'forbidden' veriyordu.",
      "Migration 0018: giriş gerektiren SECURITY DEFINER RPC'lerden (takım, admin, kredi, beğeni, kullanıcı adı) anon yetkisi kaldırıldı; touch_updated_at ve _slugify için search_path sabitlendi (Supabase güvenlik uyarıları).",
      "Takım planı, bonus kredi cüzdanı ve arkadaşını getir ödülü canlı veritabanında uçtan uca test edildi (60+ senaryo, test verisi geri alındı).",
    ],
  },
  {
    version: "4.9",
    date: "2026-11-17",
    public: {
      tr: {
        title: "Takımlar, Arkadaşını getir ve büyüyen Keşfet",
        items: [
          "Takım planı (erken erişim): takım kur, davet linkiyle üye ekle; takım aktif olunca tüm üyeler Pro özelliklerini kullanır.",
          "Arkadaşını getir: davet linkinle gelen arkadaşın ilk AI işlemini yapınca ikinize de bonus AI kredisi.",
          "Keşfet: beğeniler, haftalık ve aylık Usta Canavarlar lider tablosu, herkese açık profil sayfaları; proje tipi, uzman ve çıktı formatına göre filtreler.",
          "Ana sayfada topluluktan canlı başlangıç kitleri ve kullanım sayaçları.",
        ],
      },
      en: {
        title: "Teams, Invite a friend and a bigger Explore",
        items: [
          "Team plan (early access): create a team and add members with an invite link; once the team is active, every member gets the Pro features.",
          "Invite a friend: when someone who joined through your link makes their first AI request, you both get bonus AI credits.",
          "Explore: likes, weekly and monthly Master Monsters leaderboards, public profile pages, and filters by project type, expert and output format.",
          "Live starter kits from the community and usage counters on the home page.",
        ],
      },
    },
    title: "Takım planı, Arkadaşını getir, Keşfet büyümesi (beğeni, profiller, filtreler) ve canlı sayaçlar",
    items: [
      "Takım planı: Hesabım → Takım bölümünden takım kur, davet linkiyle üye ekle (tek kullanımlık, 14 gün; /join/<token>), sahip/yönetici rolleri, sahiplik devri, üye başına aylık kredi. Takım aktif olunca tüm üyeler Pro (Studio, kota, API, MCP aynı kaynaktan: effective_plan). Admin → Takımlar: aktifleştir / beklemeye al / iptal / koltuk / not. Koltuk bazlı Lemon Squeezy ödemesi LS aktivasyonuna bırakıldı.",
      "Arkadaşını getir: herkesin davet linki ?invite=<kullanıcı adı>; davet edilen ilk AI eylemini yapınca iki tarafa bonus kredi. Bonus artık normal kota bitince harcanan bir bakiye (süresi dolmaz, başarısız çağrıda iade edilir); davet eden için ödül tavanı var.",
      "Keşfet: beğeni + haftalık/aylık 'Usta Canavarlar' lider tablosu, herkese açık profil sayfaları (/u/<kullanıcı adı>), proje tipi / uzman SEO sayfaları, çıktı formatı filtresi.",
      "Ana sayfa: topluluktan canlı başlangıç kitleri ve canlı kullanım sayaçları (sayaçlar 50 üretimin altında gizli kalır).",
      "Repo'da ayrıca: tarayıcı eklentisi (extension/) ve Raycast eklentisi (raycast-extension/) — site deploy'undan bağımsız.",
    ],
    settings: ["team_default_seats", "referral_bonus_credits", "referral_max_rewards"],
  },
  {
    version: "4.8",
    date: "2026-11-16",
    public: {
      tr: {
        title: "Keşfet galerisi",
        items: [
          "Topluluğun paylaştığı prompt'ların herkese açık galerisi: dile ve proje tipine göre filtrele; yeni, popüler ya da en çok çatallananlara göre sırala.",
          "Paylaştığın prompt'u galeride göstermek tamamen isteğe bağlı, varsayılan olarak kapalı.",
          "Paylaşım sayfalarından prompt'u doğrudan Claude Code ya da Cursor'da açabilir, uygunsuz içeriği tek tıkla bildirebilirsin.",
        ],
      },
      en: {
        title: "Explore gallery",
        items: [
          "A public gallery of prompts shared by the community: filter by language and project type, sort by new, popular or most forked.",
          "Showing your shared prompt in the gallery is entirely optional and off by default.",
          "Open a shared prompt straight in Claude Code or Cursor, and report inappropriate content in one click.",
        ],
      },
    },
    title: "Keşfet galerisi, AI araç bağlantıları, bildirim sistemi",
    items: [
      "/explore (/en/explore): topluluğun paylaştığı promptların herkese açık galerisi — dil/tip filtresi, yeni/popüler/çok çatallanan sıralaması, 'daha fazla yükle'. Paylaşım sayfasında sahibine 'Galeride göster' anahtarı (varsayılan kapalı, tamamen isteğe bağlı).",
      "Paylaşım sayfasına Claude Code ve Cursor'da doğrudan aç bağlantıları eklendi (prompt_url / deeplink); /p/<slug>/raw düz metin uç noktası.",
      "Çatal sayacı: 'Studio'da çatalla' her yüklendiğinde artar; paylaşım sayfası ve admin panelinde görünür.",
      "Admin → Paylaşımlar: galeride öne çıkar / gizle / kaldır butonları, galeri durumu rozeti; kullanıcıların gönderdiği kısa bildirimler (uygunsuz içerik vb.) ayrı bir tabloda listelenir.",
      "Paylaşım sayfasında 'Uygunsuz içerik mi? Bildir' bağlantısı — kayıt gerektirmez.",
    ],
  },
  {
    version: "4.7",
    date: "2026-09-27",
    public: {
      tr: {
        title: "Hesabım: verilerini indir, hesabını sil",
        items: [
          "Yeni Hesabım sayfası: planın, AI kredilerin ve proje, versiyon, paylaşım sayıların tek yerde.",
          "Tüm verilerini tek dosyada indirebilir ya da hesabını kalıcı olarak silebilirsin (KVKK / GDPR).",
          "Stack listesi güncellendi (Next.js 16, Astro 6, Nuxt 4, Claude Opus 5.5 / Sonnet 5, GPT-6, Gemini 3.1 Pro…); eski projelerdeki eski adlar kendiliğinden yenilenir.",
        ],
      },
      en: {
        title: "Account: download your data, delete your account",
        items: [
          "A new Account page shows your plan, AI credits and project, version and share counts in one place.",
          "Download all your data in a single file or delete your account permanently (GDPR).",
          "Refreshed stack list (Next.js 16, Astro 6, Nuxt 4, Claude Opus 5.5 / Sonnet 5, GPT-6, Gemini 3.1 Pro…); old names in existing projects are updated automatically.",
        ],
      },
    },
    title: "Hesabım sayfası (verilerimi indir, hesabımı sil) ve güncel stack listesi",
    items: [
      "Yeni /account (/en/account): plan ve abonelik, günlük/aylık AI kredisi, proje/versiyon/paylaşım/anahtar sayıları, kısayollar. Studio kullanıcı menüsünde 'Hesabım'.",
      "Verilerimi indir: profil, projeler, tüm versiyonlar, paylaşımlar, abonelik, API anahtarı özetleri ve AI kullanım kayıtları tek JSON dosyasında (KVKK md. 11 / GDPR md. 15 ve 20).",
      "Hesabımı sil: 'SİL' / 'DELETE' onayıyla kalıcı silme; aktif Lemon Squeezy aboneliği önce iptal edilir, AI kullanım kayıtları anonim kalır. Admin hesapları buradan silinemez. Silinmiş hesaba gelen abonelik webhook'u artık 200 ile yok sayılıyor.",
      "Stack listesi Eylül 2026'ya göre yenilendi: Next.js 16, React Router v7, Astro 6, Nuxt 4, TanStack Start, Laravel 13, Convex, Better Auth, Claude Opus 5.5 / Sonnet 5 / Haiku 4.5, OpenAI GPT-6, Gemini 3.1 Pro, Vercel AI SDK. Eski adlar (Next.js 15, Claude 3.5 Sonnet, GPT-4o, Lucia…) kayıtlı projelerde, çatallarda, API girdisinde ve katalogda otomatik olarak yenisine çevrilir.",
      "Kullanım koşulları ve gizlilik politikası: hesap kapatma ve veri indirme artık Hesabım sayfasından yapılabiliyor.",
    ],
  },
  {
    version: "4.6",
    date: "2026-09-27",
    public: {
      tr: {
        title: "İngilizce şablonlarda ödeme seçenekleri",
        items: [
          "İngilizce proje tipi şablonları artık Türkiye'ye özel ödeme yöntemlerini (Iyzico, PayTR, e-Fatura) önceden seçmiyor; Stripe varsayılan.",
        ],
      },
      en: {
        title: "Payment presets in English templates",
        items: [
          "English project-type templates no longer preselect Turkey-only payment providers (Iyzico, PayTR, e-invoice); Stripe is the default.",
        ],
      },
    },
    title: "İngilizce hızlı başlangıçta Türkiye'ye özel ödeme seçenekleri kapalı",
    items: [
      "İngilizce Studio'da proje tipiyle hızlı başlangıç (?type=), /en/prompt sayfaları, API ve MCP artık Iyzico, PayTR ve e-Fatura'yı önceden seçmiyor; Stripe varsayılan kalıyor. Türkçe tarafta değişiklik yok.",
      "GET /api/v1/types/{id} için yeni ?lang=TR|EN parametresi (varsayılan EN); MCP get_type_preset İngilizce hazır ayarı döner.",
    ],
  },
  {
    version: "4.5",
    date: "2026-09-26",
    public: {
      tr: {
        title: "18 uzman, 28 proje tipi, ajan dosyaları",
        items: [
          "6 yeni uzman (AI Ajan Mimarı, Otomasyon Mühendisi, Motion & 3D Tasarımcı, Performans Pazarlamacısı, Lansman & Topluluk Yöneticisi, Mobil & ASO Uzmanı) ve 6 yeni proje tipi (AI ajan sistemi, n8n otomasyonu, WordPress sitesi, açılış sayfası, mobil uygulama, şirket içi araç).",
          "Her prompt bir öz-kontrol listesiyle ve \"çıktını test et, düzelt\" adımıyla bitiyor.",
          "Kodlama ajanı dosyaları (Pro): AGENTS.md, CLAUDE.md, uzman başına alt ajanlar, Cursor kuralları, Copilot talimatları ve Task Master PRD — tek tek ya da tek .zip.",
        ],
      },
      en: {
        title: "18 experts, 28 project types, agent files",
        items: [
          "6 new experts (AI Agent Architect, Automation Engineer, Motion & 3D Designer, Performance Marketer, Launch & Community Manager, Mobile & ASO Specialist) and 6 new project types (AI agent system, n8n automation, WordPress site, landing page, mobile app, internal tool).",
          "Every prompt now ends with a self-check list and a \"test your output and fix it\" step.",
          "Coding agent files (Pro): AGENTS.md, CLAUDE.md, a subagent per expert, Cursor rules, Copilot instructions and a Task Master PRD — one by one or as a single .zip.",
        ],
      },
    },
    title: "18 uzman, 28 proje tipi, ajan dosyaları, kendini doğrula, admin kataloğu",
    items: [
      "6 yeni uzman: AI Ajan Mimarı, Otomasyon Mühendisi, Motion & 3D Tasarımcı, Performans Pazarlamacısı, Lansman & Topluluk Yöneticisi, Mobil & ASO Uzmanı (Pro: 18 uzmanın hepsi).",
      "6 yeni proje tipi (TR + EN SEO sayfalarıyla): Otonom AI ajan sistemi, n8n otomasyon akışı, WordPress / Elementor sitesi, Açılış sayfası / portfolyo, Mobil uygulama (iOS/Android), Şirket içi araç / admin paneli. Yeni kategoriler: AI & AUTOMATION, WEB & MOBILE.",
      "Yeni stack seçenekleri (Claude Sonnet 5, Claude Agent SDK, MCP Servers, WordPress, MySQL, n8n, Expo EAS) ve 12 yeni özellik (ajan hafızası/MCP, zamanlanmış işler, insan onayı, CMS, push, çevrimdışı mod, uygulama içi satın alma…).",
      "Kendini doğrula: her uzman prompt'u bir öz-kontrol listesiyle, her master prompt 'kendi çıktını test et ve düzelt' adımıyla biter (testler, Playwright ekran görüntüsü, Lighthouse ≥ 90, rapor).",
      "Studio Export: kodlama ajanı dosyaları (Pro) — AGENTS.md, CLAUDE.md, .claude/agents (uzman başına alt ajan), .cursor/rules, .cursorrules, Copilot talimatları, Task Master PRD, JSON; tek tek ya da tek .zip.",
      "Admin → Katalog: deploy gerekmeden yeni uzman / proje tipi ekle, yerleşik olanların metnini ve hazır ayarlarını düzenle, gizle ya da varsayılana döndür. Studio, API, MCP, /prompt sayfaları ve sitemap katalogu ~1 dakikada alır.",
    ],
  },
  {
    version: "4.4",
    date: "2026-09-26",
    public: {
      tr: {
        title: "API ve MCP sunucusu",
        items: [
          "Prompt.Monster artık editörünün içinde: MCP sunucusuyla Claude Code, Cursor, VS Code, Windsurf ve Claude Desktop'tan master build prompt'u ve proje dosyaları üret.",
          "REST API ve OpenAPI şeması (ChatGPT GPT Actions ile uyumlu). API anahtarını Hesabım → API ve MCP'den oluşturursun; anahtarsız kullanım da Free sınırlarıyla çalışır.",
        ],
      },
      en: {
        title: "API and MCP server",
        items: [
          "Prompt.Monster now lives in your editor: generate master build prompts and project files from Claude Code, Cursor, VS Code, Windsurf and Claude Desktop with the MCP server.",
          "A REST API with an OpenAPI schema (works with ChatGPT GPT Actions). Create API keys under Account → API & MCP; it also works without a key within the Free limits.",
        ],
      },
    },
    title: "Public API + MCP sunucusu — Prompt.Monster editörlerin içinde",
    items: [
      "MCP sunucusu (/api/mcp, Streamable HTTP): Claude Code, Cursor, VS Code, Windsurf, Claude Desktop. Araçlar: generate_build_prompt, list_project_types, get_type_preset, list_experts, export_files (Pro), get_shared_prompt, refine_prompt (kredi). Claude Code'da /mcp__prompt-monster__new_project komutu.",
      "REST API (/api/v1): types, types/{id}, generate, refine, shared/{slug} + OpenAPI 3.1 şeması (ChatGPT GPT Actions ile uyumlu).",
      "Kullanıcı API anahtarları: /account/api (en fazla 5 aktif; anahtar bir kez gösterilir, yalnız özeti saklanır; iptal edilebilir). Studio menüsünde 'API ve MCP'.",
      "Pro proje dosyaları (API/MCP): AGENTS.md, CLAUDE.md, .claude/agents/*.md (uzman başına alt ajan), .cursor/rules/*.mdc, .cursorrules, .github/copilot-instructions.md, Task Master prd.txt, prompt-monster.json.",
      "Anahtarsız kullanım Free sınırlarıyla çalışır (3 uzman, 2 format). Hız sınırı: anahtarla 30/dk, anahtarsız 10/dk — Ayarlar → Entegrasyon.",
      "Yeni admin sayfası: API ve MCP (günlük çağrılar, uç nokta/araç dağılımı, kaynağa göre AI kredisi, tüm anahtarlar).",
      "Herkese açık geliştirici sayfası: /developers ve /en/developers; llms.txt API/MCP bölümüyle güncellendi.",
    ],
    settings: ["api_enabled", "mcp_enabled", "api_rate_per_minute", "api_anon_rate_per_minute"],
  },
  {
    version: "4.3",
    date: "2026-09-26",
    public: {
      tr: {
        title: "İngilizce arayüz",
        items: [
          "Sitenin ve Studio'nun tamamı artık İngilizce de var (/en); İngilizce Studio İngilizce örnek projeyle ve İngilizce çıktıyla açılır.",
          "TR/EN düğmesi seçimini hatırlar.",
        ],
      },
      en: {
        title: "English interface",
        items: [
          "The whole site and Studio are now available in English (/en); English Studio opens with an English sample project and English output.",
          "The TR/EN switch remembers your choice.",
        ],
      },
    },
    title: "İngilizce arayüz (/en) — Product Hunt'a hazırlık",
    items: [
      "Tüm herkese açık sayfaların İngilizcesi: /en (ana sayfa), /en/studio, /en/pricing, /en/docs, /en/prompt + 22 proje tipi sayfası, /en/login, /en/library, /en/legal/*.",
      "Studio tamamen iki dilli (146 metin); İngilizce Studio İngilizce örnek projeyle ve EN çıktı diliyle açılır.",
      "Uzman görevlerinin İngilizcesi eklendi: EN çıktıda artık Türkçe görev metni yok. EN çıktı + Türkçe girdi için uyarı.",
      "Dil düğmesi (TR/EN) seçimi hatırlar; İngilizce seçen ziyaretçi Türkçe bağlantılardan İngilizce sayfaya yönlenir. Türkçe olmayan tarayıcılara 'English' önerisi.",
      "hreflang (tr/en/x-default), İngilizce sitemap girdileri, İngilizce meta açıklamaları.",
      "Duyuru şeridinin İngilizcesi için yeni ayar: announcement_en.",
    ],
    settings: ["announcement_en"],
  },
  {
    version: "4.2",
    date: "2026-09-26",
    public: {
      tr: {
        title: "AI kredileri",
        items: [
          "AI işlemleri kredi kullanır: açıklamayı güçlendirme ve stack önerisi 1, prompt iyileştirme 3 kredi. Prompt üretimi ücretsiz ve sınırsız.",
          "Başarısız bir AI çağrısında kredin iade edilir.",
        ],
      },
      en: {
        title: "AI credits",
        items: [
          "AI actions use credits: Enhance and stack suggestions cost 1, prompt refinement 3. Generating prompts is free and unlimited.",
          "If an AI request fails, your credits are refunded.",
        ],
      },
    },
    title: "Kredi sistemi, gerçek maliyet takibi, kanal/indirim bağlantıları, güvenlik düzeltmesi",
    items: [
      "GÜVENLİK: kullanıcılar kendi profilinde plan/rol alanını değiştiremez (0006_security.sql; RLS + tetikleyici).",
      "Kredi sistemi: enhance 1, stack 1, iyileştir 3 kredi. Ziyaretçi günde 3, Free günde 5, Pro ayda 1.000 (günde ≤150) — hepsi Ayarlar → Krediler'den.",
      "Plana göre model: Free/ziyaretçi Claude Haiku 4.5, Pro Claude Sonnet 5 (Ayarlar → AI). Model kalkarsa otomatik Sonnet 5'e düşer.",
      "Her AI çağrısının gerçek token sayısı ve modeli kaydedilir; Kullanım sayfası gerçek maliyeti gösterir. Başarısız çağrıda kredi iade edilir.",
      "?code=KOD bağlantıları: kod 30 gün saklanır ve Lemon Squeezy ödemesine otomatik uygulanır; lansman kuponu ayarı da otomatik uygulanır.",
      "Kanal takibi: utm_source / ref / dış site ilk ziyarette kaydedilir, kayıtta profile yazılır. Yeni admin sayfası: Kanallar (+ kampanya bağlantısı oluşturucu).",
      "Fiyat sayfası ayarlardan beslenir (krediler, model, kupon), İngilizce metinleri hazır.",
    ],
    settings: ["free_credits_per_day", "pro_credits_per_month", "credit_cost_refine", "ai_model_free", "ai_model_pro", "launch_coupon"],
  },
  {
    version: "4.1",
    date: "2026-09-26",
    public: {
      tr: {
        title: "Yasal sayfalar ve çerez izni",
        items: [
          "Kullanım koşulları, gizlilik (KVKK aydınlatma), çerez ve iade politikaları Türkçe ve İngilizce.",
          "Analitik ve reklam çerezleri yalnızca izin verirsen yüklenir; tercihini istediğin zaman değiştirebilirsin.",
        ],
      },
      en: {
        title: "Legal pages and cookie consent",
        items: [
          "Terms of use, privacy, cookie and refund policies in English and Turkish.",
          "Analytics and advertising cookies load only if you allow them, and you can change your choice any time.",
        ],
      },
    },
    title: "Yasal sayfalar, çerez izni, İngilizce altyapısı",
    items: [
      "/legal/terms, /legal/privacy (KVKK aydınlatma), /legal/cookies, /legal/refund — Türkçe + İngilizce (/en/legal/…).",
      "İşletmeci adı, e-posta, adres ve vergi bilgisi admin ayarlarından (Yasal grubu) değiştirilebilir; sayfalara otomatik yansır.",
      "Çerez bandı: GA4 / Google Ads / Meta Pixel yalnızca izin verilirse yüklenir (Consent Mode v2). Etiket tanımlı değilse bant görünmez.",
      "Dönüşüm olayları izin kategorisine göre gönderilir (analitik ↔ reklam).",
      "Tüm alt bilgilere ve giriş formuna yasal bağlantılar eklendi; fiyat sayfasına güvenli ödeme + 14 gün iade notu.",
      "i18n altyapısı: /en yolları, dil düğmesi (yalnızca İngilizcesi olan sayfalarda görünür), pm_lang çerezi.",
    ],
    settings: ["legal_name", "legal_email", "legal_address", "legal_registry"],
  },
  {
    version: "4.0",
    date: "2026-09-26",
    public: {
      tr: {
        title: "Rehber ve llms.txt",
        items: [
          "Studio'ya iyi içerik girmenin rehberi (Rehber sayfası) ve AI ajanları için llms.txt.",
        ],
      },
      en: {
        title: "Guide and llms.txt",
        items: [
          "A guide to getting the most out of Studio, plus llms.txt for AI agents.",
        ],
      },
    },
    title: "Admin paneli, çalışma zamanı ayarları, dokümantasyon",
    items: [
      "/admin: genel bakış KPI'ları, kullanıcılar (plan/rol/ban), abonelikler, kullanım grafikleri, paylaşım moderasyonu, ayarlar, sistem.",
      "Ayarlar veritabanından okunur: AI kill switch, model, günlük/aylık kotalar, bakım modu, duyuru şeridi, lansman kuponu.",
      "Kota fonksiyonları (consume_ai_call) artık admin ayarlarını kullanır; Pro için aylık tavan eklendi.",
      "/docs: Studio'ya içerik girme rehberi + /llms.txt (AI ajanları için).",
      "Analitik: GA4 / Google Ads / Meta Pixel etiketleri ortam değişkeniyle açılır; dönüşüm olayları (sign_up, generate, begin_checkout, purchase).",
      "Siteden GitHub bağlantıları kaldırıldı.",
    ],
    settings: ["maintenance_mode", "ai_enabled", "ai_model", "pro_ai_per_month", "announcement", "launch_coupon"],
  },
  {
    version: "3.2",
    date: "2026-09-26",
    public: {
      tr: {
        title: "Free ve Pro planları, proje tipi sayfaları",
        items: [
          "Free: 3 uzman ve 2 çıktı formatı. Pro: tüm uzmanlar, Mega Chain, 5 format ve Export to Builders.",
          "Her proje tipi için bir başlangıç sayfası: Studio'yu o tipin uzmanları, stack'i ve özellikleriyle açar.",
        ],
      },
      en: {
        title: "Free and Pro plans, project type pages",
        items: [
          "Free: 3 experts and 2 output formats. Pro: every expert, Mega Chain, 5 formats and Export to Builders.",
          "A starter page for every project type that opens Studio with that type's experts, stack and features.",
        ],
      },
    },
    title: "Monster Pro, Free/Pro ayrımı, programmatic SEO",
    items: [
      "Lemon Squeezy ile $29/ay – $290/yıl abonelik; webhook ile plan güncellemesi; müşteri portalı.",
      "Free: 3 uzman + 2 format; Pro: 12 uzman, Mega Chain, 5 format, Export to Builders.",
      "22 proje tipi için /prompt/<slug> landing sayfaları ve /prompt hub'ı; Studio ?type= hızlı başlangıç.",
    ],
  },
  {
    version: "3.1",
    date: "2026-09-25",
    public: {
      tr: {
        title: "Paylaşılabilir prompt sayfaları",
        items: [
          "Her versiyonu herkese açık bir sayfa olarak paylaş; başkaları kopyalayabilir, indirebilir ya da Studio'da çatallayabilir.",
          "Şifre sıfırlama eklendi.",
        ],
      },
      en: {
        title: "Shareable prompt pages",
        items: [
          "Share any version as a public page; others can copy it, download it or fork it in Studio.",
          "Password reset added.",
        ],
      },
    },
    title: "Paylaşılabilir prompt sayfaları",
    items: ["/p/<slug> herkese açık sayfa, çatallama, sitemap, Open Graph.", "Şifre sıfırlama ve hesap sayfası."],
  },
  {
    version: "2.0",
    date: "2026-09-24",
    public: {
      tr: {
        title: "Hesaplar ve kütüphane",
        items: [
          "E-posta ve şifreyle ya da sihirli bağlantıyla giriş; projelerin kütüphanende, her üretim bir versiyon olarak saklanıyor.",
        ],
      },
      en: {
        title: "Accounts and library",
        items: [
          "Sign in with email and password or a magic link; your projects live in your library and every generation is kept as a version.",
        ],
      },
    },
    title: "Hesaplar ve kütüphane",
    items: ["Supabase Auth, proje kütüphanesi, versiyon geçmişi, hesaba bağlı günlük AI hakkı, Resend SMTP."],
  },
];
