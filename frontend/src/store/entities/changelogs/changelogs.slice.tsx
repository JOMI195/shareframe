import { RootState } from "@/store";
import { IChangelog, IChangelogId } from "@/types/types.changelogs";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type SliceState = {
    api: {
        loading: boolean;
        idsLoading: boolean;
        lastFetch: number | null;
    };
    changelogIds: IChangelogId[];
    changelogs: IChangelog[];
};

const initialState: SliceState = {
    api: {
        loading: false,
        idsLoading: false,
        lastFetch: null,
    },
    changelogIds: [],
    changelogs: [],
};

const changelogsSlice = createSlice({
    name: "changelogs",
    initialState,
    reducers: {
        changelogIdsRequested: (sliceState) => {
            sliceState.api.idsLoading = true;
        },
        changelogIdsReceived: (sliceState, action: PayloadAction<IChangelogId[]>) => {
            sliceState.changelogIds = action.payload;
            sliceState.api.idsLoading = false;
        },
        changelogIdsRequestFailed: (sliceState) => {
            sliceState.api.idsLoading = false;
        },

        changelogsRequested: (sliceState) => {
            sliceState.api.loading = true;
        },
        changelogsReceived: (sliceState, action: PayloadAction<IChangelog[]>) => {
            sliceState.changelogs = action.payload;
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