import { describe, expect, it } from 'vitest';
import { scrollRestorationKey } from '@/common/utils/scroll';

describe('scrollRestorationKey', () => {
  it('keys full page loads by path', () => {
    expect(scrollRestorationKey({ key: 'default', pathname: '/impressum/' })).toBe('/impressum/');
    expect(scrollRestorationKey({ key: 'default', pathname: '/datenschutzerklaerung/' })).toBe('/datenschutzerklaerung/');
  });

  it('keys in-app navigations by history entry', () => {
    expect(scrollRestorationKey({ key: 'n47rbjj2', pathname: '/impressum/' })).toBe('n47rbjj2');
  });
});
