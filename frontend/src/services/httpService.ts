import { Store } from "redux";
import { Persistor } from "redux-persist";
import axiosInstance from "./api";
import {
  signedOut,
  tokenRefreshFulfilled,
} from "@/store/entities/authentication/authentication.slice";
import { RootState } from "@/store";
import { getAuthenticationUrl, getSignInUrl } from "@/assets/endpoints/app/authEndpoints";
import {
  getCsrfUrl,
  getTokenCreateUrl,
  getTokenLogoutUrl,
  getTokenRefreshUrl,
} from "@/assets/endpoints/api/authEndpoints";

const MAX_AUTH_FAILURES = 2;
let authFailureCount = 0;
let isRefreshing = false;
let refreshSubscribers: Array<() => void> = [];

const subscribeTokenRefresh = (cb: () => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = () => {
  refreshSubscribers.forEach(cb => cb());
  refreshSubscribers = [];
};

const apiSetup = (store: Store<RootState>, persistor: Persistor) => {
  const { dispatch } = store;

  // Only the server can clear the HttpOnly cookies.
  const handleLogout = async () => {
    // Awaited, else the navigation cancels the request.
    await axiosInstance.post(getTokenLogoutUrl()).catch(() => undefined);
    dispatch(signedOut());
    await persistor.flush();
    window.location.href = getAuthenticationUrl() + getSignInUrl();
  };

  axiosInstance.interceptors.response.use(
    (response) => {
      authFailureCount = 0;
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      const isCsrfFailure =
        error.response?.status === 403 &&
        String(error.response?.data?.detail ?? "").startsWith("CSRF Failed");

      // Re-seed a missing csrftoken instead of failing every unsafe request.
      if (
        isCsrfFailure &&
        originalRequest.url !== getCsrfUrl() &&
        !originalRequest._csrfRetry
      ) {
        originalRequest._csrfRetry = true;
        await axiosInstance.get(getCsrfUrl());
        return axiosInstance(originalRequest);
      }

      // Don't retry auth endpoints to avoid infinite loops
      const isAuthEndpoint =
        originalRequest.url === getTokenCreateUrl() ||
        originalRequest.url === getTokenRefreshUrl() ||
        originalRequest.url === getTokenLogoutUrl();

      if (!isAuthEndpoint && error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh(() => {
              resolve(axiosInstance(originalRequest));
            });
          });
        }

        isRefreshing = true;

        try {
          // Direct call: apiMiddleware swallows failures, this must reject.
          await axiosInstance.post(getTokenRefreshUrl());
          dispatch(tokenRefreshFulfilled());

          onTokenRefreshed();

          isRefreshing = false;
          authFailureCount = 0;

          return axiosInstance(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          refreshSubscribers = [];
          authFailureCount++;

          if (authFailureCount >= MAX_AUTH_FAILURES) {
            handleLogout();
          }

          return Promise.reject(refreshError);
        }
      }

      if (error.response?.status === 401) {
        authFailureCount++;

        if (authFailureCount >= MAX_AUTH_FAILURES) {
          handleLogout();
        }
      }

      return Promise.reject(error);
    }
  );
};

export default {
  get: axiosInstance.get,
  post: axiosInstance.post,
  put: axiosInstance.put,
  patch: axiosInstance.patch,
  delete: axiosInstance.delete,
  request: axiosInstance.request,
  options: axiosInstance.options,
  apiSetup,
};
