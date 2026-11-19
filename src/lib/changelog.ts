/**
 * Product changelog — shown in /admin/system so every deploy's changes are visible in the panel.
 * Add an entry at the top with each release (newest first).
 */
export interface ChangelogEntry {
  version: string;
  date: string; // ISO
  title: string;
  items: string[];
  /** Setting keys introduced with this release (rendered as quick links in the panel). */
  settings?: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
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
    title: "İngilizce hızlı başlangıçta Türkiye'ye özel ödeme seçenekleri kapalı",
    items: [
      "İngilizce Studio'da proje tipiyle hızlı başlangıç (?type=), /en/prompt sayfaları, API ve MCP artık Iyzico, PayTR ve e-Fatura'yı önceden seçmiyor; Stripe varsayılan kalıyor. Türkçe tarafta değişiklik yok.",
      "GET /api/v1/types/{id} için yeni ?lang=TR|EN parametresi (varsayılan EN); MCP get_type_preset İngilizce hazır ayarı döner.",
    ],
  },
  {
    version: "4.5",
    date: "2026-09-26",
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
    title: "Paylaşılabilir prompt sayfaları",
    items: ["/p/<slug> herkese açık sayfa, çatallama, sitemap, Open Graph.", "Şifre sıfırlama ve hesap sayfası."],
  },
  {
    version: "2.0",
    date: "2026-09-24",
    title: "Hesaplar ve kütüphane",
    items: ["Supabase Auth, proje kütüphanesi, versiyon geçmişi, hesaba bağlı günlük AI hakkı, Resend SMTP."],
  },
];
