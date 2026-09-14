import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { buildLoggerOptions, requestLogger } from '../src/utils/logger.js';

/**
 * SNZ-019 unit tests: structured JSON shape plus automatic redaction of
 * writing content, tokens, and credentials. Entries are captured through an
 * in-memory sink using the production logger options.
 */
function captureSink() {
  let logged = '';
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      logged += chunk.toString();
      callback();
    },
  });
  const sinkLogger = pino(buildLoggerOptions(), stream);
  return {
    logger: sinkLogger,
    entries: () =>
      logged
        .split('\n')
        .filter((line) => line !== '')
        .map((line) => JSON.parse(line) as Record<string, unknown>),
  };
}

describe('structured logger', () => {
  it('emits valid JSON entries with timestamp, level, and message', () => {
    const { logger, entries } = captureSink();

    logger.info({ requestId: 'req-1' }, 'hello');

    const [entry] = entries();
    expect(entry?.['level']).toBe('info');
    expect(entry?.['msg']).toBe('hello');
    expect(entry?.['requestId']).toBe('req-1');
    expect(typeof entry?.['time']).toBe('string');
    expect(Number.isNaN(Date.parse(entry?.['time'] as string))).toBe(false);
  });

  it('redacts writing content, tokens, and credentials — including nested', () => {
    const { logger, entries } = captureSink();

    logger.info(
      {
        inputText: 'my private draft',
        outputText: 'revised draft',
        nested: { inputText: 'nested draft' },
        req: { headers: { authorization: 'Bearer secret-token' } },
        OPENROUTER_API_KEY: 'sk-or-key',
        SUPABASE_SECRET_KEY: 'service-key',
        DATABASE_URL: 'postgresql://user:pw@host/db',
        refreshToken: 'refresh-me',
        total_tokens: 42,
        normal: 'visible',
      },
      'redaction check',
    );

    const [entry] = entries();
    const raw = JSON.stringify(entry);
    expect(entry?.['inputText']).toBe('[REDACTED]');
    expect(entry?.['outputText']).toBe('[REDACTED]');
    expect((entry?.['nested'] as Record<string, unknown>)?.['inputText']).toBe('[REDACTED]');
    expect(
      ((entry?.['req'] as Record<string, unknown>)?.['headers'] as Record<string, unknown>)?.[
        'authorization'
      ],
    ).toBe('[REDACTED]');
    expect(entry?.['OPENROUTER_API_KEY']).toBe('[REDACTED]');
    expect(entry?.['SUPABASE_SECRET_KEY']).toBe('[REDACTED]');
    expect(entry?.['DATABASE_URL']).toBe('[REDACTED]');
    expect(entry?.['refreshToken']).toBe('[REDACTED]');
    expect(raw).not.toContain('my private draft');
    expect(raw).not.toContain('sk-or-key');
    // Non-sensitive operational fields pass through untouched.
    expect(entry?.['total_tokens']).toBe(42);
    expect(entry?.['normal']).toBe('visible');
  });

  it('requestLogger attaches the correlation ID to every entry', () => {
    const { logger, entries } = captureSink();

    requestLogger('req-9', logger).info('scoped message');

    const [entry] = entries();
    expect(entry?.['requestId']).toBe('req-9');
    expect(entry?.['msg']).toBe('scoped message');
  });
});
