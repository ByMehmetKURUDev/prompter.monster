-- Prompt.Monster — Faz 6c (devam): Keşfet'te çıktı formatına göre filtreleme
-- prompts.chat/Promptmasters analizinden öneri #5, görev #64 (bkz. claude/prompter-monster-plan.md).
-- Supabase SQL Editor'da çalıştırın (0013_explore_filter_pages.sql'den sonra). Tekrar çalıştırılabilir (idempotent).
-- Not: generations.format kolonu zaten vardı ve explore_list_v3 onu zaten döndürüyordu (ExploreGrid'de
-- her kartta rozet olarak zaten gösteriliyor) — eksik olan tek şey SUNUCU TARAFI FİLTRELEME idi.
-- Hiçbir DROP yok; aynı "yeni fonksiyon adı" kuralına uyuyoruz: eskiler (explore_list_v3, explore_stats_v3
-- ve daha öncekiler) dokunulmadan kalır.

-- 1) explore_list_v4 — explore_list_v3 ile aynı + isteğe bağlı p_format filtresi (g.format = p_format) ----
create or replace function public.explore_list_v4(
  p_lang text default null, p_type text default null, p_expert text default null, p_format text default null,
  p_sort text default 'new', p_limit integer default 24, p_offset integer default 0
)
returns table (
  slug text, name text, project_type text, format text, lang text, pitch text,
  experts text[], views integer, forks integer, likes integer, featured boolean, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select l.slug, pr.name, pr.project_type, g.format, g.lang,
         coalesce(pr.state->>'pitch', '') as pitch,
         g.experts, l.views, l.forks, l.likes, l.featured, l.created_at
  from public.shared_links l
  join public.generations g on g.id = l.generation_id
  join public.projects pr on pr.id = g.project_id
  where l.listed and not l.hidden
    and (p_lang is null or g.lang = p_lang)
    and (p_type is null or pr.project_type = p_type)
    and (p_expert is null or p_expert = any(g.experts))
    and (p_format is null or g.format = p_format)
  order by
    l.featured desc,
    case p_sort
      when 'popular' then l.views::bigint
      when 'forked'  then l.forks::bigint
      when 'liked'   then l.likes::bigint
      else extract(epoch from l.created_at)::bigint
    end desc,
    l.created_at desc
  limit greatest(least(p_limit, 60), 1)
  offset greatest(p_offset, 0);
$$;
revoke all on function public.explore_list_v4(text, text, text, text, text, integer, integer) from public;
grant execute on function public.explore_list_v4(text, text, text, text, text, integer, integer) to anon, authenticated;

-- 2) explore_stats_v4 — explore_stats_v3 ile aynı + isteğe bağlı p_format filtresi ------------------------
create or replace function public.explore_stats_v4(p_type text default null, p_expert text default null, p_format text default null)
returns table (total bigint, tr bigint, en bigint, total_forks bigint, total_likes bigint)
language sql stable security definer set search_path = public as $$
  select count(*), count(*) filter (where g.lang = 'TR'), count(*) filter (where g.lang = 'EN'),
         coalesce(sum(l.forks), 0), coalesce(sum(l.likes), 0)
  from public.shared_links l
  join public.generations g on g.id = l.generation_id
  join public.projects pr on pr.id = g.project_id
  where l.listed and not l.hidden
    and (p_type is null or pr.project_type = p_type)
    and (p_expert is null or p_expert = any(g.experts))
    and (p_format is null or g.format = p_format);
$$;
revoke all on function public.explore_stats_v4(text, text, text) from public;
grant execute on function public.explore_stats_v4(text, text, text) to anon, authenticated;

-- NOT: explore_list_v3 / explore_stats_v3 ve daha öncekiler bu migration'da DEĞİŞTİRİLMEDİ — mevcut
-- çağıranlar etkilenmez. Uygulama kodu artık explore_list_v4 / explore_stats_v4 çağırıyor.
