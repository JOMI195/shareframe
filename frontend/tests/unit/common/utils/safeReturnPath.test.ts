import { describe, expect, it } from 'vitest';
import { safeReturnPath } from '@/common/utils/safeReturnPath';

describe('safeReturnPath', () => {
  it.each(['/fotos/', '/aktivitaeten/?status=active', '/settings/user/?tab=profil'])('keeps the app path %s', (path) => {
    expect(safeReturnPath(path)).toBe(path);
  });

  it.each([
    ['another host', '//evil.example/'],
    ['another host behind a backslash', '/\\evil.example/'],
    ['an absolute url', 'https://evil.example/'],
    ['a sign-in loop', '/auth/sign-in/'],
    ['nothing', null],
    ['an empty path', ''],
  ])('drops %s', (_name, path) => {
    expect(safeReturnPath(path)).toBeNull();
  });
});
