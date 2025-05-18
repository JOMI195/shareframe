import * as changelogsSlice from "./changelogs.slice";
import { AppDispatch } from "@/store";

export const toggleChangelogDeactivation =
    (id: number) => (dispatch: AppDispatch) => {
        dispatch(changelogsSlice.toggleChangelogDeactivation(id));
    };

export const setDeactivatedIds =
    (ids: number[]) => (dispatch: AppDispatch) => {
        dispatch(changelogsSlice.setDeactivatedIds(ids));
    };

export const clearDeactivatedIds = () => (dispatch: AppDispatch) => {
    dispatch(changelogsSlice.clearDeactivatedIds());
};

export const clearOutdatedDeactivatedIds = (allIds: number[]) => (dispatch: AppDispatch) => {
    dispatch(changelogsSlice.clearOutdatedDeactivatedIds(allIds));
};