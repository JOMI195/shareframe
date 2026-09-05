import { afterEach, describe, expect, it, vi } from 'vitest';
import reducer, {
  acceptFriendshipRequestFailed,
  acceptFriendshipRequestFulfilled,
  acceptFriendshipRequestPending,
  friendshipDeleteDeleteFailed,
  friendshipDeleteDeleteFulfilled,
  friendshipDeleteRequested,
  friendshipsReceived,
  friendshipsRequestFailed,
  friendshipsRequested,
  rejectFriendshipRequestFailed,
  rejectFriendshipRequestFulfilled,
  rejectFriendshipRequestPending,
  sendFriendshipRequestFailed,
  sendFriendshipRequestFulfilled,
  sendFriendshipRequestPending,
} from '@/store/entities/friendships/friendships.slice';
import { makeFriendship } from '@tests/fixtures';

const initial = () => reducer(undefined, { type: '@@init' });

afterEach(() => vi.useRealTimers());

describe('friendships slice loading flags', () => {
  it.each([
    ['friendshipsRequested', friendshipsRequested, true],
    ['sendFriendshipRequestPending', sendFriendshipRequestPending, true],
    ['acceptFriendshipRequestPending', acceptFriendshipRequestPending, true],
    ['rejectFriendshipRequestPending', rejectFriendshipRequestPending, true],
    ['friendshipDeleteRequested', friendshipDeleteRequested, true],
    ['friendshipsRequestFailed', friendshipsRequestFailed, false],
    ['sendFriendshipRequestFailed', sendFriendshipRequestFailed, false],
    ['acceptFriendshipRequestFailed', acceptFriendshipRequestFailed, false],
    ['rejectFriendshipRequestFailed', rejectFriendshipRequestFailed, false],
    ['friendshipDeleteDeleteFailed', friendshipDeleteDeleteFailed, false],
  ])('%s sets loading to %s', (_name, action, expected) => {
    expect(reducer(initial(), action()).api.loading).toBe(expected);
  });

  it.each([
    ['acceptFriendshipRequestFulfilled', acceptFriendshipRequestFulfilled],
    ['rejectFriendshipRequestFulfilled', rejectFriendshipRequestFulfilled],
  ])('%s clears loading and stamps lastFetch without changing the list', (_name, action) => {
    vi.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const friendships = [makeFriendship()];

    const state = reducer({ ...initial(), friendships }, action());

    expect(state.api.loading).toBe(false);
    expect(state.api.lastFetch).toBe(Date.parse('2026-01-01T00:00:00Z'));
    expect(state.friendships).toEqual(friendships);
  });
});

describe('friendshipsReceived', () => {
  it('replaces the list', () => {
    const friendships = [makeFriendship({ id: 1 }), makeFriendship({ id: 2 })];
    const state = reducer(reducer(initial(), friendshipsRequested()), friendshipsReceived(friendships));

    expect(state.friendships).toEqual(friendships);
    expect(state.api.loading).toBe(false);
  });
});

describe('sendFriendshipRequestFulfilled', () => {
  it('prepends the new request', () => {
    const existing = makeFriendship({ id: 1, created_at: '2026-01-01T00:00:00Z' });
    const added = makeFriendship({ id: 2, created_at: '2026-02-01T00:00:00Z', status: 'pending' });

    const state = reducer({ ...initial(), friendships: [existing] }, sendFriendshipRequestFulfilled(added));

    expect(state.friendships.map((f) => f.id)).toEqual([2, 1]);
  });
});

describe('friendshipDeleteDeleteFulfilled', () => {
  const a = makeFriendship({ id: 1, created_at: '2026-01-01T00:00:00Z' });
  const b = makeFriendship({ id: 2, created_at: '2026-02-01T00:00:00Z' });

  it('removes the friendship matching created_at', () => {
    const state = reducer({ ...initial(), friendships: [a, b] }, friendshipDeleteDeleteFulfilled(a));
    expect(state.friendships.map((f) => f.id)).toEqual([2]);
  });

  it('keeps the list untouched when nothing matches', () => {
    const unknown = makeFriendship({ id: 9, created_at: '2099-01-01T00:00:00Z' });

    const state = reducer({ ...initial(), friendships: [a, b] }, friendshipDeleteDeleteFulfilled(unknown));

    expect(state.friendships.map((f) => f.id)).toEqual([1, 2]);
  });
});
