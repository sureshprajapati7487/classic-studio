import axios from 'axios';

// In production (Vercel), use the Render backend URL
// In development, use relative path (Vite proxy handles it)
const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
});

// Auto-attach JWT token if logged in
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
