import * as appSlice from "./app.slice";
import { apiRequest } from "@/common/utils/constants/api.constants";
import * as appEndpoints from "@/assets/endpoints/api/appEndpoints";

export const fetchAppVersion = () =>
  apiRequest({
    url: appEndpoints.getAppVersionUrl(),
    method: "get",
    onStart: appSlice.versionRequestedPending.type,
    onSuccess: appSlice.versionRequestedFulfilled.type,
    onError: appSlice.versionRequestedFailed.type,
  });
