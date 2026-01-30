import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(async (config) => {
    const user = auth?.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add a response interceptor for global error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with a status code that falls out of the range of 2xx
            console.error('API Error:', error.response.status, error.response.data);
            if (error.response.status === 401) {
                // Handle unauthorized access (e.g., redirect to login)
                console.warn('Unauthorized access. Please login again.');
            }
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Network Error: No response received', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Request Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;
