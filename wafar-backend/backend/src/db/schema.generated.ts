/**
 * Database table types for Kysely.
 *
 * HAND-WRITTEN from migrations/0001_init.sql in milestone A0a, in the shape
 * kysely-codegen produces with `--date-parser string --numeric-parser string`.
 * Milestone A0b replaces this file with `npm run db:types` against the real
 * database. Don't edit by hand after that; add a migration and regenerate.
 */

import type { ColumnType } from 'kysely';

export type AlertType = 'budget_100' | 'budget_80' | 'category_budget' | 'unusual_receipt';

export type AppLanguage = 'ar' | 'en';

export type FamilyRole = 'member' | 'owner';

export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;

export type Json = ColumnType<JsonValue, string, string>;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [x: string]: JsonValue | undefined;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type MatchStatus = 'auto_matched' | 'confirmed' | 'rejected' | 'unmatched';

export type MembershipStatus = 'active' | 'declined' | 'invited' | 'left';

export type MemoryKind = 'fact' | 'other' | 'overspend_reason' | 'preference';

export type MessageDirection = 'inbound' | 'outbound';

/** Postgres numeric comes back as a string. Convert with lib/money.ts. */
export type Numeric = ColumnType<string, number | string, number | string>;

export type PriceSource = 'flyer' | 'ground_team' | 'manual' | 'receipt' | 'store_partner';

export type ReceiptSource = 'app_scan' | 'photo' | 'text' | 'voice';

export type ReceiptStatus = 'failed' | 'needs_review' | 'parsed' | 'received';

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Alerts {
  category_id: number | null;
  created_at: Generated<Timestamp>;
  family_id: string | null;
  id: Generated<string>;
  message: string | null;
  period_month: string;
  receipt_id: string | null;
  sent_at: Timestamp | null;
  suppressed_by: string | null;
  type: AlertType;
  user_id: string;
}

export interface Budgets {
  amount: Numeric;
  category_id: number | null;
  created_at: Generated<Timestamp>;
  family_id: string;
  id: Generated<string>;
  month: string;
}

export interface Categories {
  id: Generated<number>;
  name_ar: string;
  name_en: string;
  parent_id: number | null;
  slug: string;
}

export interface Families {
  created_at: Generated<Timestamp>;
  currency: Generated<string>;
  household_size: number | null;
  id: Generated<string>;
  monthly_budget: Numeric | null;
  name: string | null;
  owner_id: string;
  updated_at: Generated<Timestamp>;
}

export interface FamilyMembers {
  created_at: Generated<Timestamp>;
  family_id: string;
  id: Generated<string>;
  invited_by: string | null;
  joined_at: Timestamp | null;
  left_at: Timestamp | null;
  role: Generated<FamilyRole>;
  status: Generated<MembershipStatus>;
  user_id: string;
}

export interface LatestPrices {
  branch_id: string | null;
  is_promo: boolean | null;
  observed_at: Timestamp | null;
  price: Numeric | null;
  product_id: string | null;
  promo_ends_at: string | null;
  source: PriceSource | null;
  store_id: string | null;
}

export interface MemoryNotes {
  active: Generated<boolean>;
  applies_from: string | null;
  applies_until: string | null;
  category_id: number | null;
  created_at: Generated<Timestamp>;
  family_id: string | null;
  id: Generated<string>;
  kind: Generated<MemoryKind>;
  note: string;
  source_message: string | null;
  updated_at: Generated<Timestamp>;
  user_id: string;
}

export interface Prices {
  branch_id: string | null;
  created_at: Generated<Timestamp>;
  id: Generated<string>;
  is_promo: Generated<boolean>;
  observed_at: Generated<Timestamp>;
  price: Numeric;
  product_id: string;
  promo_ends_at: string | null;
  receipt_item_id: string | null;
  source: PriceSource;
  store_id: string;
}

export interface ProductAliases {
  confirmed: Generated<boolean>;
  created_at: Generated<Timestamp>;
  id: Generated<string>;
  normalized_name: string;
  product_id: string;
  raw_name: string;
  store_id: string | null;
}

export interface Products {
  barcode: string | null;
  brand: string | null;
  category_id: number | null;
  created_at: Generated<Timestamp>;
  id: Generated<string>;
  image_credit: string | null;
  image_source: string | null;
  image_url: string | null;
  name_ar: string | null;
  name_en: string | null;
  size_unit: string | null;
  size_value: Numeric | null;
  updated_at: Generated<Timestamp>;
  verified: Generated<boolean>;
}

export interface ReceiptItems {
  category_id: number | null;
  created_at: Generated<Timestamp>;
  discount: Generated<Numeric | null>;
  id: Generated<string>;
  line_no: number | null;
  line_total: Numeric | null;
  match_score: Numeric | null;
  match_status: Generated<MatchStatus>;
  product_id: string | null;
  quantity: Generated<Numeric>;
  raw_name: string;
  receipt_id: string;
  unit: string | null;
  unit_price: Numeric | null;
}

export interface Receipts {
  ai_confidence: Numeric | null;
  ai_model: string | null;
  ai_raw: Json | null;
  branch_id: string | null;
  created_at: Generated<Timestamp>;
  currency: Generated<string>;
  family_id: string | null;
  id: Generated<string>;
  image_path: string | null;
  purchased_at: Timestamp | null;
  raw_store_name: string | null;
  source: ReceiptSource;
  status: Generated<ReceiptStatus>;
  store_id: string | null;
  total_amount: Numeric | null;
  transcript: string | null;
  updated_at: Generated<Timestamp>;
  user_corrected: Generated<boolean>;
  user_id: string;
  voice_path: string | null;
  wa_message_id: string | null;
}

export interface StoreBranches {
  address: string | null;
  city: string | null;
  created_at: Generated<Timestamp>;
  district: string | null;
  id: Generated<string>;
  latitude: number | null;
  longitude: number | null;
  name: string | null;
  store_id: string;
}

export interface Stores {
  created_at: Generated<Timestamp>;
  id: Generated<string>;
  is_partner: Generated<boolean>;
  logo_url: string | null;
  name_ar: string | null;
  name_en: string | null;
  store_type: string | null;
  updated_at: Generated<Timestamp>;
}

export interface Users {
  auth_user_id: string | null;
  created_at: Generated<Timestamp>;
  first_name: string | null;
  id: Generated<string>;
  language: Generated<AppLanguage>;
  onboarded_at: Timestamp | null;
  phone: string;
  plan: Generated<string>;
  trial_ends_at: Timestamp | null;
  updated_at: Generated<Timestamp>;
  username: string | null;
}

export interface WaMessages {
  body: string | null;
  created_at: Generated<Timestamp>;
  direction: MessageDirection;
  id: Generated<string>;
  media_path: string | null;
  message_type: string | null;
  phone: string;
  user_id: string | null;
  wa_message_id: string | null;
}

export interface DB {
  alerts: Alerts;
  budgets: Budgets;
  categories: Categories;
  families: Families;
  family_members: FamilyMembers;
  latest_prices: LatestPrices;
  memory_notes: MemoryNotes;
  prices: Prices;
  product_aliases: ProductAliases;
  products: Products;
  receipt_items: ReceiptItems;
  receipts: Receipts;
  store_branches: StoreBranches;
  stores: Stores;
  users: Users;
  wa_messages: WaMessages;
}
