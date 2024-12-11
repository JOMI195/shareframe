import { Store } from "redux";
import axiosInstance from "./api";
import { refreshToken } from "@/store/entities/authentication/authentication.actions";
import { RootState } from "@/store";

const apiSetup = (store: Store<RootState>) => {
  const { dispatch } = store;
  axiosInstance.interceptors.request.use(
    function (config) {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    function (error) {
      return Promise.reject(error);
    }
  );

  axiosInstance.interceptors.response.use(
    function (response) {
      return response;
    },
    async function (error) {
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
            }
            return axiosInstance(originalConfig);
          } catch (_error) {
            return Promise.reject(_error);
          }
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
