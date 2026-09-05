import { describe, expect, it } from 'vitest';
import { isICoreUser } from '@/types/types.user';
import { isIImage } from '@/types/types.images';
import { isIFriendship } from '@/types/types.friendships';
import { isIFrameOTP, isIFrameResponse } from '@/types/types.frames';
import { makeFrame, makeFriendship, makeImage, makeVariant, seedUser } from '@tests/fixtures';

// The guards short-circuit on `candidate &&`, so they return the falsy operand
// rather than a boolean. Assert truthiness, never toBe(false).
describe('runtime type guards', () => {
  it('accepts well-formed payloads', () => {
    expect(isICoreUser(seedUser)).toBeTruthy();
    expect(isIImage(makeImage())).toBeTruthy();
    expect(isIFriendship(makeFriendship())).toBeTruthy();
    expect(isIFrameResponse(makeFrame())).toBeTruthy();
    expect(isIFrameOTP({ otp: '123456', expires_in_minutes: '5' })).toBeTruthy();
  });

  it('rejects nullish input', () => {
    for (const guard of [isICoreUser, isIImage, isIFriendship, isIFrameResponse, isIFrameOTP]) {
      expect(guard(null)).toBeFalsy();
      expect(guard(undefined)).toBeFalsy();
    }
  });

  it('rejects payloads with a wrong field type', () => {
    expect(isICoreUser({ ...seedUser, id: '1' })).toBeFalsy();
    expect(isIFriendship(makeFriendship({ id: '1' as unknown as number }))).toBeFalsy();
    expect(isIFrameResponse(makeFrame({ is_active: 'yes' as unknown as boolean }))).toBeFalsy();
    expect(isIFrameOTP({ otp: '123456', expires_in_minutes: 5 })).toBeFalsy();
  });

  it('validates every image variant, not just the first', () => {
    const bad = makeImage({
      variants: [makeVariant(), makeVariant({ size_name: 'xlarge' as unknown as 'large' })],
    });
    expect(isIImage(bad)).toBeFalsy();
  });

  it('accepts a null variant height', () => {
    expect(isIImage(makeImage({ variants: [makeVariant({ height: null })] }))).toBeTruthy();
  });
});
