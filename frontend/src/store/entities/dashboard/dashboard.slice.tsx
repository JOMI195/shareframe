import { RootState } from "@/store";
import { IDashboardData } from "@/types";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  api: {
    loading: boolean;
    lastFetch: number | null;
  };
  dashboardData: IDashboardData | null;
};

const initialState: SliceState = {
  api: {
    loading: false,
    lastFetch: null,
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
    },
    dashboardStatsReceived: (sliceState, action) => {
      sliceState.dashboardData = action.payload;
      sliceState.api.lastFetch = Date.now();
      resetApiState(sliceState);
    },
    dashboardStatsRequestFailed: (sliceState) => {
      resetApiState(sliceState);
    },
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