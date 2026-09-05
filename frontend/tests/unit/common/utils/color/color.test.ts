import { describe, expect, it } from 'vitest';
import { stringToColor } from '@/common/utils/color/color';

describe('stringToColor', () => {
  it('is deterministic', () => {
    expect(stringToColor('alice')).toBe(stringToColor('alice'));
    expect(stringToColor('alice')).not.toBe(stringToColor('bob'));
  });

  it('returns black for the empty string', () => {
    expect(stringToColor('')).toBe('#000000');
  });

  it('always produces a 7-character hex color', () => {
    for (const input of ['a', 'alice', 'a very long user name here', 'äöü', '1']) {
      expect(stringToColor(input)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
