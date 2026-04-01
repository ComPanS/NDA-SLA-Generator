import apiClient from './client';
import {
  AuthTokens,
  LoginCredentials,
  RegisterCredentials,
  RefreshTokenRequest,
  RegistrationResponse,
  ResendVerificationRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  YandexAuthUrlResponse,
  YandexCallbackPayload,
  YandexSuggestPayload,
} from '@/shared/types';

export const authApi = {
  register: async (credentials: RegisterCredentials): Promise<RegistrationResponse> => {
    const response = await apiClient.post<RegistrationResponse>('/auth/register', credentials);
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

  verifyEmail: async (payload: VerifyEmailRequest): Promise<AuthTokens> => {
    const response = await apiClient.post<AuthTokens>('/auth/verify', payload);
    return response.data;
  },

  resendVerification: async (payload: ResendVerificationRequest): Promise<void> => {
    await apiClient.post('/auth/resend', payload);
  },

  requestPasswordReset: async (payload: ForgotPasswordRequest): Promise<{ ok: boolean }> => {
    const response = await apiClient.post<{ ok: boolean }>('/auth/forgot-password', payload);
    return response.data;
  },

  resetPassword: async (payload: ResetPasswordRequest): Promise<{ ok: boolean }> => {
    const response = await apiClient.post<{ ok: boolean }>('/auth/reset-password', payload);
    return response.data;
  },
};
