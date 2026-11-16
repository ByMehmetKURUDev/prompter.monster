/**
 * "Bu projeyi aç" bağlantıları: paylaşılan prompt'u doğrudan bir AI kodlama aracında başlatır.
 * Claude Code: prompt_url ile uzak bir düz-metin URL'sini okur (bkz. /p/[slug]/raw) — boyut sınırı yok.
 * Cursor: metni doğrudan query string'e kodlar; link ~10k karakter üstünde çalışmaz, o yüzden kontrol edilir.
 */

export const TOOL_HOME = {
  claudeCode: "https://claude.ai/code",
  cursor: "https://cursor.com",
} as const;

const CURSOR_LINK_LIMIT = 10_000;

/** Claude Code: açılışta bu URL'deki düz metni prompt olarak yükler. */
export function claudeCodeUrl(promptRawUrl: string): string {
  return `${TOOL_HOME.claudeCode}?prompt_url=${encodeURIComponent(promptRawUrl)}`;
}

/** Cursor deeplink: metin query string'e gömülür (kısa promptlar için). null = metin çok uzun; kopyala/yapıştıra düş. */
export function cursorPromptUrl(text: string): string | null {
  const encoded = encodeURIComponent(text);
  if (encoded.length > CURSOR_LINK_LIMIT) return null;
  return `${TOOL_HOME.cursor}/link/prompt?text=${encoded}`;
}

/** Share sayfası için takma ad: metne göre deeplink ya da null. */
export function cursorLinkFor(output: string): string | null {
  return cursorPromptUrl(output);
}
