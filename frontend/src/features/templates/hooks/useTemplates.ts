import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { templatesApi, TemplatePayload } from '@/shared/api';
import { Template } from '@/shared/types';
import { authStore } from '@/features/auth/store/authStore';

export const useTemplates = () => {
  const { i18n } = useTranslation();
  const langKey = i18n.resolvedLanguage ?? i18n.language;
  const isAuthenticated = authStore((state) => state.isAuthenticated);
  const hasHydrated = authStore((state) => state._hasHydrated);
  const isEnabled = hasHydrated && isAuthenticated;

  return useQuery({
    queryKey: ['templates', langKey],
    queryFn: () => {
      return templatesApi.getAll();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isEnabled,
  });
};

/** Публичный список системных шаблонов (`GET /templates/catalog`), без авторизации. */
export const useSystemTemplateCatalog = () => {
  const { i18n } = useTranslation();
  const langKey = i18n.resolvedLanguage ?? i18n.language;

  return useQuery({
    queryKey: ['templates', 'catalog', langKey],
    queryFn: () => templatesApi.getCatalog(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useTemplate = (id?: string) => {
  const { i18n } = useTranslation();
  const langKey = i18n.resolvedLanguage ?? i18n.language;

  return useQuery({
    queryKey: ['template', id, langKey],
    queryFn: () => templatesApi.getById(id as string),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TemplatePayload) => templatesApi.create(payload),
    onSuccess: (template: Template) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', template.id] });
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TemplatePayload }) =>
      templatesApi.update(id, payload),
    onSuccess: (template: Template) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', template.id] });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.removeQueries({ queryKey: ['template', id] });
    },
  });
};
