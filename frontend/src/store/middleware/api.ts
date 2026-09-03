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
          dispatch(actions.apiFailed(error.message));
          if (onError) {
            dispatch({
              type: onError,
              payload: onErrorPayload ?? error.message,
            });
          }
          return onErrorPayload ?? error.message;
        }
      };

export default apiMiddleware;
