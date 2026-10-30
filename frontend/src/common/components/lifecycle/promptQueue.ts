import { createContext, useContext, useEffect } from 'react';

export type PromptId = 'version' | 'changelog' | 'install' | 'push';

const PRIORITY: PromptId[] = ['version', 'changelog', 'install', 'push'];

export interface PromptQueueState {
    wanted: ReadonlySet<PromptId>;
    active: PromptId | null;
    spent: boolean;
}

export const initialPromptQueue: PromptQueueState = { wanted: new Set(), active: null, spent: false };

// One prompt per launch; a new build may still interrupt.
export const promptQueueReducer = (
    state: PromptQueueState,
    { id, wants }: { id: PromptId; wants: boolean },
): PromptQueueState => {
    if (state.wanted.has(id) === wants) return state;

    const wanted = new Set(state.wanted);
    if (wants) wanted.add(id);
    else wanted.delete(id);

    const released = state.active !== null && !wanted.has(state.active);
    const spent = state.spent || released;
    const active = released || state.active === null
        ? PRIORITY.find((candidate) => wanted.has(candidate) && (!spent || candidate === 'version')) ?? null
        : state.active;

    return { wanted, active, spent };
};

interface PromptQueue {
    active: PromptId | null;
    request: (id: PromptId, wants: boolean) => void;
}

export const PromptQueueContext = createContext<PromptQueue | null>(null);

export const usePromptSlot = (id: PromptId, wants: boolean): boolean => {
    const queue = useContext(PromptQueueContext);
    const request = queue?.request;

    useEffect(() => {
        request?.(id, wants);
    }, [request, id, wants]);

    useEffect(() => () => request?.(id, false), [request, id]);

    if (!queue) return wants;
    return wants && queue.active === id;
};
