import { describe, expect, it } from 'vitest';
import { prerenderMarkup } from '@/seo/prerenderMarkup';
import { prerenderedPages } from '@/seo/pageMeta';
import { renderedPaths } from '@/seo/ssrEntry';

describe('prerenderMarkup', () => {
  // The build fails hard if a prerendered page has neither markup nor a component; catch it here instead.
  it('covers exactly the prerendered pages not rendered from React', () => {
    const expected = prerenderedPages.map((p) => p.path).filter((path) => !renderedPaths.includes(path));
    expect(Object.keys(prerenderMarkup).sort()).toEqual(expected.sort());
  });

  it('renders non-empty markup with a heading for every page', () => {
    Object.values(prerenderMarkup).forEach((markup) => {
      expect(markup).toContain('<h1');
      expect(markup.length).toBeGreaterThan(100);
    });
  });
});
