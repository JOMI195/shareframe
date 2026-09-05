import { describe, expect, it } from 'vitest';
import migration6 from '@/store/migrations/migration6';
import { rootState } from '@tests/helpers/preloadedState';

describe('migration6', () => {
  it('adds the frame OTP loading flag and dialog', () => {
    const after = migration6(rootState());

    expect(after.entities.frames.api.otpLoading).toBe(false);
    expect(after.ui.frames.dialogs.requestOTP).toEqual({ open: false, frameId: null });
  });

  it('keeps the other frame api flags and dialogs', () => {
    const before = rootState();
    before.entities.frames.api.loading = true;
    before.ui.frames.dialogs.register.open = true;

    const after = migration6(before);

    expect(after.entities.frames.api.loading).toBe(true);
    expect(after.ui.frames.dialogs.register.open).toBe(true);
  });
});
