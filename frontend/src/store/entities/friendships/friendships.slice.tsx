import { RootState } from "@/store";
import { IFriendship } from "@/types";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  api: {
    loading: boolean;
    lastFetch: number | null;
  };
  friendships: IFriendship[];
};

const initialState: SliceState = {
  api: {
    loading: false,
    lastFetch: null,
  },
  friendships: []
};

const friendshipsSlice = createSlice({
  name: "friendships",
  initialState,
  reducers: {
    friendshipsRequested: (sliceState) => {
      sliceState.api.loading = true;
    },
    friendshipsReceived: (sliceState, action) => {
      sliceState.friendships = action.payload;
      sliceState.api.lastFetch = Date.now();
      sliceState.api.loading = false;
    },
    friendshipsRequestFailed: (sliceState) => {
      sliceState.api.loading = false;
    },
    sendFriendshipRequestPending: (sliceState) => {
      sliceState.api.loading = true;
    },
    sendFriendshipRequestFulfilled: (sliceState) => {
      sliceState.api.lastFetch = Date.now();
      sliceState.api.loading = false;
    },
    sendFriendshipRequestFailed: (sliceState) => {
      sliceState.api.loading = false;
    },
    acceptFriendshipRequestPending: (sliceState) => {
      sliceState.api.loading = true;
    },
    acceptFriendshipRequestFulfilled: (sliceState) => {
      sliceState.api.lastFetch = Date.now();
      sliceState.api.loading = false;
    },
    acceptFriendshipRequestFailed: (sliceState) => {
      sliceState.api.loading = false;
    },
    rejectFriendshipRequestPending: (sliceState) => {
      sliceState.api.loading = true;
    },
    rejectFriendshipRequestFulfilled: (sliceState) => {
      sliceState.api.lastFetch = Date.now();
      sliceState.api.loading = false;
    },
    rejectFriendshipRequestFailed: (sliceState) => {
      sliceState.api.loading = false;
    },
  },
});

export const {
  friendshipsRequested,
  friendshipsReceived,
  friendshipsRequestFailed,
  sendFriendshipRequestPending,
  sendFriendshipRequestFailed,
  sendFriendshipRequestFulfilled,
  acceptFriendshipRequestPending,
  acceptFriendshipRequestFailed,
  acceptFriendshipRequestFulfilled,
  rejectFriendshipRequestFailed,
  rejectFriendshipRequestFulfilled,
  rejectFriendshipRequestPending,
} = friendshipsSlice.actions;
export default friendshipsSlice.reducer;

export const getApi = (state: RootState) => state.entities.friendships.api;
export const getFriendships = (state: RootState) => state.entities.friendships.friendships;
