import { UnknownAction } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "@/store";

export const fetchIfStale =
    (
        getLastFetch: (state: RootState) => number | null,
        maxAgeMs: number,
        request: () => UnknownAction,
    ) =>
    (dispatch: AppDispatch, getState: () => RootState) => {
        const lastFetch = getLastFetch(getState());
        if (lastFetch !== null && Date.now() - lastFetch < maxAgeMs) return;
        dispatch(request());
    };
