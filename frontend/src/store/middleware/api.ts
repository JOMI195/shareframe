import { Middleware } from "redux";
import http from "@/services/httpService.ts";
import * as actions from "@/common/utils/constants/api.constants.tsx";

interface ApiRequestAction {
  type: string;
  payload: {
    url: string;
    method: string;
    data?: any;
    headers?: any;
    onStart?: string;
    onSuccess?: string;
    onError?: string;
    onStartPayload?: any;
    onSuccessPayload?: any;
    onErrorPayload?: any;
  };
}

const isApiRequestAction = (action: any): action is ApiRequestAction => {
  return action.type === actions.apiRequest.type && action.payload !== undefined;
};

// Pulls the backend's own message out of a DRF error body; 413 has an html body.
const getErrorMessage = (error: any): string => {
  if (error?.response?.status === 413) {
    return "Die Datei ist zu groß.";
  }

  const data = error?.response?.data;

  if (typeof data === "string" && data.trim() && !data.trimStart().startsWith("<")) {
    return data;
  }

  if (data && typeof data === "object") {
    if (typeof data.detail === "string") return data.detail;

    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue) && typeof firstValue[0] === "string") return firstValue[0];
    if (typeof firstValue === "string") return firstValue;
  }

  return error?.message ?? "Unbekannter Fehler";
};

const apiMiddleware: Middleware =
  ({ dispatch }) =>
    (next) =>
      async (action) => {
        if (!isApiRequestAction(action)) return next(action);

        const {
          url,
          method,
          data,
          headers,
          onStart,
          onSuccess,
          onError,
          onStartPayload,
          onSuccessPayload,
          onErrorPayload,
        } = action.payload;

        if (onStart) {
          dispatch({
            type: onStart,
            payload: onStartPayload ?? null,
          });
        }

        next(action);

        try {
          const response = await http.request({
            url,
            method,
            data,
            headers,
          });
          dispatch(actions.apiSuccess(response.data));
          if (onSuccess) {
            dispatch({
              type: onSuccess,
              payload: onSuccessPayload ?? response.data,
            });
          }
          return onSuccessPayload ?? response.data;
        } catch (error: any) {
          const message = getErrorMessage(error);
          dispatch(actions.apiFailed(message));
          if (onError) {
            dispatch({
              type: onError,
              payload: onErrorPayload ?? message,
            });
          }
          return onErrorPayload ?? message;
        }
      };

export default apiMiddleware;
