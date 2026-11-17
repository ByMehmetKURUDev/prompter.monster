-- Prompt.Monster — Faz 6b devamı: #60 herkese açık kullanıcı/canavar profil sayfaları
-- prompts.chat/Promptmasters analizinden öneri #2 (bkz. claude/prompter-monster-plan.md, 17 Kas güncellemesi).
-- Supabase SQL Editor'da çalıştırın (0011_likes_leaderboard.sql'den sonra). Tekrar çalıştırılabilir (idempotent).
-- DROP FUNCTION gerekmez: yalnızca yeni kolon + yeni fonksiyon adları ekleniyor (0011'deki _v2 deseniyle aynı).

-- 0) slugify helper — kullanıcı adını normalize eder (küçük harf, yalnızca a-z0-9-, baş/son tire temizlenir)
create or replace function public._slugify(p_text text)
returns text
language sql immutable as $$
  select nullif(regexp_replace(regexp_replace(lower(trim(p_text)), '[^a-z0-9]+', '-', 'g'), '(^-+)|(-+$)', '', 'g'), '')
$$;

-- 1) profiles.username — herkese açık profil URL'i (/u/<username>), benzersiz ve sonradan değiştirilebilir
alter table public.profiles add column if not exists username text;

-- Mevcut kullanıcılar için otomatik üretim: display_name → email'in @ öncesi → 'canavar', çakışmada -2/-3…
do $$
declare
  r record;
  base text;
  candidate text;
  i int;
begin
  for r in select id, display_name, email from public.profiles where username is null loop
    base := coalesce(public._slugify(r.display_name), public._slugify(split_part(coalesce(r.email, ''), '@', 1)), 'canavar');
    candidate := base;
    i := 1;
    while exists(select 1 from public.profiles where username = candidate and id <> r.id) loop
      i := i + 1;
      candidate := base || '-' || i;
    end loop;
    update public.profiles set username = candidate where id = r.id;
  end loop;
end $$;

alter table public.profiles alter column username set not null;
create unique index if not exists profiles_username_idx on public.profiles (username);

-- 2) set_username — giriş yapmış kullanıcı kendi profil adını belirler/değiştirir (hesap sayfası)
create or replace function public.set_username(p_username text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_clean text;
begin
  if v_uid is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;
  v_clean := public._slugify(p_username);
  if v_clean is null or length(v_clean) < 3 or length(v_clean) > 30 then
    raise exception 'invalid_username' using errcode = '22023';
  end if;
  update public.profiles set username = v_clean where id = v_uid;
  return v_clean;
exception when unique_violation then
  raise exception 'username_taken' using errcode = '23505';
end $$;
revoke all on function public.set_username(text) from public;
grant execute on function public.set_username(text) to authenticated;

-- 3) public_profile — profil başlığı: ad, üyelik tarihi, toplam istatistikler (yalnızca galeride görünen paylaşımlardan)
create or replace function public.public_profile(p_username text)
returns table (
  username text, display_name text, member_since timestamptz,
  share_count bigint, total_views bigint, total_forks bigint, total_likes bigint
)
language sql stable security definer set search_path = public as $$
  select p.username,
         coalesce(nullif(trim(p.display_name), ''), p.username),
         p.created_at,
         count(l.*),
         coalesce(sum(l.views), 0),
         coalesce(sum(l.forks), 0),
         coalesce(sum(l.likes), 0)
  from public.profiles p
  left join public.shared_links l on l.owner_id = p.id and l.listed and not l.hidden
  where p.username = public._slugify(p_username)
  group by p.username, p.display_name, p.created_at;
$$;
revoke all on function public.public_profile(text) from public;
grant execute on function public.public_profile(text) to anon, authenticated;

-- 4) public_profile_shares — o canavarın galeride görünen paylaşımları (explore_list_v2 ile aynı sütunlar)
create or replace function public.public_profile_shares(p_username text, p_limit integer default 24, p_offset integer default 0)
returns table (
  slug text, name text, project_type text, format text, lang text, pitch text,
  experts text[], views integer, forks integer, likes integer, featured boolean, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select l.slug, pr.name, pr.project_type, g.format, g.lang,
         coalesce(pr.state->>'pitch', '') as pitch,
         g.experts, l.views, l.forks, l.likes, l.featured, l.created_at
  from public.shared_links l
  join public.profiles p on p.id = l.owner_id
  join public.generations g on g.id = l.generation_id
  join public.projects pr on pr.id = g.project_id
  where p.username = public._slugify(p_username) and l.listed and not l.hidden
  order by l.featured desc, l.created_at desc
  limit greatest(least(p_limit, 60), 1)
  offset greatest(p_offset, 0);
$$;
revoke all on function public.public_profile_shares(text, integer, integer) from public;
grant execute on function public.public_profile_shares(text, integer, integer) to anon, authenticated;

-- 5) leaderboard_creators_v2 — leaderboard_creators ile aynı + username (lider tablosunda profile link için). DROP yok.
create or replace function public.leaderboard_creators_v2(p_window text default 'all', p_limit integer default 20)
returns table (
  owner_id uuid, username text, display_name text, window_likes bigint, total_forks bigint, share_count bigint
)
language sql stable security definer set search_path = public as $$
  with likes_in_window as (
    select sl.shared_link_slug
    from public.shared_link_likes sl
    where p_window not in ('week', 'month')
       or (p_window = 'month' and sl.created_at >= now() - interval '30 days')
       or (p_window = 'week'  and sl.created_at >= now() - interval '7 days')
  )
  select l.owner_id, p.username,
         coalesce(nullif(trim(p.display_name), ''), p.username) as display_name,
         count(liw.*) as window_likes,
         coalesce(sum(l.forks), 0) as total_forks,
         count(distinct l.slug) as share_count
  from public.shared_links l
  join public.profiles p on p.id = l.owner_id
  left join likes_in_window liw on liw.shared_link_slug = l.slug
  where l.listed and not l.hidden
  group by l.owner_id, p.username, p.display_name
  having count(liw.*) > 0
  order by window_likes desc, total_forks desc
  limit greatest(least(p_limit, 100), 1);
$$;
revoke all on function public.leaderboard_creators_v2(text, integer) from public;
grant execute on function public.leaderboard_creators_v2(text, integer) to anon, authenticated;

-- 6) sitemap_profile_usernames — sitemap.ts için: en az bir galeride görünen paylaşımı olan kullanıcı adları
create or replace function public.sitemap_profile_usernames(p_limit integer default 2000)
returns setof text
language sql stable security definer set search_path = public as $$
  select distinct p.username
  from public.shared_links l
  join public.profiles p on p.id = l.owner_id
  where l.listed and not l.hidden
  limit greatest(least(p_limit, 5000), 1);
$$;
revoke all on function public.sitemap_profile_usernames(integer) from public;
grant execute on function public.sitemap_profile_usernames(integer) to anon, authenticated;

-- NOT: leaderboard_creators (eski ad) bu migration'da DEĞİŞTİRİLMEDİ — varsa eski çağıranlar etkilenmez.
-- Uygulama kodu artık leaderboard_creators_v2 çağırıyor.
