import { RootState } from "@/store";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  api: {
    loading: boolean;
    lastFetch: number | null;
  };
  version: string;
};

const initialState: SliceState = {
  api: {
    loading: false,
    lastFetch: null,
  },
  version: "",
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    versionRequestedPending: (state) => {
      state.api.loading = true;
    },
    versionRequestedFulfilled: (state, action) => {
      state.api.lastFetch = Date.now();
      state.api.loading = false;
      state.version = action.payload.version;
    },
    versionRequestedFailed: (state) => {
      state.api.loading = false;
    },
  },
});

export const {
  versionRequestedPending,
  versionRequestedFulfilled,
  versionRequestedFailed
} = appSlice.actions;
export default appSlice.reducer;

export const getApi = (state: RootState) => state.entities.app.api;
export const getAppVersion = (state: RootState) => state.entities.app.version;