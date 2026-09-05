import rootReducer from '@/store/rootReducer';
import type { RootState } from '@/store';
import type { RootReducerState } from '@/store/setupStore';
import { seedUser } from '../fixtures';

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U> ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K];
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const merge = <T>(base: T, over: DeepPartial<T>): T => {
  const result = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(over as Record<string, unknown>)) {
    const current = result[key];
    result[key] = isPlainObject(value) && isPlainObject(current) ? merge(current, value) : value;
  }
  return result as T;
};

// Cloned: RTK freezes slice initial state, and tests need to mutate it.
export const defaultState = (): RootReducerState =>
  structuredClone(rootReducer(undefined, { type: '@@tests/INIT' }));

export const buildState = (over: DeepPartial<RootReducerState> = {}): RootReducerState =>
  merge(defaultState(), over);

// protectedRoute gates on localStorage, not redux; redux only drives the profile spinner.
export const signedInState = (over: DeepPartial<RootReducerState> = {}): RootReducerState => {
  localStorage.setItem('loggedIn', 'true');
  return buildState(merge({ auth: { user: { me: seedUser } } } as DeepPartial<RootReducerState>, over));
};

// RootState is the root reducer's state plus redux-persist's own key. Migrations
// and the app selectors are typed against it.
export const rootState = (over: DeepPartial<RootReducerState> = {}): RootState => ({
  ...buildState(over),
  _persist: { version: 10, rehydrated: true },
});
