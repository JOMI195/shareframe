import { PropsWithChildren, useCallback, useMemo, useReducer } from 'react';
import { initialPromptQueue, PromptId, PromptQueueContext, promptQueueReducer } from './promptQueue';

export const PromptQueueProvider = ({ children }: PropsWithChildren) => {
    const [state, dispatch] = useReducer(promptQueueReducer, initialPromptQueue);
    const request = useCallback((id: PromptId, wants: boolean) => dispatch({ id, wants }), []);
    const value = useMemo(() => ({ active: state.active, request }), [state.active, request]);

    return <PromptQueueContext.Provider value={value}>{children}</PromptQueueContext.Provider>;
};
