import { describe, expect, it } from 'vitest';
import { errorText } from '@/common/utils/errors/errorMessages';

describe('errorText', () => {
  it('uses the text for a known code', () => {
    expect(errorText({ type: 'x', meta: { code: 'wrong_password' } }, 'Fallback')).toBe('Das Passwort stimmt nicht.');
  });

  it.each([
    ['an unknown code', { type: 'x', meta: { code: 'nope' } }],
    ['no code', { type: 'x', meta: { code: undefined } }],
    ['no meta', { type: 'x' }],
  ])('falls back for %s', (_name, action) => {
    expect(errorText(action, 'Fallback')).toBe('Fallback');
  });
});
