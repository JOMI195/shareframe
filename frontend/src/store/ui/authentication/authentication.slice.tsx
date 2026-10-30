import { errorText } from "@/common/utils/errors/errorMessages";
import { AlertColor } from "@mui/material";
import { createSlice } from "@reduxjs/toolkit";
import {
  authenticationFulfilled,
  authenticationPending,
  authenticationRejected,
  emailChangeConfirmFulfilled,
  emailChangeConfirmPending,
  emailChangeConfirmRejected,
  emailChangeRequestFulfilled,
  emailChangeRequestPending,
  emailChangeRequestRejected,
  passwordResetFulfilled,
  passwordResetPending,
  passwordResetRejected,
  passwordUpdateFulfilled,
  passwordUpdatePending,
  passwordUpdateRejected,
  resendActivationEmailFulfilled,
  resendActivationEmailPending,
  resendActivationEmailRejected,
  signedOut,
  userActivationFulfilled,
  userActivationPending,
  userActivationRejected,
  userCreationFulfilled,
  userCreationPending,
  userCreationRejected,
  userDeleteFulfilled,
  userDeletePending,
  userDeleteRejected,
  userUpdateFulfilled,
  userUpdatePending,
  userUpdateRejected,
} from "../../entities/authentication/authentication.slice";
import { RootState } from "@/store";

type SliceState = {
  snackbar: {
    alert: { open: boolean; message: string; severity: AlertColor };
    loading: { open: boolean; message: string; };
  };
};

const initialState: SliceState = {
  snackbar: {
    alert: { open: false, message: "", severity: "success" },
    loading: { open: false, message: "", },
  },
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(userCreationPending, (auth) => {
        auth.snackbar.loading = {
          open: true,
          message: "Konto wird erstellt",
        };
      })
      .addCase(userCreationFulfilled, (auth) => {
        auth.snackbar.alert = {
          open: true,
          message: "Konto erstellt",
          severity: "success",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(userCreationRejected, (auth) => {
        auth.snackbar.alert = {
          open: true,
          message: "Konto konnte nicht erstellt werden",
          severity: "error",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(userActivationPending, (auth) => {
        auth.snackbar.loading = {
          open: true,
          message: "Konto wird aktiviert",
        };
      })
      .addCase(userActivationFulfilled, (auth) => {
        auth.snackbar.alert = {
          open: true,
          message: "Konto aktiviert",
          severity: "success",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(userActivationRejected, (auth) => {
        auth.snackbar.alert = {
          open: true,
          message: "Konto konnte nicht aktiviert werden",
          severity: "error",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(authenticationPending, (auth) => {
        auth.snackbar.loading = {
          open: true,
          message: "Du wirst angemeldet",
        };
      })
      .addCase(authenticationFulfilled, (auth) => {
        auth.snackbar.alert = {
          open: true,
          message: "Anmeldung erfolgreich",
          severity: "success",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(authenticationRejected, (auth) => {
        auth.snackbar.alert = {
          open: true,
          message: "Anmeldung fehlgeschlagen",
          severity: "error",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(signedOut, (auth) => {
        auth.snackbar.alert = {
          open: true,
          message: "Abmeldung erfolgreich",
          severity: "success",
        };
      })
      .addCase(passwordResetPending, (auth) => {
        auth.snackbar.loading = {
          open: true,
          message: "E-Mail wird gesendet",
        };
      })
      .addCase(passwordResetFulfilled, (auth) => {
        auth.snackbar.alert = {
          open: true,
          message: "E-Mail zum Zurücksetzen gesendet",
          severity: "success",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(passwordResetRejected, (auth, action) => {
        auth.snackbar.alert = {
          open: true,
          message: errorText(action, "E-Mail konnte nicht gesendet werden"),
          severity: "error",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(passwordUpdatePending, (auth) => {
        auth.snackbar.loading = {
          open: true,
          message: "Passwort wird gespeichert",
        };
      })
      .addCase(passwordUpdateFulfilled, (auth) => {
        auth.snackbar.alert = {
          open: true,
          message: "Passwort geändert",
          severity: "success",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(passwordUpdateRejected, (auth, action) => {
        auth.snackbar.alert = {
          open: true,
          message: errorText(action, "Passwort konnte nicht geändert werden"),
          severity: "error",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(emailChangeRequestPending, (auth) => {
        auth.snackbar.loading = {
          open: true,
          message: "Bestätigungslink wird gesendet",
        };
      })
      .addCase(emailChangeRequestFulfilled, (auth) => {
        auth.snackbar.alert = {
          open: true,
          message: "Bestätigungslink an die neue E-Mail-Adresse gesendet",
          severity: "success",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(emailChangeRequestRejected, (auth, action) => {
        auth.snackbar.alert = {
          open: true,
          message: action.payload || "Änderung der E-Mail-Adresse fehlgeschlagen",
          severity: "error",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(emailChangeConfirmPending, (auth) => {
        auth.snackbar.loading = {
          open: true,
          message: "E-Mail-Adresse wird bestätigt",
        };
      })
      .addCase(emailChangeConfirmFulfilled, (auth) => {
        auth.snackbar.alert = {
          open: true,
          message: "E-Mail-Adresse geändert. Melde dich ab jetzt mit der neuen Adresse an",
          severity: "success",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(emailChangeConfirmRejected, (auth, action) => {
        auth.snackbar.alert = {
          open: true,
          message: action.payload || "Bestätigung der E-Mail-Adresse fehlgeschlagen",
          severity: "error",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(resendActivationEmailPending, (auth) => {
        auth.snackbar.loading = {
          open: true,
          message: "Aktivierungsmail wird gesendet",
        };
      })
      .addCase(resendActivationEmailFulfilled, (auth) => {
        auth.snackbar.alert = {
          open: true,
          message: "Aktivierungsmail gesendet",
          severity: "success",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(resendActivationEmailRejected, (auth) => {
        auth.snackbar.alert = {
          open: true,
          message: "Aktivierungsmail konnte nicht gesendet werden",
          severity: "error",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(userUpdatePending, (auth) => {
        auth.snackbar.loading = {
          open: true,
          message: "Wird gespeichert",
        };
      })
      .addCase(userUpdateFulfilled, (auth) => {
        auth.snackbar.alert = {
          open: true,
          message: "Gespeichert",
          severity: "success",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(userUpdateRejected, (auth, action) => {
        auth.snackbar.alert = {
          open: true,
          message: errorText(action, "Konnte nicht gespeichert werden"),
          severity: "error",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(userDeletePending, (auth) => {
        auth.snackbar.loading = {
          open: true,
          message: "Konto wird gelöscht",
        };
      })
      .addCase(userDeleteFulfilled, (auth) => {
        auth.snackbar.alert = {
          open: true,
          message: "Konto gelöscht",
          severity: "success",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(userDeleteRejected, (auth, action) => {
        auth.snackbar.alert = {
          open: true,
          message: errorText(action, "Konto konnte nicht gelöscht werden"),
          severity: "error",
        };
        auth.snackbar.loading = {
          open: false,
          message: "",
        };
      });
  },
  reducers: {
    alertSnackbarOpened: (auth, action) => {
      auth.snackbar.alert = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity,
      };
    },
    alertSnackbarClosed: (auth) => {
      auth.snackbar.alert = {
        ...auth.snackbar.alert,
        open: false,
      };
    },
    loadingSnackbarOpened: (auth, action) => {
      auth.snackbar.loading = {
        open: true,
        message: action.payload.message,
      };
    },
    loadingSnackbarClosed: (auth) => {
      auth.snackbar.loading = {
        ...auth.snackbar.loading,
        open: false,
      };
    },
  },
});

export const openAuthAlertSnackbar = (payload: {
  message: string;
  severity: string;
}) => ({
  type: alertSnackbarOpened.type,
  payload,
});

export const closeAuthAlertSnackbar = () => ({
  type: alertSnackbarClosed.type,
});

export const openAuthLoadingSnackbar = (payload: {
  message: string;
}) => ({
  type: loadingSnackbarOpened.type,
  payload,
});

export const closeAuthLoadingSnackbar = () => ({
  type: loadingSnackbarClosed.type,
});

const {
  alertSnackbarOpened,
  alertSnackbarClosed,
  loadingSnackbarOpened,
  loadingSnackbarClosed
} = authSlice.actions;

export default authSlice.reducer;

export const getAuthSnackbar = (state: RootState) => state.ui.auth.snackbar;
