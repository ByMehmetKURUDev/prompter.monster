-- 0006 — GÜVENLİK DÜZELTMESİ (acil): kullanıcı kendi profilinde plan / rol / ban alanlarını değiştirememeli.
--
-- Sorun: 0001'deki "own profile" politikası FOR ALL idi (UPDATE dahil). Oturum açmış herhangi bir kullanıcı,
-- tarayıcıdaki Supabase istemcisiyle kendi satırını güncelleyip plan='pro' veya role='admin' yapabilirdi.
-- Çözüm: kullanıcıya yalnız OKUMA; güncelleme yalnız admin politikası ve sunucu (service role) üzerinden.
-- Ek katman: korumalı alanları değiştirmeyi engelleyen tetikleyici. Paylaşım/üretim eklerken sahiplik kontrolü.
-- Tekrar çalıştırılabilir (idempotent).

-- 1) profiles: kullanıcı yalnız kendi satırını okur ---------------------------------------------
drop policy if exists "own profile" on public.profiles;
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
-- INSERT: yalnız handle_new_user() tetikleyicisi (security definer).
-- UPDATE: yalnız "admin update profiles" politikası (0005) ve service role (ödeme webhook'u).
-- DELETE: yalnız sunucu (service role) — hesap silme talebiyle.

-- 2) Savunma katmanı: korumalı alanlar yalnız admin / service role / SQL editörü tarafından değişir -----
-- SECURITY INVOKER (varsayılan): current_user, isteği yapan rolü gösterir (authenticated, service_role, postgres).
create or replace function public.profiles_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;
  if new.plan is distinct from old.plan
     or new.role is distinct from old.role
     or new.plan_locked is distinct from old.plan_locked
     or new.banned_at is distinct from old.banned_at
     or new.note is distinct from old.note
     or new.email is distinct from old.email then
    raise exception 'forbidden: protected profile fields' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute procedure public.profiles_guard();

-- 3) Üretim eklerken proje sahipliği, paylaşım eklerken üretim sahipliği zorunlu -------------------
drop policy if exists "own generations" on public.generations;
create policy "own generations" on public.generations for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

drop policy if exists "own shared links" on public.shared_links;
create policy "own shared links" on public.shared_links for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id and exists (select 1 from public.generations g where g.id = generation_id and g.owner_id = auth.uid()));

-- 4) Kontrol (sonuç tablosu): admin ve Pro hesapları — beklenmeyen bir satır varsa bildir.
select p.email, p.plan, p.role, p.plan_locked, p.created_at,
       (select s.status from public.subscriptions s where s.owner_id = p.id order by s.updated_at desc limit 1) as last_sub_status
from public.profiles p
where p.role = 'admin' or p.plan = 'pro'
order by p.created_at;
