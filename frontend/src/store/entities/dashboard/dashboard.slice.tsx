import { RootState } from "@/store";
import { IDashboardData } from "@/types";
import { signedOut } from "@/store/entities/authentication/authentication.slice";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  api: {
    loading: boolean;
    lastFetch: number | null;
    // Without it a failed load would show zeros, as if the account were empty.
    failed: boolean;
  };
  dashboardData: IDashboardData | null;
};

const initialState: SliceState = {
  api: {
    loading: false,
    lastFetch: null,
    failed: false,
  },
  dashboardData: null,
};

const resetApiState = (sliceState: SliceState) => {
  sliceState.api.loading = false;
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    dashboardStatsRequested: (sliceState) => {
      sliceState.api.loading = true;
      sliceState.api.failed = false;
    },
    dashboardStatsReceived: (sliceState, action) => {
      sliceState.dashboardData = action.payload;
      sliceState.api.lastFetch = Date.now();
      resetApiState(sliceState);
    },
    dashboardStatsRequestFailed: (sliceState) => {
      resetApiState(sliceState);
      sliceState.api.failed = true;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(signedOut, () => initialState);
  },
});

export const {
  dashboardStatsRequested,
  dashboardStatsReceived,
  dashboardStatsRequestFailed
} = dashboardSlice.actions;
export default dashboardSlice.reducer;

export const getApi = (state: RootState) => state.entities.dashboard.api;
export const getDashboardData = (state: RootState) => state.entities.dashboard.dashboardData;