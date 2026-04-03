import axios, { AxiosError, AxiosInstance } from 'axios';
import { authStore, waitForHydration } from '@/features/auth/store/authStore';
import i18n from '@/shared/i18n/i18n';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * LLM-heavy contract routes (generate, refine, guest).
 * One request may run two LLM calls (e.g. generation + risk); allow ~2× single LLM budget.
 */
export const CONTRACT_LLM_REQUEST_TIMEOUT_MS = 360_000;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
});

const SITE_LANGS = new Set(['ru', 'en', 'es', 'th']);

apiClient.interceptors.request.use(
  async (config) => {
    // Wait for auth store to hydrate before making requests
    await waitForHydration();

    const token = authStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const raw = i18n.language || 'en';
    const primary = raw.split('-')[0] ?? 'en';
    if (SITE_LANGS.has(primary)) {
      config.headers['Accept-Language'] = `${primary},en;q=0.9`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = authStore.getState().refreshToken;
        if (!refreshToken) {
          authStore.getState().logout();
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        authStore.getState().setTokens(access_token, refresh_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        authStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
