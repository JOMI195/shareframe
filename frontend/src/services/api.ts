import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    // Multipart image uploads run past the default; keep this above the gunicorn timeout.
    timeout: 130000,
    withCredentials: true,
    // axios only auto-attaches the XSRF header same-origin; dev is :3000 -> :8000.
    withXSRFToken: true,
    xsrfCookieName: 'csrftoken',
    xsrfHeaderName: 'X-CSRFToken',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default axiosInstance;
