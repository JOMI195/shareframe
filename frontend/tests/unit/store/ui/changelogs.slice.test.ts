import { describe, expect, it } from 'vitest';
import reducer, {
  clearDeactivatedIds,
  clearOutdatedDeactivatedIds,
  getActiveChangelogIds,
  getDeactivatedIds,
  setDeactivatedIds,
  toggleChangelogDeactivation,
} from '@/store/ui/changelogs/changelogs.slice';
import { rootState } from '@tests/helpers/preloadedState';
import { makeChangelogId } from '@tests/fixtures';

const initial = () => reducer(undefined, { type: '@@init' });

describe('deactivated ids', () => {
  it('toggles an id in and out', () => {
    const on = reducer(initial(), toggleChangelogDeactivation(3));
    expect(on.deactivatedIds).toEqual([3]);

    expect(reducer(on, toggleChangelogDeactivation(3)).deactivatedIds).toEqual([]);
  });

  it('replaces and clears the whole list', () => {
    const set = reducer(initial(), setDeactivatedIds([1, 2, 3]));
    expect(set.deactivatedIds).toEqual([1, 2, 3]);
    expect(reducer(set, clearDeactivatedIds()).deactivatedIds).toEqual([]);
  });

  it('drops dismissals for changelogs the server no longer has', () => {
    const set = reducer(initial(), setDeactivatedIds([1, 2, 3]));

    expect(reducer(set, clearOutdatedDeactivatedIds([2, 3, 4])).deactivatedIds).toEqual([2, 3]);
  });

  it('drops everything when the server list is empty', () => {
    const set = reducer(initial(), setDeactivatedIds([1, 2]));
    expect(reducer(set, clearOutdatedDeactivatedIds([])).deactivatedIds).toEqual([]);
  });
});

describe('getActiveChangelogIds', () => {
  const stateWith = (ids: number[], deactivated: number[]) => {
    const state = rootState();
    state.entities.changelogs.changelogIds = ids.map((id) => makeChangelogId({ id }));
    state.ui.changelogs.deactivatedIds = deactivated;
    return state;
  };

  it('subtracts the dismissed ids', () => {
    expect(getActiveChangelogIds(stateWith([1, 2, 3], [2]))).toEqual([1, 3]);
  });

  it('returns everything when nothing is dismissed', () => {
    expect(getActiveChangelogIds(stateWith([1, 2], []))).toEqual([1, 2]);
  });

  it('returns nothing when everything is dismissed', () => {
    expect(getActiveChangelogIds(stateWith([1, 2], [1, 2]))).toEqual([]);
  });

  it('ignores dismissed ids the server never sent', () => {
    expect(getActiveChangelogIds(stateWith([1], [99]))).toEqual([1]);
    expect(getDeactivatedIds(stateWith([1], [99]))).toEqual([99]);
  });
});
