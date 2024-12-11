import { RootState } from "@/store";
import { sendFriendshipRequestFailed, sendFriendshipRequestFulfilled, sendFriendshipRequestPending } from "@/store/entities/friendships/friendships.slice";
import { AlertColor } from "@mui/material";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  dialogs: { create: { open: boolean } };
  snackbar: {
    alert: { open: boolean; message: string; severity: AlertColor };
    loading: { open: boolean; message: string; };
  };
};

const initialState: SliceState = {
  dialogs: { create: { open: false } },
  snackbar: {
    alert: { open: false, message: "", severity: "success" },
    loading: { open: false, message: "", },
  },
};

const friendshipsSlice = createSlice({
  name: "friendships",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(sendFriendshipRequestPending, (sliceState) => {
        sliceState.snackbar.loading = {
          open: true,
          message: "Freundschaftsanfrage läuft",
        };
      })
      .addCase(sendFriendshipRequestFulfilled, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Senden der Freundschaftsanfrage erfolgreich",
          severity: "success",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(sendFriendshipRequestFailed, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Senden der Freundschaftsanfrage fehlgeschlagen",
          severity: "error",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
  },
  reducers: {
    createFriendshipDialogOpened: (sliceState) => {
      sliceState.dialogs.create.open = true;
    },
    createFriendshipDialogClosed: (sliceState) => {
      sliceState.dialogs.create.open = false;
    },
    alertSnackbarOpened: (friendships, action) => {
      friendships.snackbar.alert = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity,
      };
    },
    alertSnackbarClosed: (friendships) => {
      friendships.snackbar.alert = {
        ...friendships.snackbar.alert,
        open: false,
      };
    },
    loadingSnackbarOpened: (friendships, action) => {
      friendships.snackbar.loading = {
        open: true,
        message: action.payload.message,
      };
    },
    loadingSnackbarClosed: (friendships) => {
      friendships.snackbar.loading = {
        ...friendships.snackbar.loading,
        open: false,
      };
    },
  },
});

export const openCreateFriendshipsDialog = () => ({
  type: createFriendshipDialogOpened.type,
});

export const closeCreateFriendshipsDialog = () => ({
  type: createFriendshipDialogClosed.type,
});

export const openFriendshipsAlertSnackbar = (payload: {
  message: string;
  severity: string;
}) => ({
  type: alertSnackbarOpened.type,
  payload,
});

export const closeFriendshipsAlertSnackbar = () => ({
  type: alertSnackbarClosed.type,
});

export const openFriendshipsLoadingSnackbar = (payload: {
  message: string;
}) => ({
  type: loadingSnackbarOpened.type,
  payload,
});

export const closeFriendshipsLoadingSnackbar = () => ({
  type: loadingSnackbarClosed.type,
});

export const {
  createFriendshipDialogOpened,
  createFriendshipDialogClosed,
  alertSnackbarOpened,
  alertSnackbarClosed,
  loadingSnackbarClosed,
  loadingSnackbarOpened,
} = friendshipsSlice.actions;

export default friendshipsSlice.reducer;

export const getDialogs = (state: RootState) =>
  state.ui.friendships.dialogs;

export const getSnackbar = (state: RootState) => state.ui.friendships.snackbar;
