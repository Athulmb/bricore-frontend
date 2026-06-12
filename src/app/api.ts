import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor to handle unauthorized errors
// NOTE: We avoid window.location.href here to prevent hard-reload loops.
// Instead we dispatch a custom event that AuthContext can listen to.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('britcore_user');
            localStorage.removeItem('britcore_token');
            // Dispatch event so React can handle the redirect via the router
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
        return Promise.reject(error);
    }
);

export default api;
