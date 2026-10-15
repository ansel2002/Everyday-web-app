-- Everyday: encrypted storage, reminders and push subscriptions.
-- The server only ever holds ciphertext and opaque ids for the person's data.
-- Every table is private to its owner through row level security.

-- The passphrase-wrapped master secret, one per account.
create table public.vaults (
  user_id uuid primary key references auth.users (id) on delete cascade,
  salt text not null,
  iterations integer not null check (iterations >= 100000),
  iv text not null,
  wrapped text not null,
  created_at timestamptz not null default now()
);

-- Every record (journal entry, mood, habit, ...), encrypted on the device.
-- id is an HMAC of the record's table and key, so it reveals nothing.
create table public.records (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  iv text not null,
  ct text not null,
  deleted boolean not null default false,
  -- When the change was made on the device. The latest change wins.
  updated_at timestamptz not null,
  -- When the server stored it. Devices pull by this cursor.
  synced_at timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);
create index records_user_synced_at on public.records (user_id, synced_at);

-- Keep the latest change only, and stamp when the server stored it.
create function public.records_latest_wins() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return null; -- an older change arrived late: keep what is there
  end if;
  new.synced_at := clock_timestamp();
  return new;
end;
$$;

create trigger records_latest_wins
before insert or update on public.records
for each row execute function public.records_latest_wins();

-- Reminder schedule. Only an hour, a time zone and "already done today" are readable;
-- a habit's name is encrypted (label_*), decrypted by the device's service worker.
create table public.reminders (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  local_hour integer not null check (local_hour between 0 and 23),
  timezone text not null,
  skip_on date,
  last_sent_on date,
  label_iv text,
  label_ct text,
  primary key (user_id, id)
);

-- Where to send Web Push for each device.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user on public.push_subscriptions (user_id);

-- Row level security: each person sees and changes only their own rows.
alter table public.vaults enable row level security;
alter table public.records enable row level security;
alter table public.reminders enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "own vault" on public.vaults
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own records" on public.records
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own reminders" on public.reminders
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own push subscriptions" on public.push_subscriptions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
