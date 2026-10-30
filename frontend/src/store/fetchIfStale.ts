import { UnknownAction } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "@/store";

const inFlight = new Map<() => UnknownAction, Promise<unknown>>();

export const fetchIfStale =
    (
        getLastFetch: (state: RootState) => number | null,
        maxAgeMs: number,
        request: () => UnknownAction,
    ) =>
    (dispatch: AppDispatch, getState: () => RootState) => {
        const lastFetch = getLastFetch(getState());
        if (lastFetch !== null && Date.now() - lastFetch < maxAgeMs) return;
        if (inFlight.has(request)) return;
        inFlight.set(request, Promise.resolve(dispatch(request())).finally(() => inFlight.delete(request)));
    };
