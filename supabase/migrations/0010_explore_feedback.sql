-- Prompt.Monster — Faz 5: Keşfet galerisi + site geri bildirimi.
-- shared_links'e galeri alanları eklenir (listed/featured/hidden/forks); sahibi yalnız `listed`i değiştirebilir,
-- öne çıkarma/gizleme/çatal sayacı admin veya sunucu (service role) işidir — bkz. 0006'daki profiles_guard deseni.
-- Supabase SQL Editor'da çalıştırın (0009_catalog.sql'den sonra). Tekrar çalıştırılabilir (idempotent).

-- 1) shared_links: galeri alanları -------------------------------------------------------------
alter table public.shared_links add column if not exists listed boolean not null default false;
alter table public.shared_links add column if not exists listed_at timestamptz;
alter table public.shared_links add column if not exists featured boolean not null default false;
alter table public.shared_links add column if not exists hidden boolean not null default false;
alter table public.shared_links add column if not exists forks integer not null default 0;

create index if not exists shared_links_explore_idx on public.shared_links(featured desc, created_at desc) where listed and not hidden;

-- 2) get_shared — çatal sayısı eklendi (dönüş tipi değiştiği için önce DROP) --------------------
drop function if exists public.get_shared(text);
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
    l.views, l.forks, l.created_at
  from public.shared_links l
  join public.generations g on g.id = l.generation_id
  join public.projects p on p.id = g.project_id
  where l.slug = p_slug;
$$;
revoke all on function public.get_shared(text) from public;
grant execute on function public.get_shared(text) to anon, authenticated;

-- 3) Savunma katmanı: sahibi yalnız `listed`i değiştirebilir; featured/hidden/forks/views/owner_id/generation_id
--    yalnız admin veya sunucu (service role) — 0006'daki profiles_guard ile aynı desen. listed_at her zaman sunucuca yönetilir.
create or replace function public.shared_links_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if not (current_user not in ('authenticated', 'anon') or public.is_admin()) then
    if new.featured is distinct from old.featured
       or new.hidden is distinct from old.hidden
       or new.forks is distinct from old.forks
       or new.views is distinct from old.views
       or new.owner_id is distinct from old.owner_id
       or new.generation_id is distinct from old.generation_id then
      raise exception 'forbidden: protected share fields' using errcode = '42501';
    end if;
  end if;
  if new.listed and not old.listed then
    new.listed_at := now();
  elsif not new.listed then
    new.listed_at := null;
  else
    new.listed_at := old.listed_at;
  end if;
  return new;
end $$;
drop trigger if exists shared_links_guard on public.shared_links;
create trigger shared_links_guard before update on public.shared_links
  for each row execute procedure public.shared_links_guard();

-- 4) explore_list — Keşfet sayfası için herkese açık liste (listed ve gizlenmemiş) ---------------
create or replace function public.explore_list(p_lang text default null, p_type text default null, p_sort text default 'new', p_limit integer default 24, p_offset integer default 0)
returns table (
  slug text, name text, project_type text, format text, lang text, pitch text,
  experts text[], views integer, forks integer, featured boolean, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select l.slug, pr.name, pr.project_type, g.format, g.lang,
         coalesce(pr.state->>'pitch', '') as pitch,
         g.experts, l.views, l.forks, l.featured, l.created_at
  from public.shared_links l
  join public.generations g on g.id = l.generation_id
  join public.projects pr on pr.id = g.project_id
  where l.listed and not l.hidden
    and (p_lang is null or g.lang = p_lang)
    and (p_type is null or pr.project_type = p_type)
  order by
    l.featured desc,
    case p_sort
      when 'popular' then l.views::bigint
      when 'forked'  then l.forks::bigint
      else extract(epoch from l.created_at)::bigint
    end desc,
    l.created_at desc
  limit greatest(least(p_limit, 60), 1)
  offset greatest(p_offset, 0);
$$;
revoke all on function public.explore_list(text, text, text, integer, integer) from public;
grant execute on function public.explore_list(text, text, text, integer, integer) to anon, authenticated;

-- 5) explore_stats — galeri sayaçları (üst bilgi) -------------------------------------------------
create or replace function public.explore_stats()
returns table (total bigint, tr bigint, en bigint, total_forks bigint)
language sql stable security definer set search_path = public as $$
  select count(*), count(*) filter (where g.lang = 'TR'), count(*) filter (where g.lang = 'EN'), coalesce(sum(l.forks), 0)
  from public.shared_links l
  join public.generations g on g.id = l.generation_id
  where l.listed and not l.hidden;
$$;
revoke all on function public.explore_stats() from public;
grant execute on function public.explore_stats() to anon, authenticated;

-- 6) bump_shared_forks — Studio'da her "çatalla" yüklemesinde +1 (bump_shared_views ile aynı desen) --
create or replace function public.bump_shared_forks(p_slug text)
returns void
language sql security definer set search_path = public as $$
  update public.shared_links set forks = forks + 1 where slug = p_slug;
$$;
revoke all on function public.bump_shared_forks(text) from public;
grant execute on function public.bump_shared_forks(text) to anon, authenticated;

-- 7) admin_shares — galeri/moderasyon alanları eklendi (dönüş tipi değiştiği için önce DROP) -------
drop function if exists public.admin_shares(integer);
create or replace function public.admin_shares(p_limit integer default 100)
returns table (
  slug text, owner_id uuid, email text, name text, project_type text, version integer, lang text,
  views integer, forks integer, listed boolean, featured boolean, hidden boolean, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select l.slug, l.owner_id, p.email, pr.name, pr.project_type, g.version, g.lang,
         l.views, l.forks, l.listed, l.featured, l.hidden, l.created_at
  from public.shared_links l
  join public.profiles p on p.id = l.owner_id
  join public.generations g on g.id = l.generation_id
  join public.projects pr on pr.id = g.project_id
  where public.is_admin()
  order by l.created_at desc
  limit greatest(least(p_limit, 500), 1);
$$;
revoke all on function public.admin_shares(integer) from public;
grant execute on function public.admin_shares(integer) to authenticated;

-- 8) feedback — galeri içeriği bildirimi / kısa site geri bildirimi --------------------------------
create table if not exists public.feedback (
  id         bigint generated always as identity primary key,
  owner_id   uuid references public.profiles(id) on delete set null,
  slug       text,
  email      text,
  page       text,
  message    text not null,
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
drop policy if exists "admin read feedback" on public.feedback;
create policy "admin read feedback" on public.feedback for select using (public.is_admin());
-- INSERT yalnız submit_feedback() (security definer) üzerinden; doğrudan tablo yazımı yok (anon dahil herkes RPC ile ekleyebilir).

create or replace function public.submit_feedback(p_message text, p_slug text default null, p_page text default null, p_email text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  msg text := trim(coalesce(p_message, ''));
begin
  if length(msg) < 3 or length(msg) > 2000 then
    raise exception 'invalid_message' using errcode = '22023';
  end if;
  insert into public.feedback (owner_id, slug, email, page, message)
  values (auth.uid(), nullif(trim(coalesce(p_slug, '')), ''), nullif(trim(coalesce(p_email, '')), ''), nullif(trim(coalesce(p_page, '')), ''), msg);
end $$;
revoke all on function public.submit_feedback(text, text, text, text) from public;
grant execute on function public.submit_feedback(text, text, text, text) to anon, authenticated;

create or replace function public.admin_feedback(p_limit integer default 100)
returns table (id bigint, slug text, email text, message text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select f.id, f.slug, coalesce(f.email, p.email), f.message, f.created_at
  from public.feedback f
  left join public.profiles p on p.id = f.owner_id
  where public.is_admin()
  order by f.created_at desc
  limit greatest(least(p_limit, 500), 1);
$$;
revoke all on function public.admin_feedback(integer) from public;
grant execute on function public.admin_feedback(integer) to authenticated;
