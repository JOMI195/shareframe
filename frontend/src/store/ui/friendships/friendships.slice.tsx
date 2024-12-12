import { RootState } from "@/store";
import { acceptFriendshipRequestFailed, acceptFriendshipRequestFulfilled, acceptFriendshipRequestPending, friendshipDeleteDeleteFailed, friendshipDeleteDeleteFulfilled, friendshipDeleteRequested, friendshipsReceived, friendshipsRequested, friendshipsRequestFailed, rejectFriendshipRequestFailed, rejectFriendshipRequestFulfilled, rejectFriendshipRequestPending, sendFriendshipRequestFailed, sendFriendshipRequestFulfilled, sendFriendshipRequestPending } from "@/store/entities/friendships/friendships.slice";
import { AlertColor } from "@mui/material";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  dialogs: { create: { open: boolean }, delete: { open: boolean, friendshipId: number | null } };
  snackbar: {
    alert: { open: boolean; message: string; severity: AlertColor };
    loading: { open: boolean; message: string; };
  };
};

const initialState: SliceState = {
  dialogs: { create: { open: false }, delete: { open: false, friendshipId: null } },
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
      .addCase(friendshipsRequested, (sliceState) => {
        sliceState.snackbar.loading = {
          open: true,
          message: "Freundesdaten laden",
        };
      })
      .addCase(friendshipsReceived, (sliceState) => {
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(friendshipsRequestFailed, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Freundesdaten laden fehlgeschlagen",
          severity: "error",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(sendFriendshipRequestPending, (sliceState) => {
        sliceState.snackbar.loading = {
          open: true,
          message: "Freundschaftsanfrage",
        };
      })
      .addCase(sendFriendshipRequestFulfilled, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Freundschaftsanfrage erfolgreich",
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
          message: "Freundschaftsanfrage fehlgeschlagen. Schau mal ob die Anfrage nicht schon gestellt wurde.",
          severity: "error",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(friendshipDeleteRequested, (sliceState) => {
        sliceState.snackbar.loading = {
          open: true,
          message: "Freundschaft löschen",
        };
      })
      .addCase(friendshipDeleteDeleteFulfilled, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Freundschaft löschen erfolgreich",
          severity: "success",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(friendshipDeleteDeleteFailed, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Freundschaft löschen fehlgeschlagen",
          severity: "error",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(acceptFriendshipRequestPending, (sliceState) => {
        sliceState.snackbar.loading = {
          open: true,
          message: "Freundschaftsanfrage annehmen",
        };
      })
      .addCase(acceptFriendshipRequestFulfilled, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Freundschaftsanfrage annehmen erfolgreich",
          severity: "success",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(acceptFriendshipRequestFailed, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Freundschaftsanfrage annehmen fehlgeschlagen",
          severity: "error",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(rejectFriendshipRequestPending, (sliceState) => {
        sliceState.snackbar.loading = {
          open: true,
          message: "Freundschaftsanfrage ablehnen",
        };
      })
      .addCase(rejectFriendshipRequestFulfilled, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Freundschaftsanfrage ablehnen erfolgreich",
          severity: "success",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(rejectFriendshipRequestFailed, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Freundschaftsanfrage ablehnen fehlgeschlagen",
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
    deleteFriendshipDialogOpened: (sliceState, action) => {
      sliceState.dialogs.delete.open = true;
      sliceState.dialogs.delete.friendshipId = action.payload.friendshipId;
    },
    deleteFriendshipDialogClosed: (sliceState) => {
      sliceState.dialogs.delete.open = false;
      sliceState.dialogs.delete.friendshipId = null;
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

export const openDeleteFriendshipsDialog = (payload: { friendshipId: number }) => ({
  type: deleteFriendshipDialogOpened.type,
  payload
});

export const closeDeleteFriendshipsDialog = () => ({
  type: deleteFriendshipDialogClosed.type,
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
  deleteFriendshipDialogClosed,
  deleteFriendshipDialogOpened
} = friendshipsSlice.actions;

export default friendshipsSlice.reducer;

export const getDialogs = (state: RootState) =>
  state.ui.friendships.dialogs;

export const getFriendshipsSnackbar = (state: RootState) => state.ui.friendships.snackbar;
