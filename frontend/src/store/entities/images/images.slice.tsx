import { RootState } from "@/store";
import { IImagesPaginated, ISentImage, ISentImagesFilters, ISentImagesPaginated, ITextPreset } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { signedOut } from "@/store/entities/authentication/authentication.slice";

type SliceState = {
  api: {
    loading: boolean;
    sending: boolean;
    lastFetch: number | null;
    // A failed list load, so the gallery can offer a retry instead of looking empty.
    imagesFailed: boolean;
    sentImagesFailed: boolean;
  };
  imagesPaginated: IImagesPaginated;
  imagesPaginatedPageSize: number;
  sentImagesPaginated: ISentImagesPaginated;
  sentImagesPaginatedPageSize: number;
  sentImagesFilters: ISentImagesFilters;
  textPresets: {
    items: ITextPreset[];
    loaded: boolean;
    saving: boolean;
  };
};

const initialState: SliceState = {
  api: {
    loading: false,
    sending: false,
    lastFetch: null,
    imagesFailed: false,
    sentImagesFailed: false,
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
  textPresets: {
    items: [],
    loaded: false,
    saving: false,
  },
};

const replaceSentImage = (sliceState: SliceState, updatedImage: ISentImage) => {
  const index = sliceState.sentImagesPaginated.results.findIndex(
    (image) => image.id === updatedImage.id
  );
  if (index !== -1) {
    sliceState.sentImagesPaginated.results[index] = updatedImage;
  }
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
      sliceState.api.imagesFailed = false;
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
      sliceState.api.imagesFailed = true;
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
      if (index !== -1) {
        sliceState.imagesPaginated.results.splice(index, 1);
        sliceState.imagesPaginated.count -= 1;
      }
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
      sliceState.api.sentImagesFailed = false;
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
      sliceState.api.sentImagesFailed = true;
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
      sliceState.api.sending = true;
    },
    deactivateSentImageFulfilled: (sliceState, action: PayloadAction<ISentImage>) => {
      replaceSentImage(sliceState, action.payload);
      resetApiState(sliceState);
    },
    deactivateSentImageFailed: (sliceState) => {
      resetApiState(sliceState);
    },
    cancelScheduledSentImagePending: (sliceState) => {
      sliceState.api.sending = true;
    },
    cancelScheduledSentImageFulfilled: (sliceState, action: PayloadAction<number>) => {
      const sentImages = sliceState.sentImagesPaginated;
      const remaining = sentImages.results.filter((image) => image.id !== action.payload);
      sentImages.count -= sentImages.results.length - remaining.length;
      sentImages.results = remaining;
      resetApiState(sliceState);
    },
    cancelScheduledSentImageFailed: (sliceState) => {
      resetApiState(sliceState);
    },
    sendScheduledSentImageNowPending: (sliceState) => {
      sliceState.api.sending = true;
    },
    sendScheduledSentImageNowFulfilled: (sliceState, action: PayloadAction<ISentImage>) => {
      replaceSentImage(sliceState, action.payload);
      resetApiState(sliceState);
    },
    sendScheduledSentImageNowFailed: (sliceState) => {
      resetApiState(sliceState);
    },
    textPresetsReceived: (sliceState, action: PayloadAction<ITextPreset[]>) => {
      sliceState.textPresets.items = action.payload;
      sliceState.textPresets.loaded = true;
    },
    textPresetsRequestFailed: () => {
    },
    createTextPresetPending: (sliceState) => {
      sliceState.textPresets.saving = true;
    },
    createTextPresetFulfilled: (sliceState, action: PayloadAction<ITextPreset>) => {
      sliceState.textPresets.items.push(action.payload);
      sliceState.textPresets.saving = false;
    },
    createTextPresetFailed: (sliceState) => {
      sliceState.textPresets.saving = false;
    },
    deleteTextPresetFulfilled: (sliceState, action: PayloadAction<number>) => {
      sliceState.textPresets.items = sliceState.textPresets.items.filter((preset) => preset.id !== action.payload);
    },
    deleteTextPresetFailed: () => {
    },
  },
  extraReducers: (builder) => {
    builder.addCase(signedOut, (sliceState) => {
      sliceState.textPresets = initialState.textPresets;
    });
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
  cancelScheduledSentImagePending,
  cancelScheduledSentImageFulfilled,
  cancelScheduledSentImageFailed,
  sendScheduledSentImageNowPending,
  sendScheduledSentImageNowFulfilled,
  sendScheduledSentImageNowFailed,
  textPresetsReceived,
  textPresetsRequestFailed,
  createTextPresetPending,
  createTextPresetFulfilled,
  createTextPresetFailed,
  deleteTextPresetFulfilled,
  deleteTextPresetFailed,
} = imagesSlice.actions;
export default imagesSlice.reducer;

export const getApi = (state: RootState) => state.entities.images.api;
export const getApiState = (state: RootState) => state.entities.images.api.loading || state.entities.images.api.sending;

export const getImagesPaginated = (state: RootState) => state.entities.images.imagesPaginated;
export const getImagesPaginatedPageSize = (state: RootState) => state.entities.images.imagesPaginatedPageSize;

export const getSentImagesPaginated = (state: RootState) => state.entities.images.sentImagesPaginated;
export const getSentImagesPaginatedPageSize = (state: RootState) => state.entities.images.sentImagesPaginatedPageSize;
export const getSentImagesFilters = (state: RootState) => state.entities.images.sentImagesFilters;
export const getTextPresets = (state: RootState) => state.entities.images.textPresets;
