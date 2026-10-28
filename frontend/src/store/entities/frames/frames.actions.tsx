import * as framesSlice from "./frames.slice";
import { apiRequest } from "@/common/utils/constants/api.constants";
import * as framesEndpoints from "@/assets/endpoints/api/framesEndpoints";
import { fetchIfStale } from "@/store/fetchIfStale";

export const fetchframes = () =>
  apiRequest({
    url: framesEndpoints.getFramesUrl(),
    onStart: framesSlice.framesRequested.type,
    onSuccess: framesSlice.framesReceived.type,
    onError: framesSlice.framesRequestFailed.type,
  });

const FRAMES_MAX_AGE_MS = 30 * 1000;

export const fetchFramesIfStale = () =>
  fetchIfStale((state) => framesSlice.getApi(state).lastFetch, FRAMES_MAX_AGE_MS, fetchframes);

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

export const obtainFrameOTP = (frame_id: number) =>
  apiRequest({
    url: framesEndpoints.getObtainFrameOtpUrl(frame_id),
    method: "post",
    onStart: framesSlice.frameOTPRequested.type,
    onSuccess: framesSlice.frameOTPRecieved.type,
    onError: framesSlice.frameOTPRequestFailed.type,
  });
