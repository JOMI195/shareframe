import * as ImagesSlice from "./images.slice";
import { apiRequest } from "@/common/utils/constants/api.constants";
import * as ImagesEndpoints from "@/assets/endpoints/api/imagesEndpoints";
import * as FramesEndpoints from "@/assets/endpoints/api/framesEndpoints";
import { AppDispatch } from "@/store";
import http from "@/services/httpService";

export const fetchImages = (
  page: number = 1,
  page_size: number = 10
) =>
  apiRequest({
    url: ImagesEndpoints.getImagesPaginatedUrl(page, page_size),
    onStart: ImagesSlice.imagesRequested.type,
    onSuccess: ImagesSlice.imagesReceived.type,
    onError: ImagesSlice.imagesRequestFailed.type,
  });

export const setImagesPaginatedPage = (page: number) => ({
  type: ImagesSlice.imagesPageSet.type,
  payload: page,
});

export const setImagesPaginatedPageSize = (pageSize: number) => ({
  type: ImagesSlice.imagesPageSizeSet.type,
  payload: pageSize,
});

export const uploadImage = (
  image: File,
  upload_image_sha256_hex_hash: string,
  autoDeleteAfterPeriod: boolean = true,
) =>
  apiRequest({
    url: ImagesEndpoints.getImagesUrl(),
    method: "post",

    onStart: ImagesSlice.createImagePending.type,
    onSuccess: ImagesSlice.createImageFulfilled.type,
    onError: ImagesSlice.createImageFailed.type,

    onStartPayload: image.name ? image.name : null,
    data: {
      image: image,
      upload_image_sha256_hex_hash: upload_image_sha256_hex_hash,
      auto_delete_after_period: autoDeleteAfterPeriod
    },
    headers: {
      'content-type': 'multipart/form-data'
    },
  });

export const deleteImage = (imageId: number, imageName: string) =>
  apiRequest({
    url: ImagesEndpoints.getImagesDetailUrl(imageId),
    method: "delete",

    onStart: ImagesSlice.deleteImagePending.type,
    onSuccess: ImagesSlice.deleteImageFulfilled.type,
    onError: ImagesSlice.deleteImageFailed.type,

    onStartPayload: imageName,
  });

export const fetchSentImagesPaginated = (
  page: number = 1,
  page_size: number = 12,
  filters?: {
    status?: string;
    shipping?: string;
    sender?: string;
    receiver?: string;
  }
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  });

  // Add filters to params if they exist
  if (filters) {
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters.shipping && filters.shipping !== 'all') {
      params.append('shipping', filters.shipping);
    }
    if (filters.sender) {
      params.append('sender', filters.sender);
    }
    if (filters.receiver) {
      params.append('receiver', filters.receiver);
    }
  }

  return apiRequest({
    url: `${ImagesEndpoints.getSentImagesUrl()}?${params.toString()}`,
    onStart: ImagesSlice.sentImagesRequested.type,
    onSuccess: ImagesSlice.sentImagesReceived.type,
    onError: ImagesSlice.sentImagesRequestFailed.type,
  });
};

export const setSentImagesPaginatedPage = (page: number) => ({
  type: ImagesSlice.sentImagesPageSet.type,
  payload: page,
});

export const setSentImagesPaginatedPageSize = (pageSize: number) => ({
  type: ImagesSlice.sentImagesPageSizeSet.type,
  payload: pageSize,
});

export const setSentImagesFilters = (filters: {
  status?: string;
  shipping?: string;
  sender?: string;
  receiver?: string;
}) => ({
  type: ImagesSlice.sentImagesFiltersSet.type,
  payload: filters,
});

export const sendImageToUserFrames = (
  reciever_username: string,
  image_id: number,
  expiry_unix_timestamp: string
) =>
  apiRequest({
    url: FramesEndpoints.getSentImageToFrameUrl(),
    method: "post",
    onStart: ImagesSlice.sendImageToUserFramePending.type,
    onSuccess: ImagesSlice.sendImageToUserFrameFulfilled.type,
    onError: ImagesSlice.sendImageToUserFrameFailed.type,
    data: {
      "reciever_username": reciever_username,
      "image_id": image_id,
      "expiry_unix_timestamp": expiry_unix_timestamp
    }
  });

export const deactivateSentImage = (sentImageId: number) =>
  apiRequest({
    url: ImagesEndpoints.getSentImagesDeactivateUrl(sentImageId),
    method: "post",
    onStart: ImagesSlice.deactivateSentImagePending.type,
    onSuccess: ImagesSlice.deactivateSentImageFulfilled.type,
    onError: ImagesSlice.deactivateSentImageFailed.type,
  });

export const downloadImage = (url: string, fileName: string) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch({ type: ImagesSlice.downloadImageRequested.type });
      await http.get(
        url,
        {
          responseType: "blob",
        }
      ).then(response => {
        const type = response.headers['content-type']
        const blob = new Blob([response.data], { type: type })
        const file_url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = file_url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(file_url);
        dispatch({
          type: ImagesSlice.downloadImageReceived.type,
        });
      })
    } catch (error) {
      dispatch({ type: ImagesSlice.downloadImageFailed.type });
    }
  }
}