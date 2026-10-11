import { RootState } from "@/store";
import { createImageFailed, createImageFulfilled, createImagePending, deactivateSentImageFailed, deactivateSentImageFulfilled, deactivateSentImagePending, cancelScheduledSentImageFailed, cancelScheduledSentImageFulfilled, cancelScheduledSentImagePending, sendScheduledSentImageNowFailed, sendScheduledSentImageNowFulfilled, sendScheduledSentImageNowPending, deleteImageFailed, deleteImageFulfilled, deleteImagePending, imagesRequestFailed, sendImageToUserFrameFailed, sendImageToUserFrameFulfilled, sendImageToUserFramePending, sentImagesRequestFailed, createTextPresetFailed, createTextPresetFulfilled, deleteTextPresetFailed, deleteTextPresetFulfilled, textPresetsRequestFailed } from "@/store/entities/images/images.slice";
import { IImage, ISentImage } from "@/types";
import { AlertColor } from "@mui/material";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ScheduledSentImageAction = 'sendNow' | 'cancel';

type SliceState = {
  dialogs: {
    create: { open: boolean },
    delete: { open: boolean, imagesToDelete: IImage[] },
    preview: {
      open: boolean;
      selectedImage: IImage | null
    },
    sendToFrame: { open: boolean, imagesToSend: IImage[] },
    deactivate: { open: boolean, sentImageId: number | null },
    scheduledAction: { open: boolean, sentImageId: number | null, action: ScheduledSentImageAction | null },
    selection: { open: boolean, selectedImages: IImage[] },
  };
  snackbar: {
    alert: { open: boolean; message: string; severity: AlertColor };
    loading: { open: boolean; message: string; };
  };
};

const initialState: SliceState = {
  dialogs: {
    create: { open: false },
    delete: { open: false, imagesToDelete: [] },
    preview: {
      open: false,
      selectedImage: null
    },
    sendToFrame: { open: false, imagesToSend: [] },
    deactivate: { open: false, sentImageId: null },
    scheduledAction: { open: false, sentImageId: null, action: null },
    selection: { open: false, selectedImages: [] },
  },
  snackbar: {
    alert: { open: false, message: "", severity: "success" },
    loading: { open: false, message: "", },
  },
};

const showLoading = (sliceState: SliceState, message: string) => {
  sliceState.snackbar.loading = { open: true, message };
};

const showAlert = (sliceState: SliceState, message: string, severity: AlertColor) => {
  sliceState.snackbar.alert = { open: true, message, severity };
  sliceState.snackbar.loading = { open: false, message: "" };
};

const imagesSlice = createSlice({
  name: "images",
  initialState,
  extraReducers: (builder) => {
    builder
      // .addCase(imagesRequested, (sliceState) => {
      //   sliceState.snackbar.loading = {
      //     open: true,
      //     message: "Bilder laden",
      //   };
      // })
      // .addCase(imagesReceived, (sliceState) => {
      //   sliceState.snackbar.loading = {
      //     open: false,
      //     message: "",
      //   };
      // })
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
      .addCase(textPresetsRequestFailed, (sliceState) => {
        sliceState.snackbar.alert = { open: true, message: "Vorlagen laden fehlgeschlagen", severity: "error" };
      })
      .addCase(createTextPresetFulfilled, (sliceState) => {
        sliceState.snackbar.alert = { open: true, message: "Vorlage gespeichert", severity: "success" };
      })
      .addCase(createTextPresetFailed, (sliceState, action: PayloadAction<string | undefined>) => {
        sliceState.snackbar.alert = {
          open: true,
          message: action.payload
            ? `Vorlage speichern fehlgeschlagen: ${action.payload}`
            : "Vorlage speichern fehlgeschlagen",
          severity: "error",
        };
      })
      .addCase(deleteTextPresetFulfilled, (sliceState) => {
        sliceState.snackbar.alert = { open: true, message: "Vorlage gelöscht", severity: "success" };
      })
      .addCase(deleteTextPresetFailed, (sliceState) => {
        sliceState.snackbar.alert = { open: true, message: "Vorlage löschen fehlgeschlagen", severity: "error" };
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
      .addCase(createImageFailed, (sliceState, action: PayloadAction<string | undefined>) => {
        sliceState.snackbar.alert = {
          open: true,
          message: action.payload
            ? `Bild hochladen fehlgeschlagen: ${action.payload}`
            : "Bild hochladen fehlgeschlagen",
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
          message: "Bilder löschen",
        };
      })
      .addCase(deleteImageFulfilled, (sliceState) => {
        sliceState.snackbar.alert = {
          open: true,
          message: "Bilder löschen erfolgreich",
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
          message: "Bilder löschen fehlgeschlagen",
          severity: "error",
        };
        sliceState.snackbar.loading = {
          open: false,
          message: "",
        };
      })
      // .addCase(sentImagesRequested, (sliceState) => {
      //   sliceState.snackbar.loading = {
      //     open: true,
      //     message: "Gesendete Bilder laden",
      //   };
      // })
      // .addCase(sentImagesReceived, (sliceState) => {
      //   sliceState.snackbar.loading = {
      //     open: false,
      //     message: "",
      //   };
      // })
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
          message: "Fotos an Bilderrahmen der Empfänger schicken",
        };
      })
      .addCase(sendImageToUserFrameFulfilled, (sliceState, action: { payload?: Partial<ISentImage> }) => {
        sliceState.snackbar.alert = {
          open: true,
          message: action.payload?.status === "scheduled"
            ? "Versand an Bilderrahmen der Empfänger geplant"
            : "Fotos an Bilderrahmen der Empfänger schicken erfolgreich",
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
          message: "Fotos an Bilderrahmen der Empfänger schicken fehlgeschlagen",
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
      .addCase(cancelScheduledSentImagePending, (sliceState) => {
        showLoading(sliceState, "Geplantes Senden abbrechen");
      })
      .addCase(cancelScheduledSentImageFulfilled, (sliceState) => {
        showAlert(sliceState, "Geplantes Senden abgebrochen", "success");
      })
      .addCase(cancelScheduledSentImageFailed, (sliceState) => {
        showAlert(sliceState, "Geplantes Senden abbrechen fehlgeschlagen", "error");
      })
      .addCase(sendScheduledSentImageNowPending, (sliceState) => {
        showLoading(sliceState, "Foto sofort senden");
      })
      .addCase(sendScheduledSentImageNowFulfilled, (sliceState) => {
        showAlert(sliceState, "Foto gesendet", "success");
      })
      .addCase(sendScheduledSentImageNowFailed, (sliceState) => {
        showAlert(sliceState, "Foto sofort senden fehlgeschlagen", "error");
      })
  },
  reducers: {
    createImageDialogOpened: (sliceState) => {
      sliceState.dialogs.create.open = true;
    },
    createImageDialogClosed: (sliceState) => {
      sliceState.dialogs.create.open = false;
    },
    deleteImageDialogOpened: (sliceState) => {
      sliceState.dialogs.delete.imagesToDelete = sliceState.dialogs.selection.selectedImages;
      sliceState.dialogs.delete.open = true;
    },
    deleteImageDialogClosed: (sliceState) => {
      sliceState.dialogs.delete.open = false;
      sliceState.dialogs.delete.imagesToDelete = [];
    },
    previewImageDialogOpened: (sliceState, action) => {
      sliceState.dialogs.selection.selectedImages = [];
      sliceState.dialogs.preview.open = true;
      sliceState.dialogs.preview.selectedImage = action.payload.image
    },
    previewImageDialogClosed: (sliceState) => {
      sliceState.dialogs.preview.open = false;
      sliceState.dialogs.preview.selectedImage = null;
      sliceState.dialogs.selection.selectedImages = [];
    },
    sendImageToUserFrameDialogOpened: (sliceState) => {
      sliceState.dialogs.sendToFrame.imagesToSend = sliceState.dialogs.selection.selectedImages;
      sliceState.dialogs.sendToFrame.open = true;
    },
    sendImageToUserFrameDialogClosed: (sliceState) => {
      sliceState.dialogs.sendToFrame.open = false;
      sliceState.dialogs.sendToFrame.imagesToSend = [];
    },
    deactivateSendImageToUserFrameDialogOpened: (sliceState, action) => {
      sliceState.dialogs.deactivate.open = true;
      sliceState.dialogs.deactivate.sentImageId = action.payload.sentImageId;
    },
    deactivateSendImageToUserFrameDialogClosed: (sliceState) => {
      sliceState.dialogs.deactivate.open = false;
      sliceState.dialogs.deactivate.sentImageId = null;
    },
    scheduledSentImageDialogOpened: (sliceState, action: PayloadAction<{ sentImageId: number, action: ScheduledSentImageAction }>) => {
      sliceState.dialogs.scheduledAction = { open: true, ...action.payload };
    },
    scheduledSentImageDialogClosed: (sliceState) => {
      sliceState.dialogs.scheduledAction.open = false;
      sliceState.dialogs.scheduledAction.sentImageId = null;
    },
    selectionDialogOpened: (sliceState) => {
      sliceState.dialogs.selection.selectedImages = [];
      sliceState.dialogs.selection.open = true;
    },
    selectionDialogClosed: (sliceState) => {
      sliceState.dialogs.selection.open = false;
      sliceState.dialogs.selection.selectedImages = [];
    },
    imageSelected: (sliceState, action: PayloadAction<{ image: IImage; keepImageOnReSelect?: boolean }>) => {
      const { image, keepImageOnReSelect = false } = action.payload;
      const elementIndex = sliceState.dialogs.selection.selectedImages.findIndex(
        (img: IImage) => img.id === image.id
      );

      if (elementIndex === -1) {
        sliceState.dialogs.selection.selectedImages[
          sliceState.dialogs.selection.selectedImages.length
        ] = image;
      } else if (!keepImageOnReSelect) {
        sliceState.dialogs.selection.selectedImages.splice(elementIndex, 1);
      }
      // If keepImageOnReSelect is true and image is found, do nothing (keep it selected)
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

export const openDeleteImageDialog = () => ({
  type: deleteImageDialogOpened.type,
});

export const closeDeleteImageDialog = () => ({
  type: deleteImageDialogClosed.type,
});

export const openPreviewImageDialog = (payload: { image: IImage }) => ({
  type: previewImageDialogOpened.type,
  payload
});

export const closePreviewImageDialog = () => ({
  type: previewImageDialogClosed.type,
});

export const openSendImageToUserFrameDialog = () => ({
  type: sendImageToUserFrameDialogOpened.type,
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

export const openScheduledSentImageDialog = (payload: { sentImageId: number, action: ScheduledSentImageAction }) => ({
  type: scheduledSentImageDialogOpened.type,
  payload
});

export const closeScheduledSentImageDialog = () => ({
  type: scheduledSentImageDialogClosed.type,
});

export const openSelectionDialog = () => ({
  type: selectionDialogOpened.type,
});

export const closeSelectionDialog = () => ({
  type: selectionDialogClosed.type,
});

export const selectImage = (payload: { image: IImage; keepImageOnReSelect?: boolean }) => ({
  type: imageSelected.type,
  payload,
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
  deactivateSendImageToUserFrameDialogOpened,
  scheduledSentImageDialogClosed,
  scheduledSentImageDialogOpened,
  selectionDialogOpened,
  selectionDialogClosed,
  imageSelected
} = imagesSlice.actions;

export default imagesSlice.reducer;

export const getDialogs = (state: RootState) => state.ui.images.dialogs;
export const getImagesSnackbar = (state: RootState) => state.ui.images.snackbar;
