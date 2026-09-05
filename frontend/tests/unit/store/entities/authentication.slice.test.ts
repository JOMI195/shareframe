import { afterEach, describe, expect, it, vi } from 'vitest';
import reducer, {
  authenticationFulfilled,
  authenticationPending,
  authenticationRejected,
  emailUpdateFulfilled,
  getUserDataFulfilled,
  getUserDataPending,
  signedOut,
  tokenRefreshFulfilled,
  userDeleteFulfilled,
  userUpdateFulfilled,
  usernameUpdateFulfilled,
} from '@/store/entities/authentication/authentication.slice';
import { seedUser } from '@tests/fixtures';

const initial = () => reducer(undefined, { type: '@@init' });
const signedIn = () => ({ ...initial(), me: seedUser });

afterEach(() => vi.useRealTimers());

// signIn.tsx and protectedRoute.tsx both read localStorage.loggedIn, not redux.
describe('loggedIn flag', () => {
  it.each([
    ['authenticationFulfilled', authenticationFulfilled],
    ['tokenRefreshFulfilled', tokenRefreshFulfilled],
  ])('%s sets it', (_name, action) => {
    reducer(initial(), action());
    expect(localStorage.getItem('loggedIn')).toBe('true');
  });

  it.each([
    ['authenticationRejected', authenticationRejected],
    ['signedOut', signedOut],
    ['userDeleteFulfilled', userDeleteFulfilled],
  ])('%s clears it', (_name, action) => {
    localStorage.setItem('loggedIn', 'true');
    reducer(signedIn(), action());
    expect(localStorage.getItem('loggedIn')).toBeNull();
  });
});

describe('loading flag', () => {
  it('is set while a request is pending and cleared on completion', () => {
    const pending = reducer(initial(), authenticationPending());
    expect(pending.api.loading).toBe(true);
    expect(reducer(pending, authenticationFulfilled()).api.loading).toBe(false);
    expect(reducer(pending, authenticationRejected()).api.loading).toBe(false);
  });

  it('stamps lastFetch on a successful authentication', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
    expect(reducer(initial(), authenticationFulfilled()).api.lastFetch).toBe(
      Date.parse('2026-01-01T00:00:00Z'),
    );
  });
});

describe('profile updates', () => {
  it('replaces the whole user on getUserDataFulfilled', () => {
    const state = reducer(reducer(initial(), getUserDataPending()), getUserDataFulfilled(seedUser));

    expect(state.me).toEqual(seedUser);
    expect(state.api.loading).toBe(false);
  });

  it('replaces the whole user on userUpdateFulfilled', () => {
    expect(reducer(initial(), userUpdateFulfilled(seedUser)).me).toEqual(seedUser);
  });

  // These two take a scalar payload, not a user object.
  it('writes a scalar email and username', () => {
    const withEmail = reducer(signedIn(), emailUpdateFulfilled('neu@example.com'));
    expect(withEmail.me.email).toBe('neu@example.com');
    expect(withEmail.me.username).toBe(seedUser.username);

    expect(reducer(signedIn(), usernameUpdateFulfilled('neu')).me.username).toBe('neu');
  });
});

describe('signedOut', () => {
  it('returns the initial state wholesale', () => {
    const busy = { ...signedIn(), api: { loading: true, lastFetch: 123 } };
    expect(reducer(busy, signedOut())).toEqual(initial());
  });
});

describe('userDeleteFulfilled', () => {
  // The reducer re-inlines a blank user instead of reusing initialState.me;
  // this keeps the two from drifting apart.
  it('blanks the user to exactly the initial shape', () => {
    expect(reducer(signedIn(), userDeleteFulfilled()).me).toEqual(initial().me);
  });
});
