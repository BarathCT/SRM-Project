import axios from "axios";

// Ensure baseURL ends with /api
const baseURL = import.meta.env.VITE_API_BASE_URL || '';
const apiBaseURL = baseURL.endsWith('/api') ? baseURL : `${baseURL.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: apiBaseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;