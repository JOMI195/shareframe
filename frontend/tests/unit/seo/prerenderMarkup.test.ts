import { describe, expect, it } from 'vitest';
import { prerenderMarkup } from '@/seo/prerenderMarkup';
import { landingContent } from '@/seo/landingContent';
import { prerenderedPages } from '@/seo/pageMeta';

describe('prerenderMarkup', () => {
  // The build fails hard if a prerendered page has no markup; catch it here instead.
  it('covers exactly the prerendered pages', () => {
    expect(Object.keys(prerenderMarkup).sort()).toEqual(prerenderedPages.map((p) => p.path).sort());
  });

  it('embeds the landing copy on the home page', () => {
    expect(prerenderMarkup['/']).toContain(landingContent.headline);
    expect(prerenderMarkup['/']).toContain(landingContent.lead);
    expect(prerenderMarkup['/']).toContain(landingContent.ctaLabel);
    expect(prerenderMarkup['/']).toContain(landingContent.contactHint);
  });

  it('links the home CTA at the sign-in route', () => {
    expect(prerenderMarkup['/']).toContain('href="/auth/sign-in/"');
  });

  it('renders non-empty markup with a heading for every page', () => {
    Object.values(prerenderMarkup).forEach((markup) => {
      expect(markup).toContain('<h1');
      expect(markup.length).toBeGreaterThan(100);
    });
  });
});
