import { RootState } from "@/store";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  api: {
    loading: boolean;
    lastFetch: number | null;
  };
};

const initialState: SliceState = {
  api: {
    loading: false,
    lastFetch: null,
  },
};

const contactSlice = createSlice({
  name: "contact",
  initialState,
  reducers: {
    contactEmailSendingPending: (jokes) => {
      jokes.api.loading = true;
    },
    contactEmailSendingFulfilled: (jokes) => {
      jokes.api.lastFetch = Date.now();
      jokes.api.loading = false;
    },
    contactEmailSendingFailed: (jokes) => {
      jokes.api.loading = false;
    },
  },
});

export const {
  contactEmailSendingPending,
  contactEmailSendingFulfilled,
  contactEmailSendingFailed
} = contactSlice.actions;
export default contactSlice.reducer;

export const getApi = (state: RootState) => state.entities.contact.api;
