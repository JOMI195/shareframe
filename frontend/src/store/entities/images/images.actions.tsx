import * as ImagesSlice from "./images.slice";
import { apiRequest } from "@/common/utils/constants/api.constants";
import * as ImagesEndpoints from "@/assets/endpoints/api/imagesEndpoints";
import * as FramesEndpoints from "@/assets/endpoints/api/framesEndpoints";

export const fetchImages = () =>
  apiRequest({
    url: ImagesEndpoints.getImagesUrl(),
    onStart: ImagesSlice.imagesRequested.type,
    onSuccess: ImagesSlice.imagesReceived.type,
    onError: ImagesSlice.imagesRequestFailed.type,
  });

export const uploadImage = (
  image: File,
  upload_image_sha256_hex_hash: string,
) =>
  apiRequest({
    url: ImagesEndpoints.getImagesUrl(),
    method: "post",

    onStart: ImagesSlice.createImagePending.type,
    onSuccess: ImagesSlice.createImageFulfilled.type,
    onError: ImagesSlice.createImageFailed.type,

    onStartPayload: image.name ? image.name : null,
    data: { image: image, upload_image_sha256_hex_hash: upload_image_sha256_hex_hash },
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

export const fetchSentImages = () =>
  apiRequest({
    url: ImagesEndpoints.getSentImagesUrl(),
    onStart: ImagesSlice.sentImagesRequested.type,
    onSuccess: ImagesSlice.sentImagesReceived.type,
    onError: ImagesSlice.sentImagesRequestFailed.type,
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