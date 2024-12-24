import { RootState } from "@/store";
import { createImageFailed, createImageFulfilled, createImagePending, deactivateSentImageFailed, deactivateSentImageFulfilled, deactivateSentImagePending, deleteImageFailed, deleteImageFulfilled, deleteImagePending, imagesReceived, imagesRequested, imagesRequestFailed, sendImageToUserFrameFailed, sendImageToUserFrameFulfilled, sendImageToUserFramePending, sentImagesReceived, sentImagesRequested, sentImagesRequestFailed } from "@/store/entities/images/images.slice";
import { AlertColor } from "@mui/material";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  dialogs: {
    create: { open: boolean },
    delete: { open: boolean, imageId: number | null },
    preview: { open: boolean, url: string | null },
    sendToFrame: { open: boolean, imageId: number | null },

    deactivate: { open: boolean, sentImageId: number | null },
  };
  snackbar: {
    alert: { open: boolean; message: string; severity: AlertColor };
    loading: { open: boolean; message: string; };
  };
};

const initialState: SliceState = {
  dialogs: {
    create: { open: false },
    delete: { open: false, imageId: null },
    preview: { open: false, url: null },
    sendToFrame: { open: false, imageId: null },

    deactivate: { open: false, sentImageId: null },
  },
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
      .addCase(sendImageToUserFramePending, (sliceState) => {
        sliceState.snackbar.loading = {
          open: true,
          message: "Foto an Bilderrahmen des Empfängers schicken",
        };
      })
      .addCase(sendImageToUserFrameFulfilled, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Foto an Bilderrahmen des Empfängers schicken erfolgreich",
          severity: "success",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(sendImageToUserFrameFailed, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Foto an Bilderrahmen des Empfängers schicken fehlgeschlagen",
          severity: "error",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(deactivateSentImagePending, (sliceState) => {
        sliceState.snackbar.loading = {
          open: true,
          message: "Gesendetes Foto deaktiveren",
        };
      })
      .addCase(deactivateSentImageFulfilled, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Gesendetes Foto deaktiveren erfolgreich",
          severity: "success",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      .addCase(deactivateSentImageFailed, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Gesendetes Foto deaktiveren fehlgeschlagen",
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
    previewImageDialogOpened: (sliceState, action) => {
      sliceState.dialogs.preview.open = true;
      sliceState.dialogs.preview.url = action.payload.url;
    },
    previewImageDialogClosed: (sliceState) => {
      sliceState.dialogs.preview.open = false;
      sliceState.dialogs.preview.url = null;
    },
    sendImageToUserFrameDialogOpened: (sliceState, action) => {
      sliceState.dialogs.sendToFrame.open = true;
      sliceState.dialogs.sendToFrame.imageId = action.payload.imageId;
    },
    sendImageToUserFrameDialogClosed: (sliceState) => {
      sliceState.dialogs.sendToFrame.open = false;
      sliceState.dialogs.sendToFrame.imageId = null;
    },
    deactivateSendImageToUserFrameDialogOpened: (sliceState, action) => {
      sliceState.dialogs.deactivate.open = true;
      sliceState.dialogs.deactivate.sentImageId = action.payload.sentImageId;
    },
    deactivateSendImageToUserFrameDialogClosed: (sliceState) => {
      sliceState.dialogs.deactivate.open = false;
      sliceState.dialogs.deactivate.sentImageId = null;
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

export const openPreviewImageDialog = (payload: { url: string }) => ({
  type: previewImageDialogOpened.type,
  payload
});

export const closePreviewImageDialog = () => ({
  type: previewImageDialogClosed.type,
});

export const openSendImageToUserFrameDialog = (payload: { imageId: number }) => ({
  type: sendImageToUserFrameDialogOpened.type,
  payload
});

export const closeSendImageToUserFrameDialog = () => ({
  type: sendImageToUserFrameDialogClosed.type,
});

export const openDeactivateSendImageFrameDialog = (payload: { sentImageId: number }) => ({
  type: deactivateSendImageToUserFrameDialogOpened.type,
  payload
});

export const closeDeactivateSendImageFrameDialog = () => ({
  type: deactivateSendImageToUserFrameDialogClosed.type,
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
  deleteImageDialogOpened,
  previewImageDialogClosed,
  previewImageDialogOpened,
  sendImageToUserFrameDialogClosed,
  sendImageToUserFrameDialogOpened,
  deactivateSendImageToUserFrameDialogClosed,
  deactivateSendImageToUserFrameDialogOpened
} = imagesSlice.actions;

export default imagesSlice.reducer;

export const getDialogs = (state: RootState) => state.ui.images.dialogs;
export const getImagesSnackbar = (state: RootState) => state.ui.images.snackbar;
