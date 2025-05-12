import { Store } from "redux";
import axiosInstance from "./api";
import { refreshToken } from "@/store/entities/authentication/authentication.actions";
import { RootState } from "@/store";
import { getAuthenticationUrl, getSignInUrl } from "@/assets/endpoints/app/authEndpoints";

const MAX_AUTH_FAILURES = 3;
let authFailureCount = 0;

const handleLogout = () => {
  localStorage.clear();
  window.location.href = getAuthenticationUrl() + getSignInUrl()
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
      authFailureCount = 0; // Reset counter on success
      return response;
    },
    async (error) => {
      const token = localStorage.getItem("refreshToken");
      const originalConfig = error.config;

      if (
        originalConfig.url !== "auth/jwt/create/" &&
        originalConfig.url !== "auth/jwt/refresh/" &&
        error.response
      ) {
        if (error.response.status === 401 && !originalConfig._retry) {
          originalConfig._retry = true;
          try {
            if (token !== null) {
              await dispatch(refreshToken(token));
              authFailureCount = 0; // Reset on successful refresh
              return axiosInstance(originalConfig);
            } else {
              authFailureCount++;
              if (authFailureCount >= MAX_AUTH_FAILURES) {
                handleLogout();
              }
              return Promise.reject(error);
            }
          } catch (_error) {
            authFailureCount++;
            if (authFailureCount >= MAX_AUTH_FAILURES) {
              handleLogout();
            }
            return Promise.reject(_error);
          }
        }
      }

      authFailureCount++;
      if (authFailureCount >= MAX_AUTH_FAILURES) {
        handleLogout();
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
