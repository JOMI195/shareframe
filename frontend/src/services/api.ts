import axios, { InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_ORIGIN = new URL(BASE_URL ?? '/', window.location.href).origin;

const targetsApi = (config: InternalAxiosRequestConfig) => {
    const base = new URL(config.baseURL ?? BASE_URL ?? '/', window.location.href);
    return new URL(config.url ?? '', base).origin === API_ORIGIN;
};

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    // Multipart image uploads run past the default; keep this above the gunicorn timeout.
    timeout: 130000,
    withCredentials: true,
    // axios only auto-attaches the XSRF header same-origin; dev is :3000 -> :8000.
    withXSRFToken: targetsApi,
    xsrfCookieName: 'csrftoken',
    xsrfHeaderName: 'X-CSRFToken',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default axiosInstance;
