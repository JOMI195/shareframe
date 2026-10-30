import { describe, expect, it } from 'vitest';
import { getVariant, getVariantUrl } from '@/common/utils/images';
import { makeImage, makeVariant } from '@tests/fixtures';

describe('getVariant', () => {
  const image = makeImage({
    variants: [makeVariant({ size_name: 'thumbnail' }), makeVariant({ size_name: 'large', width: 1600 })],
  });

  it('finds a present variant', () => {
    expect(getVariant(image, 'large')?.width).toBe(1600);
  });

  it('returns undefined for a missing variant', () => {
    expect(getVariant(image, 'medium')).toBeUndefined();
  });

  it('returns undefined when there are no variants', () => {
    expect(getVariant(makeImage({ variants: [] }), 'thumbnail')).toBeUndefined();
  });
});

describe('getVariantUrl', () => {
  it('returns the url of a present variant', () => {
    const image = makeImage({ variants: [makeVariant({ size_name: 'thumbnail', url: '/thumb.jpg' })] });

    expect(getVariantUrl(image, 'thumbnail')).toBe('/thumb.jpg');
  });

  // A missing variant once produced a request for ".../undefined".
  it('falls back to the original when the variant is missing', () => {
    const image = makeImage({ url: '/original.jpg', variants: [] });

    expect(getVariantUrl(image, 'thumbnail')).toBe('/original.jpg');
  });
});
