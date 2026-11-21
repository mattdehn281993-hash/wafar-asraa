import { describe, expect, it } from 'vitest';
import { loadFixture } from '../../test/fixtures.ts';
import { maskPhone } from './phone.ts';

const fx = loadFixture<{ cases: { input: string; expected: string }[] }>('rules/mask_phone.json');

describe('maskPhone', () => {
  it.each(fx.cases)('"$input" → "$expected"', ({ input, expected }) => {
    expect(maskPhone(input)).toBe(expected);
  });
});
