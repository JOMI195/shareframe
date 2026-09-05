import { describe, expect, it } from 'vitest';
import { getReadablyFileSize } from '@/common/utils/files/fileSize.helpers';

describe('getReadablyFileSize', () => {
  it('keeps values up to 900 in bytes', () => {
    expect(getReadablyFileSize(0)).toBe('0 Bytes');
    expect(getReadablyFileSize(900)).toBe('900 Bytes');
  });

  // Divides by 1000 while labelling KB/MB/GB, and the threshold is > 900, not >= 1000.
  it('switches unit above 900 and divides by 1000', () => {
    expect(getReadablyFileSize(901)).toBe('0.9 KB');
    expect(getReadablyFileSize(1000)).toBe('1 KB');
    expect(getReadablyFileSize(1_500_000)).toBe('1.5 MB');
    expect(getReadablyFileSize(2_000_000_000)).toBe('2 GB');
  });

  it('rounds to two decimals', () => {
    expect(getReadablyFileSize(1_234_567)).toBe('1.23 MB');
  });

  it('keeps scaling past GB', () => {
    expect(getReadablyFileSize(9e14)).toBe('900 TB');
  });

  it('stops at the largest known unit', () => {
    expect(getReadablyFileSize(9e30)).toBe('8999999999999999 PB');
  });

  it('returns NaN for non-numeric input', () => {
    expect(getReadablyFileSize(NaN)).toBe('NaN Bytes');
  });

  it('leaves negatives in bytes', () => {
    expect(getReadablyFileSize(-500)).toBe('-500 Bytes');
  });
});
