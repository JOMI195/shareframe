import { Middleware } from "redux";
import { isAxiosError } from "axios";
import http from "@/services/httpService.ts";
import * as actions from "@/common/utils/constants/api.constants.tsx";
import { ApiRequestPayload } from "@/common/utils/constants/api.constants.tsx";
import { errorMessageFor } from "@/common/utils/errors/errorMessages";

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

  if (!error.response) {
    return navigator.onLine
      ? "Der Server ist gerade nicht erreichbar."
      : "Du bist offline. Prüfe deine Internetverbindung.";
  }

  if (error.response.status >= 500) {
    return "Auf dem Server ist ein Fehler aufgetreten.";
  }

  // DRF's own texts for these are English.
  if (error.response.status === 403) {
    return "Dafür fehlt dir die Berechtigung.";
  }

  if (error.response.status === 404) {
    return "Das gibt es nicht mehr.";
  }

  if (error.response?.status === 413) {
    return "Die Datei ist zu groß.";
  }

  if (error.response?.status === 429) {
    return "Zu viele Versuche. Bitte warte kurz.";
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

  return "Unbekannter Fehler";
};

const getErrorCode = (error: unknown): string | undefined => {
  if (!isAxiosError(error)) return undefined;
  const data: unknown = error.response?.data;
  if (!data || typeof data !== "object") return undefined;
  const code = (data as Record<string, unknown>).code;
  return typeof code === "string" ? code : undefined;
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
          onUploadProgress,
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
          let lastPercent = -1;
          const response = await http.request({
            url,
            method,
            data,
            headers,
            onUploadProgress: onUploadProgress
              ? ({ loaded, total }) => {
                if (!total) return;
                const percent = Math.round((loaded * 100) / total);
                if (percent === lastPercent) return;
                lastPercent = percent;
                dispatch({ type: onUploadProgress, payload: percent });
              }
              : undefined,
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
          const code = getErrorCode(error);
          const message = errorMessageFor(code) ?? getErrorMessage(error);
          dispatch(actions.apiFailed(message));
          if (onError) {
            dispatch({
              type: onError,
              payload: onErrorPayload ?? message,
              meta: { code },
            });
          }
          return onErrorPayload ?? message;
        }
      };

export default apiMiddleware;
