import apiClient from './client';
import {
  AuthTokens,
  LoginCredentials,
  RegisterCredentials,
  RefreshTokenRequest,
  YandexAuthUrlResponse,
  YandexCallbackPayload,
  YandexSuggestPayload,
} from '@/shared/types';

export const authApi = {
  register: async (credentials: RegisterCredentials): Promise<AuthTokens> => {
    const response = await apiClient.post<AuthTokens>('/auth/register', credentials);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const response = await apiClient.post<AuthTokens>('/auth/login', credentials);
    return response.data;
  },

  refresh: async (request: RefreshTokenRequest): Promise<AuthTokens> => {
    const response = await apiClient.post<AuthTokens>('/auth/refresh', request);
    return response.data;
  },

  yandexUrl: async (): Promise<YandexAuthUrlResponse> => {
    const response = await apiClient.get<YandexAuthUrlResponse>('/auth/yandex/url');
    return response.data;
  },

  yandexCallback: async (payload: YandexCallbackPayload): Promise<AuthTokens> => {
    const response = await apiClient.post<AuthTokens>('/auth/yandex/callback', payload);
    return response.data;
  },

  yandexSuggest: async (payload: YandexSuggestPayload): Promise<AuthTokens> => {
    const response = await apiClient.post<AuthTokens>('/auth/yandex/suggest', payload);
    return response.data;
  },
};
