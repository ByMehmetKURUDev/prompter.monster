-- Prompt.Monster — Faz 3.2a: Pro ilgi listesi (ödeme açılana kadar "haber ver" kaydı)
-- Supabase SQL Editor'da çalıştırın (0002_share.sql'den sonra).

alter table public.profiles add column if not exists pro_interest_at timestamptz;

-- Kullanıcı kendi profilindeki ilgi zamanını işaretler (RLS "own profile" politikası yeterli).
create or replace function public.mark_pro_interest()
returns timestamptz
language sql security definer set search_path = public as $$
  update public.profiles set pro_interest_at = coalesce(pro_interest_at, now())
  where id = auth.uid()
  returning pro_interest_at;
$$;
revoke all on function public.mark_pro_interest() from public;
grant execute on function public.mark_pro_interest() to authenticated;
