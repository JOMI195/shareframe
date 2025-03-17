import { RootState } from "@/store";
import { framesRequestFailed, registerFramePending, registerFrameFailed, registerFrameFulfilled, unregisterFramePending, unregisterFrameFulfilled, unregisterFrameFailed, frameOTPRequested, frameOTPRecieved, frameOTPRequestFailed } from "@/store/entities/frames/frames.slice";
import { AlertColor } from "@mui/material";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  dialogs: { register: { open: boolean }, unregister: { open: boolean, frameId: number | null }, requestOTP: { open: boolean, frameId: number | null }, };
  snackbar: {
    alert: { open: boolean; message: string; severity: AlertColor };
    loading: { open: boolean; message: string; };
  };
};

const initialState: SliceState = {
  dialogs: { register: { open: false }, unregister: { open: false, frameId: null }, requestOTP: { open: false, frameId: null } },
  snackbar: {
    alert: { open: false, message: "", severity: "success" },
    loading: { open: false, message: "", },
  },
};

const framesSlice = createSlice({
  name: "frames",
  initialState,
  extraReducers: (builder) => {
    builder
      // .addCase(framesRequested, (sliceState) => {
      //   sliceState.snackbar.loading = {
      //     open: true,
      //     message: "Bilderrahmen laden",
      //   };
      // })
      // .addCase(framesReceived, (sliceState) => {
      //   sliceState.snackbar.loading = {
      //     open: false,
      //     message: "",
      //   };
      // })
      .addCase(framesRequestFailed, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Bilderrahmen laden fehlgeschlagen",
          severity: "error",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(registerFramePending, (sliceState) => {
        sliceState.snackbar.loading = {
          open: true,
          message: "Bilderrahmen registrieren",
        };
      })
      .addCase(registerFrameFulfilled, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Bilderrahmen registrieren erfolgreich",
          severity: "success",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(registerFrameFailed, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Bilderrahmen registrieren fehlgeschlagen",
          severity: "error",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(unregisterFramePending, (sliceState) => {
        sliceState.snackbar.loading = {
          open: true,
          message: "Bilderrahmen vom Nutzer lösen",
        };
      })
      .addCase(unregisterFrameFulfilled, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Bilderrahmen vom Nutzer lösen erfolgreich",
          severity: "success",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(unregisterFrameFailed, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Bilderrahmen vom Nutzer lösen fehlgeschlagen",
          severity: "error",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(frameOTPRequested, (sliceState) => {
        sliceState.snackbar.loading = {
          open: true,
          message: "Generiere OTP",
        };
      })
      .addCase(frameOTPRecieved, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "OTP erfolgreich generiert",
          severity: "success",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(frameOTPRequestFailed, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Generierung von OTP fehlgeschlagen",
          severity: "error",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
  },
  reducers: {
    registerFrameDialogOpened: (sliceState) => {
      sliceState.dialogs.register.open = true;
    },
    registerFrameDialogClosed: (sliceState) => {
      sliceState.dialogs.register.open = false;
    },
    unregisterFrameDialogOpened: (sliceState, action) => {
      sliceState.dialogs.unregister.open = true;
      sliceState.dialogs.unregister.frameId = action.payload.frameId;
    },
    unregisterFrameDialogClosed: (sliceState) => {
      sliceState.dialogs.unregister.open = false;
      sliceState.dialogs.unregister.frameId = null;
    },
    alertSnackbarOpened: (frames, action) => {
      frames.snackbar.alert = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity,
      };
    },
    alertSnackbarClosed: (frames) => {
      frames.snackbar.alert = {
        ...frames.snackbar.alert,
        open: false,
      };
    },
    loadingSnackbarOpened: (frames, action) => {
      frames.snackbar.loading = {
        open: true,
        message: action.payload.message,
      };
    },
    loadingSnackbarClosed: (frames) => {
      frames.snackbar.loading = {
        ...frames.snackbar.loading,
        open: false,
      };
    },
    obtainFrameOTPDialogOpened: (sliceState, action) => {
      sliceState.dialogs.requestOTP.open = true;
      sliceState.dialogs.requestOTP.frameId = action.payload.frameId;
    },
    obtainFrameOTPDialogClosed: (sliceState) => {
      sliceState.dialogs.requestOTP.open = false;
      sliceState.dialogs.requestOTP.frameId = null;
    },
  },
});

export const openRegisterFrameDialog = () => ({
  type: registerFrameDialogOpened.type,
});

export const closeRegisterFrameDialog = () => ({
  type: registerFrameDialogClosed.type,
});

export const openUnregisterFrameDialog = (payload: { frameId: number }) => ({
  type: unregisterFrameDialogOpened.type,
  payload
});

export const closeUnregisterFrameDialog = () => ({
  type: unregisterFrameDialogClosed.type,
});

export const openFramesAlertSnackbar = (payload: {
  message: string;
  severity: string;
}) => ({
  type: alertSnackbarOpened.type,
  payload,
});

export const closeFramesAlertSnackbar = () => ({
  type: alertSnackbarClosed.type,
});

export const openFramesLoadingSnackbar = (payload: {
  message: string;
}) => ({
  type: loadingSnackbarOpened.type,
  payload,
});

export const closeFramesLoadingSnackbar = () => ({
  type: loadingSnackbarClosed.type,
});

export const openRequestOTPDialog = (payload: { frameId: number }) => ({
  type: obtainFrameOTPDialogOpened.type,
  payload
});

export const closeRequestOTPDialog = () => ({
  type: obtainFrameOTPDialogClosed.type,
});

export const {
  registerFrameDialogOpened,
  registerFrameDialogClosed,
  alertSnackbarOpened,
  alertSnackbarClosed,
  loadingSnackbarClosed,
  loadingSnackbarOpened,
  unregisterFrameDialogClosed,
  unregisterFrameDialogOpened,
  obtainFrameOTPDialogOpened,
  obtainFrameOTPDialogClosed
} = framesSlice.actions;

export default framesSlice.reducer;

export const getDialogs = (state: RootState) =>
  state.ui.frames.dialogs;

export const getFramesSnackbar = (state: RootState) => state.ui.frames.snackbar;
