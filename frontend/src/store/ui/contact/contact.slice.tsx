import { RootState } from "@/store";
import { contactEmailSendingFailed, contactEmailSendingFulfilled, contactEmailSendingPending } from "@/store/entities/contact/contact.slice";
import { AlertColor } from "@mui/material";
import { createSlice } from "@reduxjs/toolkit";

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

const contactSlice = createSlice({
    name: "contact",
    initialState,
    extraReducers: (builder) => {
        builder
            .addCase(contactEmailSendingPending, (contact) => {
                contact.snackbar.loading = {
                    open: true,
                    message: "Senden der Kontaktemail läuft",
                };
            })
            .addCase(contactEmailSendingFulfilled, (contact) => {
                contact.snackbar.alert = {
                    open: true,
                    message: "Senden der Kontaktemail erfolgreich",
                    severity: "success",
                };
                contact.snackbar.loading = {
                    open: false,
                    message: "",
                };
            })
            .addCase(contactEmailSendingFailed, (contact) => {
                contact.snackbar.alert = {
                    open: true,
                    message: "Senden der Kontaktemail fehlgeschlagen",
                    severity: "error",
                };
                contact.snackbar.loading = {
                    open: false,
                    message: "",
                };
            })
    },
    reducers: {
        alertSnackbarOpened: (contact, action) => {
            contact.snackbar.alert = {
                open: true,
                message: action.payload.message,
                severity: action.payload.severity,
            };
        },
        alertSnackbarClosed: (contact) => {
            contact.snackbar.alert = {
                ...contact.snackbar.alert,
                open: false,
            };
        },
        loadingSnackbarOpened: (contact, action) => {
            contact.snackbar.loading = {
                open: true,
                message: action.payload.message,
            };
        },
        loadingSnackbarClosed: (contact) => {
            contact.snackbar.loading = {
                ...contact.snackbar.loading,
                open: false,
            };
        },
    },
});

export const openContactAlertSnackbar = (payload: {
    message: string;
    severity: string;
}) => ({
    type: alertSnackbarOpened.type,
    payload,
});

export const closeContactAlertSnackbar = () => ({
    type: alertSnackbarClosed.type,
});

export const openContactLoadingSnackbar = (payload: {
    message: string;
}) => ({
    type: loadingSnackbarOpened.type,
    payload,
});

export const closeContactLoadingSnackbar = () => ({
    type: loadingSnackbarClosed.type,
});

export const {
    alertSnackbarOpened,
    alertSnackbarClosed,
    loadingSnackbarOpened,
    loadingSnackbarClosed
} = contactSlice.actions;
export default contactSlice.reducer;

export const getContactSnackbar = (state: RootState) => state.ui.contact.snackbar;
