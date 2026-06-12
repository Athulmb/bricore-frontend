import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor to handle unauthorized errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('gme_user');
            localStorage.removeItem('gme_token'); // For compatibility during rollout
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
