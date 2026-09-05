import { describe, expect, it } from 'vitest';
import { getIncomingPendingRequests } from '@/main/friendships/pendingRequests';
import { makeFriendship } from '@tests/fixtures';

const ME = 'alice';

describe('getIncomingPendingRequests', () => {
  it('keeps a pending request addressed to me', () => {
    const incoming = makeFriendship({ id: 1, sender: 'bob', reciever: ME, status: 'pending' });

    expect(getIncomingPendingRequests([incoming], ME)).toEqual([incoming]);
  });

  it('drops requests I sent myself', () => {
    const outgoing = makeFriendship({ id: 1, sender: ME, reciever: 'bob', status: 'pending' });

    expect(getIncomingPendingRequests([outgoing], ME)).toEqual([]);
  });

  it.each([['accepted' as const], ['rejected' as const]])('drops %s friendships', (status) => {
    const friendship = makeFriendship({ sender: 'bob', reciever: ME, status });

    expect(getIncomingPendingRequests([friendship], ME)).toEqual([]);
  });

  // Both sides can send a request; once either is accepted the other is noise.
  it('drops a pending request when that friendship is already accepted', () => {
    const pending = makeFriendship({ id: 1, sender: 'bob', reciever: ME, status: 'pending' });
    const accepted = makeFriendship({ id: 2, sender: ME, reciever: 'bob', status: 'accepted' });

    expect(getIncomingPendingRequests([pending, accepted], ME)).toEqual([]);
  });

  it('drops it regardless of who sent the accepted one', () => {
    const pending = makeFriendship({ id: 1, sender: 'bob', reciever: ME, status: 'pending' });
    const accepted = makeFriendship({ id: 2, sender: 'bob', reciever: ME, status: 'accepted' });

    expect(getIncomingPendingRequests([pending, accepted], ME)).toEqual([]);
  });

  it('keeps requests from other people when one friend is already accepted', () => {
    const fromBob = makeFriendship({ id: 1, sender: 'bob', reciever: ME, status: 'pending' });
    const fromCarol = makeFriendship({ id: 2, sender: 'carol', reciever: ME, status: 'pending' });
    const acceptedBob = makeFriendship({ id: 3, sender: ME, reciever: 'bob', status: 'accepted' });

    expect(getIncomingPendingRequests([fromBob, fromCarol, acceptedBob], ME)).toEqual([fromCarol]);
  });

  it('is empty for an empty list', () => {
    expect(getIncomingPendingRequests([], ME)).toEqual([]);
  });
});
