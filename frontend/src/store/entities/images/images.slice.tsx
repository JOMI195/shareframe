import { RootState } from "@/store";
import { IImagesPaginated, ISentImage } from "@/types";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  api: {
    loading: boolean;
    sending: boolean;
    lastFetch: number | null;
  };
  imagesPaginated: IImagesPaginated;
  imagesPaginatedPageSize: number;
  sentImages: ISentImage[];
};

const initialState: SliceState = {
  api: {
    loading: false,
    sending: false,
    lastFetch: null,
  },
  imagesPaginated: {
    count: 0,
    next: null,
    previous: null,
    page: 1,
    results: []
  },
  imagesPaginatedPageSize: 10,
  sentImages: []
};

const resetApiState = (sliceState: SliceState) => {
  sliceState.api.loading = false;
  sliceState.api.sending = false;
};

const imagesSlice = createSlice({
  name: "images",
  initialState,
  reducers: {
    imagesRequested: (sliceState) => {
      sliceState.api.loading = true;
    },
    imagesReceived: (sliceState, action) => {
      sliceState.imagesPaginated = {
        ...action.payload,
        page: sliceState.imagesPaginated.page,
      };
      sliceState.api.lastFetch = Date.now();
      resetApiState(sliceState);
    },
    imagesRequestFailed: (sliceState) => {
      resetApiState(sliceState);
    },
    imagesPageSet: (sliceState, action) => {
      sliceState.imagesPaginated.page = action.payload;
    },
    imagesPageSizeSet: (sliceState, action) => {
      sliceState.imagesPaginatedPageSize = action.payload;
    },
    createImagePending: (sliceState) => {
      sliceState.api.sending = true;
    },
    createImageFulfilled: (sliceState, action) => {
      sliceState.imagesPaginated.results.unshift(action.payload);
      sliceState.imagesPaginated.count += 1;
      sliceState.api.lastFetch = Date.now();
      resetApiState(sliceState);
    },
    createImageFailed: (sliceState) => {
      resetApiState(sliceState);
    },
    deleteImagePending: (sliceState) => {
      sliceState.api.sending = true;
    },
    deleteImageFulfilled: (sliceState, action) => {
      const oldCreation = action.payload;
      const index = sliceState.imagesPaginated.results.findIndex(
        (image) => image.created_at === oldCreation.created_at
      );
      sliceState.imagesPaginated.results.splice(index, 1);
      sliceState.imagesPaginated.count -= 1;
      resetApiState(sliceState);
    },
    deleteImageFailed: (sliceState) => {
      resetApiState(sliceState);
    },
    downloadImageRequested: (_sliceState) => {
    },
    downloadImageReceived: (_sliceState) => {
    },
    downloadImageFailed: (_sliceState) => {
    },

    sentImagesRequested: (sliceState) => {
      sliceState.api.loading = true;
    },
    sentImagesReceived: (sliceState, action) => {
      sliceState.sentImages = action.payload;
      sliceState.api.lastFetch = Date.now();
      resetApiState(sliceState);
    },
    sentImagesRequestFailed: (sliceState) => {
      resetApiState(sliceState);
    },
    sendImageToUserFramePending: (sliceState) => {
      sliceState.api.loading = true;
    },
    sendImageToUserFrameFulfilled: (sliceState) => {
      resetApiState(sliceState);
    },
    sendImageToUserFrameFailed: (sliceState) => {
      resetApiState(sliceState);
    },
    deactivateSentImagePending: (sliceState) => {
      sliceState.api.loading = true;
    },
    deactivateSentImageFulfilled: (sliceState, action) => {
      const updatedImage = action.payload;
      const index = sliceState.sentImages.findIndex(
        (image) => image.sent_at === updatedImage.sent_at
      );
      if (index !== -1) {
        sliceState.sentImages[index] = updatedImage;
      }
      resetApiState(sliceState);
    },
    deactivateSentImageFailed: (sliceState) => {
      resetApiState(sliceState);
    },
  },
});

export const {
  imagesRequested,
  imagesReceived,
  imagesRequestFailed,
  imagesPageSet,
  imagesPageSizeSet,
  createImagePending,
  createImageFailed,
  createImageFulfilled,
  deleteImageFailed,
  deleteImageFulfilled,
  deleteImagePending,
  downloadImageRequested,
  downloadImageReceived,
  downloadImageFailed,
  sentImagesReceived,
  sentImagesRequestFailed,
  sentImagesRequested,
  sendImageToUserFrameFailed,
  sendImageToUserFrameFulfilled,
  sendImageToUserFramePending,
  deactivateSentImageFailed,
  deactivateSentImageFulfilled,
  deactivateSentImagePending
} = imagesSlice.actions;
export default imagesSlice.reducer;

export const getApi = (state: RootState) => state.entities.images.api;
export const getApiState = (state: RootState) => state.entities.images.api.loading || state.entities.images.api.sending;
export const getImagesPaginated = (state: RootState) => state.entities.images.imagesPaginated;
export const getImagesPaginatedPageSize = (state: RootState) => state.entities.images.imagesPaginatedPageSize;
export const getSentImages = (state: RootState) => state.entities.images.sentImages;