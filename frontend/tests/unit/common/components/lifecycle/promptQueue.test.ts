import { describe, expect, it } from 'vitest';
import { initialPromptQueue, promptQueueReducer, type PromptId, type PromptQueueState } from '@/common/components/lifecycle/promptQueue';

const apply = (...steps: [PromptId, boolean][]): PromptQueueState =>
  steps.reduce((state, [id, wants]) => promptQueueReducer(state, { id, wants }), initialPromptQueue);

describe('promptQueueReducer', () => {
  it('grants the first request', () => {
    expect(apply(['push', true]).active).toBe('push');
  });

  it('keeps the active prompt when a higher one arrives later', () => {
    expect(apply(['install', true], ['changelog', true]).active).toBe('install');
  });

  it('picks by priority when several wait', () => {
    const state = promptQueueReducer({ ...initialPromptQueue, wanted: new Set<PromptId>(['push', 'changelog']) }, { id: 'install', wants: true });

    expect(state.active).toBe('changelog');
  });

  it('shows nothing else after the first prompt closes', () => {
    const state = apply(['changelog', true], ['push', true], ['changelog', false]);

    expect(state.active).toBeNull();
    expect(state.spent).toBe(true);
  });

  it('still lets a new build through after a prompt closed', () => {
    expect(apply(['install', true], ['install', false], ['version', true]).active).toBe('version');
  });
});
