import { RootState } from "@/store";
import { IImagesPaginated, ISentImagesFilters, ISentImagesPaginated } from "@/types";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  api: {
    loading: boolean;
    sending: boolean;
    lastFetch: number | null;
  };
  imagesPaginated: IImagesPaginated;
  imagesPaginatedPageSize: number;
  sentImagesPaginated: ISentImagesPaginated;
  sentImagesPaginatedPageSize: number;
  sentImagesFilters: ISentImagesFilters;
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
  sentImagesPaginated: {
    count: 0,
    next: null,
    previous: null,
    results: [],
    page: 1,
  },
  sentImagesPaginatedPageSize: 10,
  sentImagesFilters: {
    status: 'all',
    shipping: 'all',
    sender: '',
    receiver: '',
  },
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
      sliceState.sentImagesPaginated = {
        ...action.payload,
        page: sliceState.sentImagesPaginated.page,
      };
      sliceState.api.lastFetch = Date.now();
      resetApiState(sliceState);
    },
    sentImagesRequestFailed: (sliceState) => {
      resetApiState(sliceState);
    },
    sentImagesPageSet: (sliceState, action) => {
      sliceState.sentImagesPaginated.page = action.payload;
    },
    sentImagesPageSizeSet: (sliceState, action) => {
      sliceState.sentImagesPaginatedPageSize = action.payload;
    },
    sentImagesFiltersSet: (sliceState, action) => {
      sliceState.sentImagesFilters = {
        ...sliceState.sentImagesFilters,
        ...action.payload,
      };
    },
    sendImageToUserFramePending: (sliceState) => {
      sliceState.api.sending = true;
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
      const index = sliceState.sentImagesPaginated.results.findIndex(
        (image) => image.sent_at === updatedImage.sent_at
      );
      if (index !== -1) {
        sliceState.sentImagesPaginated.results[index] = updatedImage;
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
  sentImagesPageSet,
  sentImagesPageSizeSet,
  sentImagesFiltersSet,
  sendImageToUserFrameFailed,
  sendImageToUserFrameFulfilled,
  sendImageToUserFramePending,
  deactivateSentImageFailed,
  deactivateSentImageFulfilled,
  deactivateSentImagePending,
} = imagesSlice.actions;
export default imagesSlice.reducer;

export const getApi = (state: RootState) => state.entities.images.api;
export const getApiState = (state: RootState) => state.entities.images.api.loading || state.entities.images.api.sending;

export const getImagesPaginated = (state: RootState) => state.entities.images.imagesPaginated;
export const getImagesPaginatedPageSize = (state: RootState) => state.entities.images.imagesPaginatedPageSize;

export const getSentImagesPaginated = (state: RootState) => state.entities.images.sentImagesPaginated;
export const getSentImagesPaginatedPageSize = (state: RootState) => state.entities.images.sentImagesPaginatedPageSize;
export const getSentImagesFilters = (state: RootState) => state.entities.images.sentImagesFilters;