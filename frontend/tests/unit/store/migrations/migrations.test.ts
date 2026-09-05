import { describe, expect, it } from 'vitest';
import migrations from '@/store/migrations';

const PERSIST_VERSION = 10;

describe('migration manifest', () => {
  const keys = Object.keys(migrations).map(Number).sort((a, b) => a - b);

  it('is contiguous from 2', () => {
    expect(keys).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  // Adding a migration without bumping persistConfig.version means it never runs.
  it('tops out at the configured persist version', () => {
    expect(Math.max(...keys)).toBe(PERSIST_VERSION);
  });

  it('exposes a function per version', () => {
    keys.forEach((key) => expect(typeof migrations[key]).toBe('function'));
  });
});
