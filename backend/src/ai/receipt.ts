import { z } from 'zod';

// zod mirror of schemas/receipt_extraction.schema.json (the source of truth).
// receipt.test.ts checks the two stay identical. Change the JSON file first.
// Money fields are EGP numbers exactly as Claude returns them; convert with
// toPiastres (lib/money.ts) before doing any arithmetic.

export const CATEGORY_SLUGS = [
  'vegetables_fruit',
  'meat_poultry_fish',
  'dairy_eggs',
  'bakery',
  'rice_pasta_grains',
  'oil_ghee',
  'sugar_tea_coffee',
  'snacks_drinks',
  'cleaning',
  'personal_care',
  'baby',
  'pharmacy',
  'eating_out',
  'other',
] as const;

export const RECEIPT_ISSUES = [
  'blurry',
  'cut_off',
  'faded',
  'handwritten',
  'not_a_receipt',
  'multiple_receipts',
  'total_not_readable',
  'items_not_readable',
  'total_mismatch',
] as const;

export const ReceiptItemSchema = z.strictObject({
  raw_name: z.string(),
  name_en: z.string().nullable(),
  brand: z.string().nullable(),
  size_text: z.string().nullable(),
  barcode: z.string().nullable(),
  quantity: z.number(),
  unit_price: z.number().nullable(),
  line_total: z.number(),
  discount: z.number(),
  category: z.enum(CATEGORY_SLUGS),
});

export const ReceiptSchema = z.strictObject({
  is_receipt: z.boolean(),
  language: z.enum(['ar', 'en', 'mixed']),
  store: z.strictObject({
    name_raw: z.string(),
    name_en: z.string().nullable(),
    branch_raw: z.string().nullable(),
    address_raw: z.string().nullable(),
  }),
  purchase_date: z.iso.date().nullable(),
  purchase_time: z.string().nullable(),
  currency: z.enum(['EGP', 'other']),
  items: z.array(ReceiptItemSchema),
  subtotal: z.number().nullable(),
  discount_total: z.number(),
  tax_total: z.number().nullable(),
  total: z.number().nullable(),
  payment_method: z.enum(['cash', 'card', 'mobile_wallet', 'unknown']),
  confidence: z.number(),
  issues: z.array(z.enum(RECEIPT_ISSUES)),
});

export type Receipt = z.infer<typeof ReceiptSchema>;
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
export type ReceiptIssue = (typeof RECEIPT_ISSUES)[number];
