import * as ImagesSlice from "./images.slice";
import { apiRequest } from "@/common/utils/constants/api.constants";
import * as ImagesEndpoints from "@/assets/endpoints/api/imagesEndpoints";

export const fetchImages = () =>
  apiRequest({
    url: ImagesEndpoints.getImagesUrl(),
    onStart: ImagesSlice.imagesRequested.type,
    onSuccess: ImagesSlice.imagesReceived.type,
    onError: ImagesSlice.imagesRequestFailed.type,
  });

export const fetchSentImages = () =>
  apiRequest({
    url: ImagesEndpoints.getSentImagesUrl(),
    onStart: ImagesSlice.sentImagesRequested.type,
    onSuccess: ImagesSlice.sentImagesReceived.type,
    onError: ImagesSlice.sentImagesRequestFailed.type,
  });
