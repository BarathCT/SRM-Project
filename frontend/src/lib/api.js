import axios from "axios";

// Ensure baseURL ends with /api
const baseURL = import.meta.env.VITE_API_BASE_URL || '';
const apiBaseURL = baseURL.endsWith('/api') ? baseURL : `${baseURL.replace(/\/$/, '')}/api`;

if (!baseURL) {
  console.warn('VITE_API_BASE_URL is not set. API calls may fail.');
}

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000, // 30 second timeout
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401/403 errors globally
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Don't remove token here - let individual components handle it
      console.warn('Authentication error:', error.response?.status);
    }
    return Promise.reject(error);
  }
);

export default api;