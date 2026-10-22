import { useSyncExternalStore } from 'react';

let run = 0;
const listeners = new Set<() => void>();

export const triggerFlyby = () => {
    run += 1;
    listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const useFlybyRun = () => useSyncExternalStore(subscribe, () => run, () => 0);
