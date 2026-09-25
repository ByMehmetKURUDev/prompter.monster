-- Prompt.Monster — Faz 3.1: paylaşılabilir prompt sayfası (/p/[slug])
-- shared_links herkese açık okunabilir; bağlı generation/project satırları RLS ile sahibine kapalı.
-- Bu yüzden anonim okuyucuya yalnız gereken alanları veren security definer fonksiyonlar kullanılır.
-- Supabase SQL Editor'da çalıştırın (0001_init.sql'den sonra).

-- Paylaşılan üretimi (prompt + proje özeti) slug ile getir
create or replace function public.get_shared(p_slug text)
returns table (
  slug          text,
  version       integer,
  format        text,
  lang          text,
  experts       text[],
  output        text,
  name          text,
  project_type  text,
  pitch         text,
  description   text,
  state         jsonb,
  views         integer,
  created_at    timestamptz
)
language sql security definer stable set search_path = public as $$
  select
    l.slug, g.version, g.format, g.lang, g.experts, g.output,
    p.name, p.project_type,
    coalesce(p.state->>'pitch', '')       as pitch,
    coalesce(p.state->>'description', '') as description,
    p.state,
    l.views, l.created_at
  from public.shared_links l
  join public.generations g on g.id = l.generation_id
  join public.projects p on p.id = g.project_id
  where l.slug = p_slug;
$$;
revoke all on function public.get_shared(text) from public;
grant execute on function public.get_shared(text) to anon, authenticated;

-- Görüntülenme sayacı (sayfa her açıldığında +1)
create or replace function public.bump_shared_views(p_slug text)
returns void
language sql security definer set search_path = public as $$
  update public.shared_links set views = views + 1 where slug = p_slug;
$$;
revoke all on function public.bump_shared_views(text) from public;
grant execute on function public.bump_shared_views(text) to anon, authenticated;

-- Sitemap için son paylaşımlar (slug + tarih); tablo zaten herkese açık okunuyor, indeks ekleyelim
create index if not exists shared_links_created_idx on public.shared_links(created_at desc);
create index if not exists shared_links_generation_idx on public.shared_links(generation_id);
