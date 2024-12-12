import { RootState } from "@/store";
import { createImageFailed, createImageFulfilled, createImagePending, deleteImageFailed, deleteImageFulfilled, deleteImagePending, imagesReceived, imagesRequested, imagesRequestFailed, sentImagesReceived, sentImagesRequested, sentImagesRequestFailed } from "@/store/entities/images/images.slice";
import { AlertColor } from "@mui/material";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  dialogs: { create: { open: boolean }, delete: { open: boolean, imageId: number | null } };
  snackbar: {
    alert: { open: boolean; message: string; severity: AlertColor };
    loading: { open: boolean; message: string; };
  };
};

const initialState: SliceState = {
  dialogs: { create: { open: false }, delete: { open: false, imageId: null } },
  snackbar: {
    alert: { open: false, message: "", severity: "success" },
    loading: { open: false, message: "", },
  },
};

const imagesSlice = createSlice({
  name: "images",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(imagesRequested, (sliceState) => {
        sliceState.snackbar.loading = {
          open: true,
          message: "Bilder laden",
        };
      })
      .addCase(imagesReceived, (sliceState) => {
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(imagesRequestFailed, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Bilder laden fehlgeschlagen",
          severity: "error",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(createImagePending, (sliceState) => {
        sliceState.snackbar.loading = {
          open: true,
          message: "Bild hochladen",
        };
      })
      .addCase(createImageFulfilled, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Bild hochladen erfolgreich",
          severity: "success",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(createImageFailed, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Bild hochladen fehlgeschlagen",
          severity: "error",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(deleteImagePending, (sliceState) => {
        sliceState.snackbar.loading = {
          open: true,
          message: "Bild löschen",
        };
      })
      .addCase(deleteImageFulfilled, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Bild löschen erfolgreich",
          severity: "success",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(deleteImageFailed, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Bild löschen fehlgeschlagen",
          severity: "error",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(sentImagesRequested, (sliceState) => {
        sliceState.snackbar.loading = {
          open: true,
          message: "Gesendete Bilder laden",
        };
      })
      .addCase(sentImagesReceived, (sliceState) => {
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(sentImagesRequestFailed, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Gesendete Bilder laden fehlgeschlagen",
          severity: "error",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
  },
  reducers: {
    createImageDialogOpened: (sliceState) => {
      sliceState.dialogs.create.open = true;
    },
    createImageDialogClosed: (sliceState) => {
      sliceState.dialogs.create.open = false;
    },
    deleteImageDialogOpened: (sliceState, action) => {
      sliceState.dialogs.delete.open = true;
      sliceState.dialogs.delete.imageId = action.payload.imageId;
    },
    deleteImageDialogClosed: (sliceState) => {
      sliceState.dialogs.delete.open = false;
      sliceState.dialogs.delete.imageId = null;
    },
    alertSnackbarOpened: (images, action) => {
      images.snackbar.alert = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity,
      };
    },
    alertSnackbarClosed: (images) => {
      images.snackbar.alert = {
        ...images.snackbar.alert,
        open: false,
      };
    },
    loadingSnackbarOpened: (images, action) => {
      images.snackbar.loading = {
        open: true,
        message: action.payload.message,
      };
    },
    loadingSnackbarClosed: (images) => {
      images.snackbar.loading = {
        ...images.snackbar.loading,
        open: false,
      };
    },
  },
});

export const openCreateImageDialog = () => ({
  type: createImageDialogOpened.type,
});

export const closeCreateImageDialog = () => ({
  type: createImageDialogClosed.type,
});

export const openDeleteImageDialog = (payload: { imageId: number }) => ({
  type: deleteImageDialogOpened.type,
  payload
});

export const closeDeleteImageDialog = () => ({
  type: deleteImageDialogClosed.type,
});

export const openImagesAlertSnackbar = (payload: {
  message: string;
  severity: string;
}) => ({
  type: alertSnackbarOpened.type,
  payload,
});

export const closeImagesAlertSnackbar = () => ({
  type: alertSnackbarClosed.type,
});

export const openImagesLoadingSnackbar = (payload: {
  message: string;
}) => ({
  type: loadingSnackbarOpened.type,
  payload,
});

export const closeImagesLoadingSnackbar = () => ({
  type: loadingSnackbarClosed.type,
});

export const {
  createImageDialogOpened,
  createImageDialogClosed,
  alertSnackbarOpened,
  alertSnackbarClosed,
  loadingSnackbarClosed,
  loadingSnackbarOpened,
  deleteImageDialogClosed,
  deleteImageDialogOpened
} = imagesSlice.actions;

export default imagesSlice.reducer;

export const getDialogs = (state: RootState) => state.ui.images.dialogs;
export const getImagesSnackbar = (state: RootState) => state.ui.images.snackbar;
