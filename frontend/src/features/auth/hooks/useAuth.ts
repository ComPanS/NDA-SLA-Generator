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
import { resolveLocalizedPath } from '@/shared/i18n/resolveLocalizedPath';
import i18n from '@/shared/i18n/i18n';
import { useImportGuestContract } from '@/features/contracts/hooks/useContracts';
import {
  GuestImportRequest,
  ContractFieldInput,
  ContractSectionInput,
} from '@/shared/types';
import { isValidOutputLanguageTag } from '@/shared/i18n/outputLanguageTag';

const GUEST_STORAGE_KEY = 'guest-contract-state-v1';

function readGuestDraft(): Record<string, unknown> | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(GUEST_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function clearGuestDraft() {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(GUEST_STORAGE_KEY);
}

export function buildGuestImportPayload(): GuestImportRequest | null {
  const draft = readGuestDraft();
  if (!draft) return null;
  const content = typeof draft.content === 'string' ? draft.content.trim() : '';
  if (!content) return null;

  const title =
    (draft.exportTitle as string | undefined)?.trim() ||
    (draft.title as string | undefined)?.trim() ||
    i18n.t('defaultTitle', { ns: 'guest' });
  const riskAssessment =
    typeof draft.riskSummary === 'string' && draft.riskSummary.trim() ? draft.riskSummary : null;

  const fieldsDraft = Array.isArray(draft.fields) ? (draft.fields as ContractFieldInput[]) : [];
  const sectionsDraft = Array.isArray(draft.sections)
    ? (draft.sections as ContractSectionInput[])
    : [];
  const sectionsEnabled = Boolean(draft.sectionsEnabled);

  const fields =
    fieldsDraft.length > 0
      ? fieldsDraft.map((f, idx) => ({
          template_field_id: f.template_field_id,
          group_label: f.group_label,
          group_order: f.group_order ?? idx,
          label: f.label,
          key: f.key,
          value: f.value ?? '',
          order: f.order ?? idx,
        }))
      : undefined;

  const sections =
    sectionsEnabled && sectionsDraft.length > 0
      ? sectionsDraft.map((s, idx) => ({
          template_section_id: s.template_section_id,
          title: s.title,
          order: s.order ?? idx,
        }))
      : undefined;

  const countryCodeRaw = draft.countryCode;
  const importCountry =
    typeof countryCodeRaw === 'string' && /^[A-Z]{2}$/i.test(countryCodeRaw)
      ? countryCodeRaw.toUpperCase()
      : undefined;
  const outputLangRaw = draft.outputLanguage;
  const importOutputLang =
    typeof outputLangRaw === 'string' && isValidOutputLanguageTag(outputLangRaw)
      ? outputLangRaw.trim().replace(/_/g, '-')
      : undefined;

  return {
    title,
    content,
    risk_assessment: riskAssessment ?? undefined,
    country_code: importCountry,
    output_language: importOutputLang,
    fields,
    sections,
  };
}

export const useLogin = () => {
  const navigate = useNavigate();
  const importGuestMutation = useImportGuestContract();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: async (data, variables) => {
      if (data.requires_verification) {
        authStore.getState().setPendingEmail(variables.email);
        navigate(resolveLocalizedPath('/verify-email'));
        return;
      }
      authStore.getState().setTokens(data.access_token, data.refresh_token);
      try {
        const payload = buildGuestImportPayload();
        if (payload) {
          await importGuestMutation.mutateAsync(payload);
          clearGuestDraft();
        }
      } catch (error) {
        console.error('Guest contract import failed after login', error);
      }
      navigate(resolveLocalizedPath('/dashboard'));
    },
    onError: (error: AxiosError<{ code?: string }>, variables) => {
      if (error.response?.status === 403 && error.response.data?.code === 'email_not_verified') {
        authStore.getState().setPendingEmail(variables.email);
        navigate(resolveLocalizedPath('/verify-email'));
      }
    },
  });
};

export const useRegister = () => {
  const navigate = useNavigate();
  const importGuestMutation = useImportGuestContract();

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => authApi.register(credentials),
    onSuccess: async (data, variables) => {
      if (data.requires_verification || !data.access_token) {
        authStore.getState().setPendingEmail(variables.email);
        navigate(resolveLocalizedPath('/verify-email'));
        return;
      }
      authStore.getState().setTokens(data.access_token, data.refresh_token!);
      try {
        const payload = buildGuestImportPayload();
        if (payload) {
          await importGuestMutation.mutateAsync(payload);
          clearGuestDraft();
        }
      } catch (error) {
        console.error('Guest contract import failed after registration', error);
      }
      navigate(resolveLocalizedPath('/dashboard'));
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();

  return () => {
    authStore.getState().logout();
    navigate(resolveLocalizedPath('/'));
  };
};

export const useAuthStore = () => authStore();

export const useYandexCallback = () => {
  const navigate = useNavigate();
  const importGuestMutation = useImportGuestContract();

  return useMutation({
    mutationFn: (payload: YandexCallbackPayload) => authApi.yandexCallback(payload),
    onSuccess: async (data) => {
      authStore.getState().setTokens(data.access_token, data.refresh_token);
      try {
        const payload = buildGuestImportPayload();
        if (payload) {
          await importGuestMutation.mutateAsync(payload);
          clearGuestDraft();
        }
      } catch (error) {
        console.error('Guest contract import failed after Yandex login', error);
      }
      navigate(resolveLocalizedPath('/dashboard'));
    },
  });
};

export const useYandexSuggest = () => {
  const navigate = useNavigate();
  const importGuestMutation = useImportGuestContract();

  return useMutation({
    mutationFn: (accessToken: string) => authApi.yandexSuggest({ access_token: accessToken }),
    onSuccess: async (data) => {
      authStore.getState().setTokens(data.access_token, data.refresh_token);
      try {
        const payload = buildGuestImportPayload();
        if (payload) {
          await importGuestMutation.mutateAsync(payload);
          clearGuestDraft();
        }
      } catch (error) {
        console.error('Guest contract import failed after Yandex suggest', error);
      }
      navigate(resolveLocalizedPath('/dashboard'));
    },
  });
};

export const useVerifyEmail = () => {
  const navigate = useNavigate();
  const importGuestMutation = useImportGuestContract();

  return useMutation({
    mutationFn: (payload: VerifyEmailRequest) => authApi.verifyEmail(payload),
    onSuccess: async (data) => {
      authStore.getState().setTokens(data.access_token, data.refresh_token);
      try {
        const payload = buildGuestImportPayload();
        if (payload) {
          await importGuestMutation.mutateAsync(payload);
          clearGuestDraft();
        }
      } catch (error) {
        console.error('Guest contract import failed after email verification', error);
      }
      navigate(resolveLocalizedPath('/dashboard'));
    },
  });
};

export const useResendVerification = () => {
  return useMutation({
    mutationFn: (email: string) => authApi.resendVerification({ email }),
  });
};

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (email: string) => authApi.requestPasswordReset({ email }),
  });
};

export const useResetPassword = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: { token: string; password: string }) => authApi.resetPassword(payload),
    onSuccess: () => {
      navigate(resolveLocalizedPath('/login'), { state: { passwordReset: true } });
    },
  });
};
