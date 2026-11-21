import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger } from './logger.ts';

function capture(): { lines: () => Record<string, unknown>[]; stream: Writable } {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, done) {
      chunks.push(String(chunk));
      done();
    },
  });
  const lines = () =>
    chunks
      .join('')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as Record<string, unknown>);
  return { lines, stream };
}

describe('createLogger', () => {
  it('writes Cloud Logging JSON with severity and message', () => {
    const out = capture();
    createLogger('info', out.stream).info('hello');
    expect(out.lines()[0]).toMatchObject({
      severity: 'INFO',
      message: 'hello',
      service: 'wafar-backend',
    });
  });

  it('masks phone numbers and hides bodies, transcripts and secrets', () => {
    const out = capture();
    createLogger('info', out.stream).info(
      {
        phone: '+201001234567',
        wa: { from: '201001234567@s.whatsapp.net', body: 'I bought meat', transcript: 'x' },
        token: 'secret-token',
        password: 'hunter2',
      },
      'inbound',
    );
    const raw = JSON.stringify(out.lines());
    expect(raw).toContain('+2010****4567');
    expect(raw).toContain('"2010****4567"');
    expect(raw).not.toContain('201001234567');
    expect(raw).not.toContain('I bought meat');
    expect(raw).not.toContain('secret-token');
    expect(raw).not.toContain('hunter2');
  });

  it('respects the level', () => {
    const out = capture();
    const logger = createLogger('warn', out.stream);
    logger.info('quiet');
    logger.warn('loud');
    expect(out.lines().map((line) => line.message)).toEqual(['loud']);
  });
});
