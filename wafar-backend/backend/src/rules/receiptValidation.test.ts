import { describe, expect, it } from 'vitest';
import { loadFixture, mergeTopLevel } from '../../test/fixtures.ts';
import { ReceiptSchema } from '../ai/receipt.ts';
import {
  type ReceiptDecision,
  type ReceiptInputSource,
  validateReceipt,
} from './receiptValidation.ts';

const fx = loadFixture<{
  base_receipt: Record<string, unknown>;
  cases: {
    name: string;
    source: ReceiptInputSource;
    receipt: Record<string, unknown>;
    expected: ReceiptDecision;
  }[];
}>('rules/receipt_validation.json');

describe('validateReceipt', () => {
  it.each(fx.cases)('$name', ({ source, receipt, expected }) => {
    // Every fixture receipt must also be valid Claude output.
    const parsed = ReceiptSchema.parse(mergeTopLevel(fx.base_receipt, receipt));
    expect(validateReceipt(parsed, source)).toEqual(expected);
  });
});
