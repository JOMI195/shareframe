import { Store } from "redux";
import axiosInstance from "./api";
import { refreshToken } from "@/store/entities/authentication/authentication.actions";
import { RootState } from "@/store";
import { getAuthenticationUrl, getSignInUrl } from "@/assets/endpoints/app/authEndpoints";
import { getTokenCreateUrl, getTokenRefreshUrl } from "@/assets/endpoints/api/authEndpoints";

const MAX_AUTH_FAILURES = 2;
let authFailureCount = 0;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Function to add callbacks to the queue
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Function to notify all the subscribers about new token
const onTokenRefreshed = (newToken: string) => {
  refreshSubscribers.forEach(cb => cb(newToken));
  refreshSubscribers = [];
};

// Function to handle logout
const handleLogout = () => {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("accessToken");
  window.location.href = getAuthenticationUrl() + getSignInUrl();
};

const apiSetup = (store: Store<RootState>) => {
  const { dispatch } = store;

  axiosInstance.interceptors.request.use(
    (config) => {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => {
      authFailureCount = 0; // Reset counter on successful response
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      const refreshTokenValue = localStorage.getItem("refreshToken");

      // Don't retry auth endpoints to avoid infinite loops
      const isAuthEndpoint =
        originalRequest.url === getTokenCreateUrl() ||
        originalRequest.url === getTokenRefreshUrl();

      if (!isAuthEndpoint && error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (!refreshTokenValue) {
          handleLogout();
          return Promise.reject(error);
        }

        // If already refreshing, wait for the new token
        if (isRefreshing) {
          try {
            return new Promise((resolve) => {
              subscribeTokenRefresh((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(axiosInstance(originalRequest));
              });
            });
          } catch (error) {
            return Promise.reject(error);
          }
        }

        // Start refreshing process
        isRefreshing = true;

        try {
          // Dispatch action to refresh token
          await dispatch(refreshToken(refreshTokenValue));

          // Get the new token from the result
          // This assumes refreshToken action returns the token data
          const newToken = localStorage.getItem("accessToken");

          if (!newToken) {
            throw new Error("Failed to refresh token");
          }

          // Notify all subscribers about the new token
          onTokenRefreshed(newToken);

          isRefreshing = false;
          authFailureCount = 0;

          // Return the original request with the new token
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          authFailureCount++;

          if (authFailureCount >= MAX_AUTH_FAILURES) {
            handleLogout();
          }

          return Promise.reject(refreshError);
        }
      }

      // For non-401 errors or auth endpoints, just increment counter
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