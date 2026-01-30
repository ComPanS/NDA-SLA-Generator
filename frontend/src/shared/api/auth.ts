import apiClient from './client';
import {
  AuthTokens,
  LoginCredentials,
  RegisterCredentials,
  RefreshTokenRequest,
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
};
