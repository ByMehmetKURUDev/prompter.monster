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
