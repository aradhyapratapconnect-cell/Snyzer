import { describe, expect, it } from 'vitest';
import { UserPreferencesSchema, UserPreferencesUpdateSchema } from '../src/schemas/preferences.js';
import { MAX_PRESETS_PER_USER, PresetCreateSchema, PresetSchema } from '../src/schemas/presets.js';
import { AuthContextSchema, UserRoleSchema } from '../src/schemas/auth.js';

/** SNZ-016: preference + auth contract parsing. */
describe('UserPreferencesSchema', () => {
  it('accepts a full valid preferences object', () => {
    expect(
      UserPreferencesSchema.parse({
        theme: 'system',
        workspaceLayout: 'side_by_side',
        editorMode: 'plain',
        defaultTone: 'professional',
      }).theme,
    ).toBe('system');
  });

  it('rejects invalid enum strings like the database CHECKs do', () => {
    const base = {
      theme: 'system',
      workspaceLayout: 'side_by_side',
      editorMode: 'plain',
      defaultTone: 'professional',
    };
    expect(UserPreferencesSchema.safeParse({ ...base, theme: 'blue' }).success).toBe(false);
    expect(UserPreferencesSchema.safeParse({ ...base, workspaceLayout: 'stacked' }).success).toBe(
      false,
    );
    expect(UserPreferencesSchema.safeParse({ ...base, editorMode: 'markdown' }).success).toBe(
      false,
    );
    expect(UserPreferencesSchema.safeParse({ ...base, defaultTone: 'mysterious' }).success).toBe(
      false,
    );
  });

  it('accepts partial PATCH payloads and rejects empty updates to enums', () => {
    expect(UserPreferencesUpdateSchema.parse({ theme: 'dark' })).toEqual({ theme: 'dark' });
    expect(UserPreferencesUpdateSchema.parse({})).toEqual({});
    expect(UserPreferencesUpdateSchema.safeParse({ theme: 'blue' }).success).toBe(false);
  });
});

describe('PresetCreateSchema', () => {
  const valid = {
    name: 'My Blog Tone',
    mode: 'natural',
    tone: 'casual',
    clarity: 70,
    sentenceVariety: 60,
  };

  it('accepts a complete preset and trims the name', () => {
    expect(PresetCreateSchema.parse({ ...valid, name: '  Spaced  ' }).name).toBe('Spaced');
  });

  it('rejects blank names, unknown enums, and out-of-range metrics', () => {
    expect(PresetCreateSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false);
    expect(PresetCreateSchema.safeParse({ ...valid, name: 'x'.repeat(61) }).success).toBe(false);
    expect(PresetCreateSchema.safeParse({ ...valid, mode: 'shouty' }).success).toBe(false);
    expect(PresetCreateSchema.safeParse({ ...valid, clarity: 101 }).success).toBe(false);
    expect(PresetCreateSchema.safeParse({ ...valid, sentenceVariety: -1 }).success).toBe(false);
  });

  it('caps free users at five presets and shapes stored rows', () => {
    expect(MAX_PRESETS_PER_USER).toBe(5);
    expect(
      PresetSchema.parse({
        ...valid,
        id: '11111111-1111-4111-8111-111111111111',
        createdAt: '2026-09-13T00:00:00.000Z',
      }).id,
    ).toBe('11111111-1111-4111-8111-111111111111');
  });
});

describe('AuthContextSchema', () => {
  it('accepts verified identities and defaults the role', () => {
    expect(AuthContextSchema.parse({ id: '11111111-1111-4111-8111-111111111111' }).role).toBe(
      'FREE_USER',
    );
    expect(
      AuthContextSchema.parse({
        id: '11111111-1111-4111-8111-111111111111',
        email: 'ada@example.com',
        role: 'ADMIN',
      }).email,
    ).toBe('ada@example.com');
  });

  it('rejects non-UUID ids, bad emails, and unknown roles', () => {
    expect(AuthContextSchema.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
    expect(
      AuthContextSchema.safeParse({ id: '11111111-1111-4111-8111-111111111111', email: 'nope' })
        .success,
    ).toBe(false);
    expect(
      AuthContextSchema.safeParse({ id: '11111111-1111-4111-8111-111111111111', role: 'GOD' })
        .success,
    ).toBe(false);
    expect(UserRoleSchema.safeParse('FREE_USER').success).toBe(true);
  });
});
