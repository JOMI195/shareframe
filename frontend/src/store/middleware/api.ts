import { Middleware } from "redux";
import { isAxiosError } from "axios";
import http from "@/services/httpService.ts";
import * as actions from "@/common/utils/constants/api.constants.tsx";
import { ApiRequestPayload } from "@/common/utils/constants/api.constants.tsx";

interface ApiRequestAction {
  type: string;
  payload: ApiRequestPayload;
}

const isApiRequestAction = (action: unknown): action is ApiRequestAction => {
  if (typeof action !== "object" || action === null) return false;
  const candidate = action as Partial<ApiRequestAction>;
  return candidate.type === actions.apiRequest.type && candidate.payload !== undefined;
};

// Pulls the backend's own message out of a DRF error body; 413 has an html body.
const getErrorMessage = (error: unknown): string => {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : "Unbekannter Fehler";
  }

  if (error.response?.status === 413) {
    return "Die Datei ist zu groß.";
  }

  const data = error.response?.data;

  if (typeof data === "string" && data.trim() && !data.trimStart().startsWith("<")) {
    return data;
  }

  if (data && typeof data === "object") {
    const fields = data as Record<string, unknown>;
    if (typeof fields.detail === "string") return fields.detail;

    const firstValue = Object.values(fields)[0];
    if (Array.isArray(firstValue) && typeof firstValue[0] === "string") return firstValue[0];
    if (typeof firstValue === "string") return firstValue;
  }

  return error.message ?? "Unbekannter Fehler";
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
        } catch (error) {
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
