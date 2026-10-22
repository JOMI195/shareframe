import { describe, expect, it } from 'vitest';
import { render, renderedPaths } from '@/seo/ssrEntry';
import { landingContent } from '@/seo/landingContent';
import { prerenderedPages } from '@/seo/pageMeta';

// Style extraction only works without a DOM; scripts/verify-seo.mjs checks it on the build.
describe('ssrEntry', () => {
  it('only renders prerendered pages', () => {
    const prerendered = prerenderedPages.map((p) => p.path);
    renderedPaths.forEach((path) => expect(prerendered).toContain(path));
  });

  it('renders the landing copy with exactly one h1', () => {
    const { html } = render('/');

    expect(html).toContain(landingContent.headline);
    expect(html).toContain(landingContent.lead);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
  });

  it('rejects a path without a component', () => {
    expect(() => render('/kontakt/')).toThrow(/no component/);
  });
});
