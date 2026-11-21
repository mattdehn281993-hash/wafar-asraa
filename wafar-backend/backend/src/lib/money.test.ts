import { describe, expect, it } from 'vitest';
import { loadFixture } from '../../test/fixtures.ts';
import {
  formatMoney,
  fromNumericString,
  type Lang,
  type MoneyInputResult,
  parseMoneyInput,
  toNumericString,
  toPiastres,
} from './money.ts';

interface Case<I, O> {
  input: I;
  expected: O;
}
interface MoneyFixture {
  to_piastres: Case<number, number>[];
  from_numeric_string: Case<string, number>[];
  to_numeric_string: Case<number, string>[];
  parse_money_input: Case<string, MoneyInputResult>[];
  format_money: { piastres: number; lang: Lang; expected: string }[];
}

const fx = loadFixture<MoneyFixture>('rules/money.json');

describe('toPiastres', () => {
  it.each(fx.to_piastres)('$input → $expected', ({ input, expected }) => {
    expect(toPiastres(input)).toBe(expected);
  });
  it('rejects non-finite numbers', () => {
    expect(() => toPiastres(Number.NaN)).toThrow(RangeError);
    expect(() => toPiastres(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('fromNumericString', () => {
  it.each(fx.from_numeric_string)('$input → $expected', ({ input, expected }) => {
    expect(fromNumericString(input)).toBe(expected);
  });
  it('rejects anything that is not a numeric string', () => {
    expect(() => fromNumericString('12,50')).toThrow(RangeError);
    expect(() => fromNumericString('')).toThrow(RangeError);
  });
});

describe('toNumericString', () => {
  it.each(fx.to_numeric_string)('$input → $expected', ({ input, expected }) => {
    expect(toNumericString(input)).toBe(expected);
  });
  it('round-trips with fromNumericString', () => {
    for (const p of [0, 1, 99, 100, 125050, -300]) {
      expect(fromNumericString(toNumericString(p))).toBe(p);
    }
  });
});

describe('parseMoneyInput', () => {
  it.each(fx.parse_money_input)('"$input"', ({ input, expected }) => {
    expect(parseMoneyInput(input)).toEqual(expected);
  });
});

describe('formatMoney', () => {
  it.each(fx.format_money)('$piastres ($lang) → $expected', ({ piastres, lang, expected }) => {
    expect(formatMoney(piastres, lang)).toBe(expected);
  });
  it('refuses non-integer piastres', () => {
    expect(() => formatMoney(12.5, 'en')).toThrow(RangeError);
  });
});
