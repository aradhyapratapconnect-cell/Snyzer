import { describe, expect, it } from 'vitest';
import { databaseSslConfig } from '../src/config/database.js';

/**
 * SNZ-060 tests: TLS is required for remote databases and skipped for local
 * development. No live database involved.
 */
describe('databaseSslConfig', () => {
  it('requires verified TLS for remote hosts', () => {
    expect(databaseSslConfig('postgresql://user:pw@db.example.supabase.co:5432/snyzer')).toEqual({
      rejectUnauthorized: true,
    });
    expect(databaseSslConfig('postgresql://user:pw@10.0.0.5:5432/snyzer')).toEqual({
      rejectUnauthorized: true,
    });
  });

  it('skips TLS for local development hosts', () => {
    expect(databaseSslConfig('postgresql://user:password@localhost:5432/snyzer')).toBeUndefined();
    expect(databaseSslConfig('postgresql://user:pw@127.0.0.1:5432/snyzer')).toBeUndefined();
  });

  it('fails closed on unparseable connection strings', () => {
    expect(databaseSslConfig('not-a-url')).toEqual({ rejectUnauthorized: true });
  });
});
