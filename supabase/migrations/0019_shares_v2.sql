-- Prompt.Monster — 0019: get_shared_v2 + admin_shares_v2 (0010'un DROP gerektiren kalan kısmı, DROP'suz).
-- Supabase SQL Editor'da çalıştırın (0018'den sonra). Tekrar çalıştırılabilir (idempotent). DROP yok, veri silmez.
--
-- 0010, get_shared ve admin_shares'in dönüş tipini (çatal sayısı + galeri/moderasyon alanları) değiştirmek için
-- DROP FUNCTION istiyordu; o kısım hiç uygulanmadı. Sonuç: paylaşım sayfasında çatal sayısı yok, Admin → Paylaşımlar'da
-- "Galeri" sütunu ve öne çıkar/gizle düğmeleri yanlış durumu gösteriyor (listed/featured/hidden gelmiyor).
-- Aynı tanımlar yeni adlarla (_v2, 0011'deki explore_list_v2 deseni); eski fonksiyonlar geri uyum için kalır.
-- Uygulama önce _v2'yi dener, yoksa eskisine düşer (src/lib/share.ts, src/app/admin/shares/page.tsx).

create or replace function public.get_shared_v2(p_slug text)
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
  forks         integer,
  created_at    timestamptz
)
language sql security definer stable set search_path = public as $$
  select
    l.slug, g.version, g.format, g.lang, g.experts, g.output,
    p.name, p.project_type,
    coalesce(p.state->>'pitch', '')       as pitch,
    coalesce(p.state->>'description', '') as description,
    p.state,
    l.views, coalesce(l.forks, 0), l.created_at
  from public.shared_links l
  join public.generations g on g.id = l.generation_id
  join public.projects p on p.id = g.project_id
  where l.slug = p_slug;
$$;
revoke all on function public.get_shared_v2(text) from public;
grant execute on function public.get_shared_v2(text) to anon, authenticated;

create or replace function public.admin_shares_v2(p_limit integer default 100)
returns table (
  slug text, owner_id uuid, email text, name text, project_type text, version integer, lang text,
  views integer, forks integer, listed boolean, featured boolean, hidden boolean, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select l.slug, l.owner_id, p.email, pr.name, pr.project_type, g.version, g.lang,
         l.views, coalesce(l.forks, 0), coalesce(l.listed, false), coalesce(l.featured, false), coalesce(l.hidden, false), l.created_at
  from public.shared_links l
  join public.profiles p on p.id = l.owner_id
  join public.generations g on g.id = l.generation_id
  join public.projects pr on pr.id = g.project_id
  where public.is_admin()
  order by l.created_at desc
  limit greatest(least(coalesce(p_limit, 100), 500), 1);
$$;
revoke all on function public.admin_shares_v2(integer) from public, anon;
grant execute on function public.admin_shares_v2(integer) to authenticated;
