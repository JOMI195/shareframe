import { RootState } from "@/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type SliceState = {
    deactivatedIds: number[];
};

const initialState: SliceState = {
    deactivatedIds: []
};

const changelogsSlice = createSlice({
    name: "changelogs",
    initialState,
    reducers: {
        toggleChangelogDeactivation: (sliceState, action: PayloadAction<number>) => {
            const id = action.payload;
            const index = sliceState.deactivatedIds.indexOf(id);

            if (index === -1) {
                sliceState.deactivatedIds.push(id);
            } else {
                sliceState.deactivatedIds.splice(index, 1);
            }
        },
        setDeactivatedIds: (sliceState, action: PayloadAction<number[]>) => {
            sliceState.deactivatedIds = action.payload;
        },
        clearDeactivatedIds: (sliceState) => {
            sliceState.deactivatedIds = [];
        },
        clearOutdatedDeactivatedIds: (sliceState, action: PayloadAction<number[]>) => {
            const availableIds = action.payload;
            sliceState.deactivatedIds = sliceState.deactivatedIds.filter(
                id => availableIds.includes(id)
            );
        },
    },
});

export const {
    toggleChangelogDeactivation,
    setDeactivatedIds,
    clearDeactivatedIds,
    clearOutdatedDeactivatedIds
} = changelogsSlice.actions;

export default changelogsSlice.reducer;

export const getDeactivatedIds = (state: RootState) => state.ui.changelogs.deactivatedIds;
export const getActiveChangelogIds = (state: RootState) => {
    const allIds = state.entities.changelogs.changelogIds.map(item => item.id);
    const deactivatedIds = state.ui.changelogs.deactivatedIds;
    return allIds.filter(id => !deactivatedIds.includes(id));
};