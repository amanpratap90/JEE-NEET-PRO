import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for generic error handling (optional but good practice)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // You could handle 401 (Unauthorized) here by redirecting to login
        // if (error.response && error.response.status === 401) { ... }
        return Promise.reject(error);
    }
);

export default api;
