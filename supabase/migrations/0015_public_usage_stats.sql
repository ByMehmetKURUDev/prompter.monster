-- Prompt.Monster — Faz 6c (devam): Ana sayfada canlı kullanım sayaçları
-- prompts.chat/Promptmasters analizinden öneri #7, görev #65 (bkz. claude/prompter-monster-plan.md).
-- Supabase SQL Editor'da çalıştırın (0014_explore_format_filter.sql'den sonra). Tekrar çalıştırılabilir (idempotent).
--
-- Görev #65'in notu: "Admin'deki istatistik altyapısına dayanan ... sayaç API'si". admin_stats()
-- (0005_admin.sql / 0007_credits.sql) zaten generations_total / projects_total / shares_total
-- hesaplıyor ama is_admin() koruması var ve çok daha fazla hassas alan (MRR, iptal, yasaklı hesap,
-- kredi/maliyet...) döndürüyor — anon'a asla açılmaz. Bunun yerine YENİ, dar bir fonksiyon: aynı
-- sayım mantığı, sadece dört toplam sayı, hiçbir kullanıcıya özel veri yok. admin_stats()'a dokunulmadı.

create or replace function public.public_usage_stats()
returns table (
  generations_total bigint,
  projects_total bigint,
  shares_total bigint,
  tokens_total bigint
)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.generations)::bigint,
    (select count(*) from public.projects)::bigint,
    (select count(*) from public.shared_links)::bigint,
    (select coalesce(sum(token_estimate), 0) from public.generations)::bigint;
$$;
revoke all on function public.public_usage_stats() from public;
grant execute on function public.public_usage_stats() to anon, authenticated;
