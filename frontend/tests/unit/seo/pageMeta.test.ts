import { describe, expect, it } from 'vitest';
import { canonicalUrl, findPageMeta, pages, prerenderedPages, SITE_ORIGIN } from '@/seo/pageMeta';

describe('canonicalUrl', () => {
  it('prefixes the site origin', () => {
    expect(canonicalUrl('/kontakt/')).toBe(`${SITE_ORIGIN}/kontakt/`);
  });
});

describe('prerenderedPages', () => {
  it('is exactly the pages flagged for prerendering', () => {
    expect(prerenderedPages.map((page) => page.path)).toEqual([
      '/',
      '/kontakt/',
      '/datenschutzerklaerung/',
      '/impressum/',
    ]);
  });

  it('gives every prerendered page a description', () => {
    prerenderedPages.forEach((page) => expect(page.description?.length).toBeGreaterThan(0));
  });

  it('marks every non-prerendered page noindex', () => {
    pages
      .filter((page) => !page.prerender)
      .forEach((page) => expect(page.noindex).toBe(true));
  });

  it('has unique paths and titles', () => {
    expect(new Set(pages.map((p) => p.path)).size).toBe(pages.length);
    expect(new Set(pages.map((p) => p.title)).size).toBe(pages.length);
  });
});

describe('findPageMeta', () => {
  it('matches an exact path', () => {
    expect(findPageMeta('/impressum/').title).toBe('Impressum – ShareFrame');
  });

  it('normalizes missing leading and trailing slashes', () => {
    expect(findPageMeta('impressum').path).toBe('/impressum/');
  });

  it('falls back to a matchPrefix page', () => {
    expect(findPageMeta('/auth/sign-in/').path).toBe('/auth/');
    expect(findPageMeta('/settings/user/').path).toBe('/settings/');
  });

  it('prefers the longest matching prefix', () => {
    const longest = findPageMeta('/settings/app/');
    expect(longest.path).toBe('/settings/');
  });

  // Unknown routes keep the home title but carry their own path, and are never indexed.
  it('falls back to a noindex copy of the home entry', () => {
    const meta = findPageMeta('/gibt-es-nicht/');
    expect(meta.path).toBe('/gibt-es-nicht/');
    expect(meta.title).toBe(pages[0].title);
    expect(meta.noindex).toBe(true);
    expect(meta.prerender).toBe(false);
  });

  it('does not mutate the source pages when falling back', () => {
    findPageMeta('/gibt-es-nicht/');
    expect(pages[0].path).toBe('/');
    expect(pages[0].noindex).toBeUndefined();
  });
});
