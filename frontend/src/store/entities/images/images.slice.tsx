import { RootState } from "@/store";
import { IImage, ISentImage } from "@/types";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  api: {
    loading: boolean;
    lastFetch: number | null;
  };
  images: IImage[];
  sentImages: ISentImage[];
};

const initialState: SliceState = {
  api: {
    loading: false,
    lastFetch: null,
  },
  images: [],
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
      sliceState.images = action.payload;
      sliceState.api.lastFetch = Date.now();
      sliceState.api.loading = false;
    },
    imagesRequestFailed: (sliceState) => {
      sliceState.api.loading = false;
    },
    createImagePending: (sliceState) => {
      sliceState.api.loading = true;
    },
    createImageFulfilled: (sliceState, action) => {
      sliceState.images.unshift(action.payload);
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
      const index = sliceState.images.findIndex(
        (image) => image.created_at === oldCreation.created_at
      );
      sliceState.images.splice(index, 1);
      sliceState.api.loading = false;
    },
    deleteImageFailed: (sliceState) => {
      sliceState.api.loading = false;
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
  },
});

export const {
  imagesRequested,
  imagesReceived,
  imagesRequestFailed,
  createImagePending,
  createImageFailed,
  createImageFulfilled,
  deleteImageFailed,
  deleteImageFulfilled,
  deleteImagePending,
  sentImagesReceived,
  sentImagesRequestFailed,
  sentImagesRequested,
  sendImageToUserFrameFailed,
  sendImageToUserFrameFulfilled,
  sendImageToUserFramePending
} = imagesSlice.actions;
export default imagesSlice.reducer;

export const getApi = (state: RootState) => state.entities.images.api;
export const getImages = (state: RootState) => state.entities.images.images;
export const getSentImages = (state: RootState) => state.entities.images.sentImages;