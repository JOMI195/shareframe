import { RootState } from "@/store";
import { IImagesPaginated, ISentImage } from "@/types";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  api: {
    loading: boolean;
    lastFetch: number | null;
  };
  imagesPaginated: IImagesPaginated;
  imagesPaginatedPageSize: number;
  sentImages: ISentImage[];
};

const initialState: SliceState = {
  api: {
    loading: false,
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
      sliceState.api.loading = false;
    },
    imagesRequestFailed: (sliceState) => {
      sliceState.api.loading = false;
    },
    imagesPageSet: (sliceState, action) => {
      sliceState.imagesPaginated.page = action.payload;
    },
    imagesPageSizeSet: (sliceState, action) => {
      sliceState.imagesPaginatedPageSize = action.payload;
    },
    createImagePending: (sliceState) => {
      sliceState.api.loading = true;
    },
    createImageFulfilled: (sliceState, action) => {
      sliceState.imagesPaginated.results.unshift(action.payload);
      sliceState.imagesPaginated.count += 1;
      sliceState.api.lastFetch = Date.now();
      sliceState.api.loading = false;
    },
    createImageFailed: (sliceState) => {
      sliceState.api.loading = false;
    },
    deleteImagePending: (sliceState) => {
      sliceState.api.loading = true;
    },
    deleteImageFulfilled: (sliceState, action) => {
      const oldCreation = action.payload;
      const index = sliceState.imagesPaginated.results.findIndex(
        (image) => image.created_at === oldCreation.created_at
      );
      sliceState.imagesPaginated.results.splice(index, 1);
      sliceState.imagesPaginated.count -= 1;
      sliceState.api.loading = false;
    },
    deleteImageFailed: (sliceState) => {
      sliceState.api.loading = false;
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
      sliceState.api.loading = false;
    },
    sentImagesRequestFailed: (sliceState) => {
      sliceState.api.loading = false;
    },
    sendImageToUserFramePending: (sliceState) => {
      sliceState.api.loading = true;
    },
    sendImageToUserFrameFulfilled: (sliceState) => {
      sliceState.api.loading = false;
    },
    sendImageToUserFrameFailed: (sliceState) => {
      sliceState.api.loading = false;
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
      sliceState.api.loading = false;
    },
    deactivateSentImageFailed: (sliceState) => {
      sliceState.api.loading = false;
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
export const getImagesPaginated = (state: RootState) => state.entities.images.imagesPaginated;
export const getImagesPaginatedPageSize = (state: RootState) => state.entities.images.imagesPaginatedPageSize;
export const getSentImages = (state: RootState) => state.entities.images.sentImages;