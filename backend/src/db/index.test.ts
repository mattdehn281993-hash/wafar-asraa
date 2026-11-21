import { describe, expect, it } from 'vitest';
import { tlsFor } from './index.ts';

describe('tlsFor', () => {
  it('verifies Supabase pooler hosts against the Supabase root CA', () => {
    const tls = tlsFor(
      'postgresql://postgres.ref:pw@aws-0-eu-west-1.pooler.supabase.com:5432/postgres',
    );
    expect(tls?.rejectUnauthorized).toBe(true);
    expect(String(tls?.ca)).toContain('BEGIN CERTIFICATE');
  });

  it('covers direct Supabase hosts too', () => {
    expect(tlsFor('postgresql://postgres:pw@db.ref.supabase.co:5432/postgres')).toBeDefined();
  });

  it('leaves other hosts and invalid URLs to pg defaults', () => {
    expect(tlsFor('postgresql://u:p@localhost:5432/db')).toBeUndefined();
    expect(tlsFor('postgresql://u:p@evil-supabase.com.example.net/db')).toBeUndefined();
    expect(tlsFor('not a url')).toBeUndefined();
  });
});
