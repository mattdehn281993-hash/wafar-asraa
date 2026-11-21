-- =====================================================================
-- Wafar Asraa (وفّر أسرة) — MVP database schema for Supabase (Postgres)
-- Version 1 · 2026-11-01
--
-- How to use: Supabase dashboard → SQL Editor → paste → Run.
-- The backend (WhatsApp bot) uses the service_role key, which bypasses
-- row-level security. The Expo app uses the anon key + user sign-in,
-- so the RLS policies at the bottom decide what the app can see.
-- =====================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_trgm";    -- fuzzy name matching for products

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type app_language      as enum ('en', 'ar');
create type family_role       as enum ('owner', 'member');
create type membership_status as enum ('invited', 'active', 'left', 'declined');
create type receipt_source    as enum ('photo', 'voice', 'text', 'app_scan');
create type receipt_status    as enum ('received', 'parsed', 'needs_review', 'failed');
create type match_status      as enum ('unmatched', 'auto_matched', 'confirmed', 'rejected');
create type price_source      as enum ('receipt', 'flyer', 'store_partner', 'ground_team', 'manual');
create type memory_kind       as enum ('fact', 'overspend_reason', 'preference', 'other');
create type alert_type        as enum ('budget_80', 'budget_100', 'category_budget', 'unusual_receipt');
create type message_direction as enum ('inbound', 'outbound');

-- ---------------------------------------------------------------------
-- Shared helper: keep updated_at fresh
-- ---------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- USERS
-- One row per person. Created by the bot on first WhatsApp message.
-- auth_user_id is filled when the same person signs in to the app.
-- ---------------------------------------------------------------------
create table users (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid unique references auth.users(id) on delete set null,
  phone           text not null unique,              -- E.164, e.g. +201001234567
  username        text unique,                       -- chosen at onboarding
  first_name      text,
  language        app_language not null default 'ar',
  onboarded_at    timestamptz,
  trial_ends_at   timestamptz,                       -- 2-month free trial when paid tiers start
  plan            text not null default 'free',      -- free | premium (later)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint username_format check (username is null or username ~ '^[a-z0-9_]{3,30}$')
);
create trigger users_updated before update on users
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- FAMILIES
-- One person signs up and creates the family; they add others as members.
-- ---------------------------------------------------------------------
create table families (
  id              uuid primary key default gen_random_uuid(),
  name            text,
  owner_id        uuid not null references users(id) on delete restrict,
  household_size  smallint check (household_size between 1 and 30),
  monthly_budget  numeric(12,2) check (monthly_budget >= 0),   -- EGP
  currency        char(3) not null default 'EGP',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger families_updated before update on families
  for each row execute function set_updated_at();

create table family_members (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references families(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  role            family_role not null default 'member',
  status          membership_status not null default 'invited',
  invited_by      uuid references users(id) on delete set null,
  joined_at       timestamptz,
  left_at         timestamptz,
  created_at      timestamptz not null default now(),
  unique (family_id, user_id)
);
-- MVP rule: a user can be ACTIVE in only one family at a time
create unique index one_active_family_per_user
  on family_members(user_id) where status = 'active';
create index family_members_family on family_members(family_id);

-- ---------------------------------------------------------------------
-- STORES & BRANCHES
-- stores = the chain or shop (e.g. a supermarket brand)
-- store_branches = a physical location (for "closest to you")
-- ---------------------------------------------------------------------
create table stores (
  id              uuid primary key default gen_random_uuid(),
  name_en         text,
  name_ar         text,
  store_type      text,                    -- supermarket | hypermarket | discount | grocer | market | pharmacy | online
  is_partner      boolean not null default false,
  logo_url        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint store_has_name check (name_en is not null or name_ar is not null)
);
create trigger stores_updated before update on stores
  for each row execute function set_updated_at();

create table store_branches (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references stores(id) on delete cascade,
  name            text,                    -- as printed on receipts, e.g. "فرع التجمع"
  city            text check (city in ('Cairo', 'Giza')),
  district        text,                    -- e.g. New Cairo, Nasr City, 6th of October
  address         text,
  latitude        double precision,
  longitude       double precision,
  created_at      timestamptz not null default now()
);
create index store_branches_store on store_branches(store_id);
create index store_branches_district on store_branches(city, district);

-- ---------------------------------------------------------------------
-- PRODUCT CATALOG
-- One master row per real product. Store prices hang off it.
-- ---------------------------------------------------------------------
create table categories (
  id              serial primary key,
  slug            text not null unique,    -- e.g. dairy, oil, rice_pasta, cleaning
  name_en         text not null,
  name_ar         text not null,
  parent_id       int references categories(id) on delete set null
);

create table products (
  id              uuid primary key default gen_random_uuid(),
  barcode         text unique,             -- EAN/GTIN when known — best match key
  name_en         text,
  name_ar         text,
  brand           text,
  size_value      numeric(10,3),           -- 1, 500, 2.5
  size_unit       text,                    -- l, ml, kg, g, piece, pack
  category_id     int references categories(id) on delete set null,
  image_url       text,
  image_source    text,                    -- open_food_facts | own_photo | brand | user | icon
  image_credit    text,                    -- attribution when the licence needs it
  verified        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint product_has_name check (name_en is not null or name_ar is not null)
);
create trigger products_updated before update on products
  for each row execute function set_updated_at();
create index products_category on products(category_id);
create index products_name_ar_trgm on products using gin (name_ar gin_trgm_ops);
create index products_name_en_trgm on products using gin (name_en gin_trgm_ops);

-- How each store writes a product name on receipts / POS files.
-- Once confirmed, the same raw text auto-matches next time.
create table product_aliases (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  store_id        uuid references stores(id) on delete cascade,   -- null = applies to any store
  raw_name        text not null,
  normalized_name text not null,           -- lowercased, spaces/diacritics cleaned by the backend
  confirmed       boolean not null default false,
  created_at      timestamptz not null default now()
);
create unique index product_aliases_unique
  on product_aliases(coalesce(store_id, '00000000-0000-0000-0000-000000000000'::uuid), normalized_name);

-- ---------------------------------------------------------------------
-- RECEIPTS
-- Every purchase a user logs — photo, voice note or text.
-- ---------------------------------------------------------------------
create table receipts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  family_id       uuid references families(id) on delete set null,  -- family at time of purchase
  store_id        uuid references stores(id) on delete set null,
  branch_id       uuid references store_branches(id) on delete set null,
  raw_store_name  text,                    -- as read from the receipt
  purchased_at    timestamptz,             -- date on the receipt (or message time if none)
  total_amount    numeric(12,2),
  currency        char(3) not null default 'EGP',
  source          receipt_source not null,
  status          receipt_status not null default 'received',
  image_path      text,                    -- Supabase Storage path, bucket "receipts"
  voice_path      text,                    -- Storage path for voice notes
  transcript      text,                    -- voice-note transcript
  ai_model        text,                    -- which model parsed it
  ai_confidence   numeric(4,3) check (ai_confidence between 0 and 1),
  ai_raw          jsonb,                   -- full model output, for debugging and re-parsing
  user_corrected  boolean not null default false,
  wa_message_id   text,                    -- Whapi message id, prevents double-processing
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger receipts_updated before update on receipts
  for each row execute function set_updated_at();
create unique index receipts_wa_message on receipts(wa_message_id) where wa_message_id is not null;
create index receipts_user_date   on receipts(user_id, purchased_at desc);
create index receipts_family_date on receipts(family_id, purchased_at desc);

create table receipt_items (
  id              uuid primary key default gen_random_uuid(),
  receipt_id      uuid not null references receipts(id) on delete cascade,
  line_no         smallint,
  raw_name        text not null,
  product_id      uuid references products(id) on delete set null,
  match_status    match_status not null default 'unmatched',
  match_score     numeric(4,3),
  category_id     int references categories(id) on delete set null,
  quantity        numeric(10,3) not null default 1,
  unit            text,
  unit_price      numeric(12,2),
  line_total      numeric(12,2),
  discount        numeric(12,2) default 0,
  created_at      timestamptz not null default now()
);
create index receipt_items_receipt on receipt_items(receipt_id);
create index receipt_items_product on receipt_items(product_id);
create index receipt_items_review  on receipt_items(match_status) where match_status = 'unmatched';

-- ---------------------------------------------------------------------
-- PRICES
-- One row per observed price. Shared across all users (no personal data).
-- ---------------------------------------------------------------------
create table prices (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  store_id        uuid not null references stores(id) on delete cascade,
  branch_id       uuid references store_branches(id) on delete set null,
  price           numeric(12,2) not null check (price > 0),
  is_promo        boolean not null default false,
  promo_ends_at   date,
  source          price_source not null,
  receipt_item_id uuid references receipt_items(id) on delete set null,
  observed_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
create index prices_lookup on prices(product_id, store_id, observed_at desc);
create index prices_branch on prices(branch_id, observed_at desc);

-- Latest known price per product per branch — what the app shows
create view latest_prices
with (security_invoker = true) as
select distinct on (product_id, store_id, coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid))
  product_id, store_id, branch_id, price, is_promo, promo_ends_at, source, observed_at
from prices
order by product_id, store_id, coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid), observed_at desc;

-- ---------------------------------------------------------------------
-- BUDGETS
-- Monthly family budget, optionally per category.
-- ---------------------------------------------------------------------
create table budgets (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references families(id) on delete cascade,
  month           date not null check (extract(day from month) = 1),   -- first day of the month
  category_id     int references categories(id) on delete cascade,     -- null = whole budget
  amount          numeric(12,2) not null check (amount >= 0),
  created_at      timestamptz not null default now()
);
create unique index budgets_unique on budgets(family_id, month, coalesce(category_id, 0));

-- ---------------------------------------------------------------------
-- MEMORY NOTES
-- What the assistant remembers: facts, reasons for overspending, preferences.
-- ---------------------------------------------------------------------
create table memory_notes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  family_id       uuid references families(id) on delete cascade,     -- set when it applies to the family
  kind            memory_kind not null default 'fact',
  note            text not null,                                       -- e.g. "Extra spending this month: birthday party"
  category_id     int references categories(id) on delete set null,    -- optional: which spending it explains
  applies_from    date,
  applies_until   date,                                                -- e.g. end of month for an overspend reason
  active          boolean not null default true,                       -- false when the user says "forget this"
  source_message  text,                                                -- user's own words
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger memory_notes_updated before update on memory_notes
  for each row execute function set_updated_at();
create index memory_notes_user on memory_notes(user_id) where active;
create index memory_notes_family on memory_notes(family_id) where active;

-- ---------------------------------------------------------------------
-- ALERTS
-- Overspend alerts sent, and whether a memory note suppressed one.
-- ---------------------------------------------------------------------
create table alerts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  family_id       uuid references families(id) on delete cascade,
  type            alert_type not null,
  period_month    date not null,
  category_id     int references categories(id) on delete set null,
  receipt_id      uuid references receipts(id) on delete set null,
  message         text,
  suppressed_by   uuid references memory_notes(id) on delete set null, -- not sent because of a known reason
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);
-- never send the same alert twice in one month
create unique index alerts_once_per_period
  on alerts(family_id, type, period_month, coalesce(category_id, 0))
  where type in ('budget_80', 'budget_100', 'category_budget');

-- ---------------------------------------------------------------------
-- MESSAGE LOG
-- Every WhatsApp message in and out — for debugging and the 24h window.
-- ---------------------------------------------------------------------
create table wa_messages (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) on delete set null,
  phone           text not null,
  direction       message_direction not null,
  wa_message_id   text,
  message_type    text,                    -- text | image | audio | ...
  body            text,
  media_path      text,
  created_at      timestamptz not null default now()
);
create index wa_messages_phone on wa_messages(phone, created_at desc);
create unique index wa_messages_id on wa_messages(wa_message_id) where wa_message_id is not null;

-- ---------------------------------------------------------------------
-- Starter categories
-- ---------------------------------------------------------------------
insert into categories (slug, name_en, name_ar) values
  ('vegetables_fruit', 'Vegetables & fruit', 'خضار وفاكهة'),
  ('meat_poultry_fish','Meat, poultry & fish','لحوم ودواجن وأسماك'),
  ('dairy_eggs',       'Dairy & eggs',       'ألبان وبيض'),
  ('bakery',           'Bread & bakery',     'عيش ومخبوزات'),
  ('rice_pasta_grains','Rice, pasta & grains','أرز ومكرونة وبقوليات'),
  ('oil_ghee',         'Oil & ghee',         'زيت وسمن'),
  ('sugar_tea_coffee', 'Sugar, tea & coffee','سكر وشاي وقهوة'),
  ('snacks_drinks',    'Snacks & drinks',    'سناكس ومشروبات'),
  ('cleaning',         'Cleaning & laundry', 'منظفات'),
  ('personal_care',    'Personal care',      'عناية شخصية'),
  ('baby',             'Baby',               'مستلزمات أطفال'),
  ('pharmacy',         'Pharmacy',           'صيدلية'),
  ('eating_out',       'Eating out',         'أكل بره'),
  ('other',            'Other',              'أخرى');

-- =====================================================================
-- ROW-LEVEL SECURITY (for the Expo app; the bot's service_role bypasses it)
-- =====================================================================

-- The users.id of whoever is signed in to the app
create or replace function current_app_user_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from users where auth_user_id = auth.uid()
$$;

-- Families the signed-in user is an active member of
create or replace function my_family_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select family_id from family_members
  where user_id = current_app_user_id() and status = 'active'
$$;

-- Is the signed-in user the owner of this family?
create or replace function is_family_owner(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from families where id = fid and owner_id = current_app_user_id())
$$;

alter table users            enable row level security;
alter table families         enable row level security;
alter table family_members   enable row level security;
alter table stores           enable row level security;
alter table store_branches   enable row level security;
alter table categories       enable row level security;
alter table products         enable row level security;
alter table product_aliases  enable row level security;
alter table receipts         enable row level security;
alter table receipt_items    enable row level security;
alter table prices           enable row level security;
alter table budgets          enable row level security;
alter table memory_notes     enable row level security;
alter table alerts           enable row level security;
alter table wa_messages      enable row level security;   -- no app policies: backend only

-- Users: see and edit yourself; see the names of people in your family
create policy users_self_select on users for select
  using (id = current_app_user_id()
         or id in (select user_id from family_members
                   where family_id in (select my_family_ids()) and status = 'active'));
create policy users_self_update on users for update
  using (id = current_app_user_id());

-- Families: members can read; owner can update
create policy families_member_select on families for select
  using (id in (select my_family_ids()));
create policy families_owner_update on families for update
  using (owner_id = current_app_user_id());

create policy family_members_select on family_members for select
  using (family_id in (select my_family_ids()) or user_id = current_app_user_id());

-- Shared reference data: any signed-in user can read
create policy stores_read     on stores         for select to authenticated using (true);
create policy branches_read   on store_branches for select to authenticated using (true);
create policy categories_read on categories     for select to authenticated using (true);
create policy products_read   on products       for select to authenticated using (true);
create policy prices_read     on prices         for select to authenticated using (true);

-- Receipts: your own always; the family owner sees every member's
create policy receipts_select on receipts for select
  using (user_id = current_app_user_id()
         or (family_id in (select my_family_ids()) and is_family_owner(family_id)));
create policy receipts_insert on receipts for insert
  with check (user_id = current_app_user_id());
create policy receipts_update on receipts for update
  using (user_id = current_app_user_id());

create policy receipt_items_select on receipt_items for select
  using (receipt_id in (select id from receipts));   -- inherits the receipts policy

-- Budgets: family members read, owner writes
create policy budgets_select on budgets for select
  using (family_id in (select my_family_ids()));
create policy budgets_owner_write on budgets for all
  using (is_family_owner(family_id)) with check (is_family_owner(family_id));

-- Memory: only your own notes; you can edit or "forget" them
create policy memory_select on memory_notes for select
  using (user_id = current_app_user_id());
create policy memory_update on memory_notes for update
  using (user_id = current_app_user_id());

-- Alerts: your own
create policy alerts_select on alerts for select
  using (user_id = current_app_user_id());

-- =====================================================================
-- STORAGE (run once): private buckets for receipt photos and voice notes
-- =====================================================================
insert into storage.buckets (id, name, public) values
  ('receipts', 'receipts', false),
  ('voice-notes', 'voice-notes', false)
on conflict (id) do nothing;
