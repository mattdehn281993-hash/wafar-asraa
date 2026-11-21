// Money is held as integer piastres (1 EGP = 100 piastres) in a `number` that is
// always a safe integer. Never do arithmetic on EGP as a decimal number.
// Test cases: fixtures/rules/money.json (shared with a future Rust port).

export type Lang = 'en' | 'ar';

/** Largest amount a numeric(12,2) column can hold, in piastres. */
export const MAX_PIASTRES = 999_999_999_999;

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';

/** Converts Arabic-Indic (٠-٩) and Persian (۰-۹) digits to Western digits. */
export function toWesternDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹]/g, (d) => {
    const i = ARABIC_INDIC.indexOf(d);
    return String(i >= 0 ? i : PERSIAN.indexOf(d));
  });
}

function toArabicDigits(text: string): string {
  return text.replace(/[0-9]/g, (d) => ARABIC_INDIC[Number(d)] ?? d);
}

/**
 * "1250", "1250.5", "-3.255" → piastres. Digits after the second decimal place
 * round half away from zero. null if the string is not a plain decimal.
 */
function decimalStringToPiastres(s: string): number | null {
  const m = /^(-)?(\d+)(?:\.(\d+))?$/.exec(s);
  if (!m) return null;
  const [, sign, whole = '', frac = ''] = m;
  const digits = `${frac}000`.slice(0, 3);
  let piastres = Number(whole) * 100 + Number(digits.slice(0, 2));
  if (Number(digits[2]) >= 5) piastres += 1;
  if (!Number.isSafeInteger(piastres)) return null;
  return sign && piastres !== 0 ? -piastres : piastres;
}

/**
 * EGP as a JSON number (e.g. from Claude's output) → piastres.
 * Uses the number's shortest decimal form, so 0.1 + 0.2 → 30 and 1.005 → 101.
 */
export function toPiastres(egp: number): number {
  if (!Number.isFinite(egp) || Math.abs(egp) >= 1e13) {
    throw new RangeError(`not a money amount: ${egp}`);
  }
  let s = String(egp);
  if (s.includes('e')) s = egp.toFixed(10); // tiny values like 1e-7
  const piastres = decimalStringToPiastres(s);
  if (piastres === null) throw new RangeError(`not a money amount: ${egp}`);
  return piastres;
}

/** A Postgres numeric value (pg returns numeric as a string) → piastres. */
export function fromNumericString(value: string): number {
  const piastres = decimalStringToPiastres(value.trim());
  if (piastres === null) throw new RangeError(`not a numeric string: ${JSON.stringify(value)}`);
  return piastres;
}

/** Piastres → the string to write to a numeric(12,2) column, e.g. 125050 → "1250.50". */
export function toNumericString(piastres: number): string {
  assertPiastres(piastres);
  const sign = piastres < 0 ? '-' : '';
  const abs = Math.abs(piastres);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

export type MoneyInputResult =
  | { ok: true; piastres: number }
  | { ok: false; reason: 'empty' | 'invalid' | 'too_large' };

const CURRENCY_WORDS = [
  /\begp\b/g,
  /\bl\.?e\.?(?=\s|$)/g,
  /\bpounds?\b/g,
  /جنيهات|جنيها|جنيه|ج\.م|جم/g,
  /(^|\s)ج\.?(?=\s|$)/g,
];
const THOUSAND = /^(.*?)\s*(k|thousand|ألف|الف|آلاف|الاف|ألاف)$/;

/**
 * Parses money typed by a user: "5000", "5,000", "٥٠٠٠", "5k", "2.5k",
 * "٥ آلاف", "1,250.75", "٨٥٫٥٠", "450 EGP", "450 جنيه".
 * Commas are thousands separators only ("5,00" is invalid). At most 2 decimals,
 * or 1 decimal with a thousands word ("2.5k"). Negative amounts are invalid.
 */
export function parseMoneyInput(text: string): MoneyInputResult {
  let t = toWesternDigits(text).toLowerCase().replace(/٫/g, '.').replace(/[٬،]/g, ',');
  for (const word of CURRENCY_WORDS) t = t.replace(word, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  if (t === '') return { ok: false, reason: 'empty' };

  let multiplier = 1;
  const thousand = THOUSAND.exec(t);
  if (thousand) {
    multiplier = 1000;
    t = (thousand[1] ?? '').trim();
  }

  const plain = /^\d+(\.\d+)?$/.test(t);
  const grouped = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t);
  if (!plain && !grouped) return { ok: false, reason: 'invalid' };
  t = t.replace(/,/g, '');

  const decimals = t.split('.')[1]?.length ?? 0;
  if (decimals > (multiplier === 1 ? 2 : 1)) return { ok: false, reason: 'invalid' };

  const base = decimalStringToPiastres(t);
  if (base === null) return { ok: false, reason: 'too_large' };
  const piastres = base * multiplier;
  if (piastres > MAX_PIASTRES) return { ok: false, reason: 'too_large' };
  return { ok: true, piastres };
}

/**
 * Piastres → display text: 125000 → "1,250 EGP" / "١٬٢٥٠ جنيه".
 * Shows decimals only when there are piastres: 8550 → "85.50 EGP" / "٨٥٫٥٠ جنيه".
 */
export function formatMoney(piastres: number, lang: Lang): string {
  assertPiastres(piastres);
  const ar = lang === 'ar';
  const abs = Math.abs(piastres);
  const whole = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ar ? '٬' : ',');
  const frac = abs % 100;
  let s = frac === 0 ? whole : `${whole}${ar ? '٫' : '.'}${String(frac).padStart(2, '0')}`;
  if (piastres < 0) s = `-${s}`;
  return ar ? `${toArabicDigits(s)} جنيه` : `${s} EGP`;
}

function assertPiastres(piastres: number): void {
  if (!Number.isSafeInteger(piastres)) {
    throw new RangeError(`piastres must be a safe integer, got ${piastres}`);
  }
}
