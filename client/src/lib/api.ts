// client/src/lib/api.ts
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.status, error.response?.data);
    
    if (error.code === 'ERR_NETWORK') {
      toast.error('Cannot connect to server. Please make sure the backend is running on port 8000');
    } else if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth-storage');
      
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
    } else if (error.response?.status === 404) {
      toast.error(error.response?.data?.detail || 'Resource not found');
    } else if (error.response?.status === 422) {
      const errorDetail = error.response?.data?.detail;
      if (Array.isArray(errorDetail)) {
        errorDetail.forEach(err => toast.error(err.msg || err.message));
      } else {
        toast.error(errorDetail || 'Validation error');
      }
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

export default api;