import { describe, expect, it } from 'vitest';
import { getVariant } from '@/common/utils/images';
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
