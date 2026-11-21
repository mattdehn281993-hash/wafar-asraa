// Phone numbers are personal data: logs only ever show the masked form.
// Test cases: fixtures/rules/mask_phone.json.

/**
 * "+201001234567" → "+2010****4567". Accepts WhatsApp ids such as
 * "201001234567@s.whatsapp.net". Always four stars, so the length doesn't leak.
 */
export function maskPhone(phone: string): string {
  const s = phone.trim();
  const plus = s.startsWith('+') ? '+' : '';
  const digits = s.split('@')[0]?.replace(/\D/g, '') ?? '';
  if (digits.length < 8) return '****';
  return `${plus}${digits.slice(0, 4)}****${digits.slice(-4)}`;
}
