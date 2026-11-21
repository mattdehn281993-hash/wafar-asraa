import type { Receipt, ReceiptIssue } from '../ai/receipt.ts';
import { toPiastres } from '../lib/money.ts';

// Decides what to do with a receipt Claude has read (AGENTS.md §7). Pure: no
// I/O. Never trust the model's arithmetic or its own total_mismatch flag; the
// check here is the authority. Test cases: fixtures/rules/receipt_validation.json.

export type ReceiptInputSource = 'photo' | 'voice' | 'text';

export const MIN_CONFIDENCE = 0.6;
export const TOTAL_TOLERANCE_PIASTRES = 100; // 1 EGP

const UNCLEAR_ISSUES = ['blurry', 'cut_off', 'total_not_readable'] as const;

export type UnclearReason = 'low_confidence' | (typeof UNCLEAR_ISSUES)[number] | 'nothing_to_save';

export type ReceiptDecision =
  /** Not a receipt or purchase: explain what to send. */
  | { kind: 'not_a_receipt' }
  /** Don't save a guess: ask for a clearer photo (or a clearer message). */
  | { kind: 'unclear'; reasons: UnclearReason[] }
  /** Save it. `needs_review` when the printed total doesn't add up. */
  | {
      kind: 'save';
      status: 'parsed' | 'needs_review';
      total_piastres: number;
      issues: ReceiptIssue[];
    };

export function validateReceipt(receipt: Receipt, source: ReceiptInputSource): ReceiptDecision {
  if (!receipt.is_receipt || receipt.issues.includes('not_a_receipt')) {
    return { kind: 'not_a_receipt' };
  }

  const reasons: UnclearReason[] = [];
  if (receipt.confidence < MIN_CONFIDENCE) reasons.push('low_confidence');
  for (const issue of UNCLEAR_ISSUES) {
    if (receipt.issues.includes(issue)) reasons.push(issue);
  }

  // net = sum(line_total) − sum(discount) − discount_total
  let net = -toPiastres(receipt.discount_total);
  for (const item of receipt.items) {
    net += toPiastres(item.line_total) - toPiastres(item.discount);
  }

  let total = receipt.total === null ? null : toPiastres(receipt.total);
  if (source === 'photo') {
    if (total === null && !reasons.includes('total_not_readable')) {
      reasons.push('total_not_readable');
    }
  } else {
    // Voice and text: the amount the user said is the truth. With no amount,
    // fall back to the items; with no items either, there is nothing to save.
    if (total === null && receipt.items.length > 0) total = net;
    if (total === null || total <= 0) reasons.push('nothing_to_save');
  }

  if (reasons.length > 0 || total === null) return { kind: 'unclear', reasons };

  const issues = receipt.issues.filter((issue) => issue !== 'total_mismatch');

  if (source === 'photo') {
    // Shelf prices in Egyptian chains usually include VAT and print it as an
    // information line, so accept the total with or without the tax added.
    const tax = receipt.tax_total === null ? 0 : toPiastres(receipt.tax_total);
    const addsUp =
      Math.abs(net - total) <= TOTAL_TOLERANCE_PIASTRES ||
      Math.abs(net + tax - total) <= TOTAL_TOLERANCE_PIASTRES;
    if (!addsUp) {
      return {
        kind: 'save',
        status: 'needs_review',
        total_piastres: total,
        issues: [...issues, 'total_mismatch'],
      };
    }
  }

  return { kind: 'save', status: 'parsed', total_piastres: total, issues };
}
