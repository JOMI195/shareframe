import { RootState } from "@/store";
import { IFrame } from "@/types";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  api: {
    loading: boolean;
    otpLoading: boolean;
    lastFetch: number | null;
  };
  frames: IFrame[];
};

const initialState: SliceState = {
  api: {
    loading: false,
    otpLoading: false,
    lastFetch: null,
  },
  frames: []
};

const framesSlice = createSlice({
  name: "frames",
  initialState,
  reducers: {
    framesRequested: (sliceState) => {
      sliceState.api.loading = true;
    },
    framesReceived: (sliceState, action) => {
      sliceState.frames = action.payload;
      sliceState.api.lastFetch = Date.now();
      sliceState.api.loading = false;
    },
    framesRequestFailed: (sliceState) => {
      sliceState.api.loading = false;
    },
    registerFramePending: (sliceState) => {
      sliceState.api.loading = true;
    },
    registerFrameFulfilled: (sliceState, action) => {
      sliceState.frames.unshift(action.payload);
      sliceState.api.lastFetch = Date.now();
      sliceState.api.loading = false;
    },
    unregisterFrameFailed: (sliceState) => {
      sliceState.api.loading = false;
    },
    unregisterFramePending: (sliceState) => {
      sliceState.api.loading = true;
    },
    unregisterFrameFulfilled: (sliceState, action) => {
      const oldCreation = action.payload;
      const index = sliceState.frames.findIndex(
        (frame) => frame.registered_at === oldCreation.registered_at
      );
      sliceState.frames.splice(index, 1);
      sliceState.api.loading = false;
    },
    registerFrameFailed: (sliceState) => {
      sliceState.api.loading = false;
    },
    frameOTPRequested: (sliceState) => {
      sliceState.api.otpLoading = true;
    },
    frameOTPRecieved: (sliceState) => {
      sliceState.api.lastFetch = Date.now();
      sliceState.api.otpLoading = false;
    },
    frameOTPRequestFailed: (sliceState) => {
      sliceState.api.otpLoading = false;
    },
  },
});

export const {
  framesRequested,
  framesReceived,
  framesRequestFailed,
  registerFramePending,
  registerFrameFailed,
  registerFrameFulfilled,
  unregisterFrameFailed,
  unregisterFrameFulfilled,
  unregisterFramePending,
  frameOTPRecieved,
  frameOTPRequested,
  frameOTPRequestFailed
} = framesSlice.actions;
export default framesSlice.reducer;

export const getApi = (state: RootState) => state.entities.frames.api;
export const getFrames = (state: RootState) => state.entities.frames.frames;
