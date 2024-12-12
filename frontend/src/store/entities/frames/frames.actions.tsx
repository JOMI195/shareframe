import * as framesSlice from "./frames.slice";
import { apiRequest } from "@/common/utils/constants/api.constants";
import * as framesEndpoints from "@/assets/endpoints/api/framesEndpoints";

export const fetchframes = () =>
  apiRequest({
    url: framesEndpoints.getFramesUrl(),
    onStart: framesSlice.framesRequested.type,
    onSuccess: framesSlice.framesReceived.type,
    onError: framesSlice.framesRequestFailed.type,
  });

export const registerFrame = (public_serial_number: string) =>
  apiRequest({
    url: framesEndpoints.getRegisterFrameUrl(),
    method: "post",
    onStart: framesSlice.registerFramePending.type,
    onSuccess: framesSlice.registerFrameFulfilled.type,
    onError: framesSlice.registerFrameFailed.type,
    data: { "public_serial_number": public_serial_number }
  });

export const unregisterFrame = (public_serial_number: string) =>
  apiRequest({
    url: framesEndpoints.getUnregisterFrameUrl(),
    method: "post",
    onStart: framesSlice.unregisterFramePending.type,
    onSuccess: framesSlice.unregisterFrameFulfilled.type,
    onError: framesSlice.unregisterFrameFailed.type,
    data: { "public_serial_number": public_serial_number }
  });
