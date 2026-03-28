import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';
const baseURL = API_URL.replace(/\/+$/, '') + '/';

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

