import { describe, expect, it } from 'vitest';
import { formatDuration, getActiveDurationMs, getSentImageState } from '@/main/sentImages/sentImageStatus';
import { makeSentImage } from '@tests/fixtures';

const now = Date.UTC(2026, 0, 1, 12);

describe('getSentImageState', () => {
  it('is scheduled regardless of the expiry', () => {
    const sentImage = makeSentImage({ status: 'scheduled', expires_at: '2000-01-01T00:00:00Z' });
    expect(getSentImageState(sentImage, now)).toBe('scheduled');
  });

  it('is active before the expiry', () => {
    expect(getSentImageState(makeSentImage({ expires_at: '2026-01-02T00:00:00Z' }), now)).toBe('active');
  });

  it('is expired after the expiry', () => {
    expect(getSentImageState(makeSentImage({ expires_at: '2025-12-31T00:00:00Z' }), now)).toBe('expired');
  });
});

const HOUR = 3600 * 1000;

describe('getActiveDurationMs', () => {
  it('runs from sending to expiry', () => {
    const sentImage = makeSentImage({ sent_at: '2026-01-01T10:00:00Z', expires_at: '2026-01-02T10:00:00Z' });
    expect(getActiveDurationMs(sentImage)).toBe(24 * HOUR);
  });

  it('runs from the planned time for a scheduled send', () => {
    const sentImage = makeSentImage({
      status: 'scheduled',
      sent_at: '2026-01-01T10:00:00Z',
      scheduled_for: '2026-01-03T10:00:00Z',
      expires_at: '2026-01-04T10:00:00Z',
    });
    expect(getActiveDurationMs(sentImage)).toBe(24 * HOUR);
  });

  // Deactivating backdates the expiry, which can land before the send itself.
  it('never goes negative', () => {
    const sentImage = makeSentImage({ sent_at: '2026-01-01T10:00:00Z', expires_at: '2026-01-01T09:59:00Z' });
    expect(getActiveDurationMs(sentImage)).toBe(0);
  });
});

describe('formatDuration', () => {
  it.each([
    [24 * HOUR, '1 Tag'],
    [7 * 24 * HOUR, '7 Tage'],
    [26 * HOUR + 30 * 60 * 1000, '1 Tag 2 Stunden 30 Minuten'],
    [HOUR, '1 Stunde'],
    [60 * 1000, '1 Minute'],
    [20 * 1000, 'weniger als 1 Minute'],
  ])('formats %d ms as %s', (durationMs, expected) => {
    expect(formatDuration(durationMs)).toBe(expected);
  });
});
