-- Prompt.Monster — Faz 3.2c: Lemon Squeezy aboneliği
-- Supabase SQL Editor'da çalıştırın (0003'ten sonra).

-- subscriptions.provider kısıtına lemonsqueezy ekle
alter table public.subscriptions drop constraint if exists subscriptions_provider_check;
alter table public.subscriptions add constraint subscriptions_provider_check
  check (provider in ('stripe','paddle','iyzico','lemonsqueezy'));

-- Sağlayıcıdan gelen ek bilgiler
alter table public.subscriptions add column if not exists plan text;            -- monthly | yearly
alter table public.subscriptions add column if not exists customer_ref text;    -- provider customer id
alter table public.subscriptions add column if not exists portal_url text;      -- customer portal (signed, süreli)
alter table public.subscriptions add column if not exists raw jsonb;            -- son webhook payload'ı (destek/debug)

create index if not exists subscriptions_owner_idx on public.subscriptions(owner_id, updated_at desc);

drop trigger if exists subscriptions_touch on public.subscriptions;
create trigger subscriptions_touch before update on public.subscriptions
  for each row execute procedure public.touch_updated_at();

-- Not: webhook rotası service_role anahtarıyla yazar (RLS'yi aşar); kullanıcılar yalnız kendi satırını okur.
