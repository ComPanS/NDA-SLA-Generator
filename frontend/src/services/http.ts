import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true, // to support httpOnly cookies
});

api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    // Placeholder for refresh flow; backend should set/refresh cookies
    return Promise.reject(error);
  },
);
