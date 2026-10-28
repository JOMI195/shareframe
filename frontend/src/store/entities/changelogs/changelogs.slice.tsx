import { RootState } from "@/store";
import { IChangelog, IChangelogId } from "@/types/types.changelogs";
import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";

type SliceState = {
    api: {
        loading: boolean;
        idsLoading: boolean;
        lastFetch: number | null;
        idsLastFetch: number | null;
    };
    changelogIds: IChangelogId[];
    changelogs: IChangelog[];
};

const initialState: SliceState = {
    api: {
        loading: false,
        idsLoading: false,
        lastFetch: null,
        idsLastFetch: null,
    },
    changelogIds: [],
    changelogs: [],
};

const sameIds = (current: IChangelogId[], received: IChangelogId[]) =>
    current.length === received.length &&
    current.every((item, i) =>
        item.id === received[i].id &&
        item.date === received[i].date &&
        item.title === received[i].title &&
        item.is_published === received[i].is_published
    );

const changelogsSlice = createSlice({
    name: "changelogs",
    initialState,
    reducers: {
        changelogIdsRequested: (sliceState) => {
            sliceState.api.idsLoading = true;
        },
        changelogIdsReceived: (sliceState, action: PayloadAction<IChangelogId[]>) => {
            sliceState.api.idsLoading = false;
            sliceState.api.idsLastFetch = Date.now();
            // Same list keeps its reference, so effects keyed on it don't refetch.
            if (sameIds(sliceState.changelogIds, action.payload)) return;
            sliceState.changelogIds = action.payload;
            const listed = new Set(action.payload.map(item => item.id));
            sliceState.changelogs = sliceState.changelogs.filter(log => listed.has(log.id));
        },
        changelogIdsRequestFailed: (sliceState) => {
            sliceState.api.idsLoading = false;
        },

        changelogsRequested: (sliceState) => {
            sliceState.api.loading = true;
        },
        changelogsReceived: (sliceState, action: PayloadAction<IChangelog[]>) => {
            // Merged, not replaced: overlapping requests fetch different id subsets.
            const received = new Set(action.payload.map(log => log.id));
            sliceState.changelogs = [
                ...sliceState.changelogs.filter(log => !received.has(log.id)),
                ...action.payload,
            ];
            sliceState.api.lastFetch = Date.now();
            sliceState.api.loading = false;
        },
        changelogsRequestFailed: (sliceState) => {
            sliceState.api.loading = false;
        },
    },
});

export const {
    changelogIdsRequested,
    changelogIdsReceived,
    changelogIdsRequestFailed,
    changelogsRequested,
    changelogsReceived,
    changelogsRequestFailed,
} = changelogsSlice.actions;

export default changelogsSlice.reducer;

export const getApi = (state: RootState) => state.entities.changelogs.api;
export const getChangelogIds = (state: RootState) => state.entities.changelogs.changelogIds;
export const getChangelogs = (state: RootState) => state.entities.changelogs.changelogs;

export const getSortedChangelogIds = createSelector(
    [getChangelogIds],
    (changelogIds) => [...changelogIds].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
);
