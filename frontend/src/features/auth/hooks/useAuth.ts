import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/shared/api';
import { authStore } from '../store/authStore';
import {
  LoginCredentials,
  RegisterCredentials,
  VerifyEmailRequest,
  YandexCallbackPayload,
} from '@/shared/types';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';

export const useLogin = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data, variables) => {
      if (data.requires_verification) {
        authStore.getState().setPendingEmail(variables.email);
        navigate('/verify-email');
        return;
      }
      authStore.getState().setTokens(data.access_token, data.refresh_token);
      navigate('/dashboard');
    },
    onError: (error: AxiosError<{ code?: string }>, variables) => {
      if (error.response?.status === 403 && error.response.data?.code === 'email_not_verified') {
        authStore.getState().setPendingEmail(variables.email);
        navigate('/verify-email');
      }
    },
  });
};

export const useRegister = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => authApi.register(credentials),
    onSuccess: (data, variables) => {
      if (data.requires_verification || !data.access_token) {
        authStore.getState().setPendingEmail(variables.email);
        navigate('/verify-email');
        return;
      }
      authStore.getState().setTokens(data.access_token, data.refresh_token!);
      navigate('/dashboard');
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();

  return () => {
    authStore.getState().logout();
    navigate('/');
  };
};

export const useAuthStore = () => authStore();

export const useYandexCallback = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: YandexCallbackPayload) => authApi.yandexCallback(payload),
    onSuccess: (data) => {
      authStore.getState().setTokens(data.access_token, data.refresh_token);
      navigate('/dashboard');
    },
  });
};

export const useYandexSuggest = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (accessToken: string) => authApi.yandexSuggest({ access_token: accessToken }),
    onSuccess: (data) => {
      authStore.getState().setTokens(data.access_token, data.refresh_token);
      navigate('/dashboard');
    },
  });
};

export const useVerifyEmail = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: VerifyEmailRequest) => authApi.verifyEmail(payload),
    onSuccess: (data) => {
      authStore.getState().setTokens(data.access_token, data.refresh_token);
      navigate('/dashboard');
    },
  });
};

export const useResendVerification = () => {
  return useMutation({
    mutationFn: (email: string) => authApi.resendVerification({ email }),
  });
};
