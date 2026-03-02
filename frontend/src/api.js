import axios from 'axios';

// In production (Vercel), use the Render backend URL
// In development, use relative path (Vite proxy handles it)
export const BACKEND_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    // baseURL includes /api so all calls like api.get('/admin/orders')
    // work on both localhost (Vite proxy: /api/admin/orders)
    // and Vercel (Render: https://classicstudio-api.onrender.com/api/admin/orders)
    baseURL: `${BACKEND_URL}/api`,
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

/**
 * Resolve a media file path to a full URL.
 * On Vercel: prepends the Render backend URL so /uploads/... works.
 * On localhost: returns path as-is (Vite proxy or same-origin handles it).
 */
export function resolveMediaUrl(path) {
    if (!path) return '';
    // Already an absolute URL (http/https)
    if (/^https?:\/\//i.test(path)) return path;
    // Relative path — prepend backend base URL
    return `${BACKEND_URL}${path}`;
}

export default api;
