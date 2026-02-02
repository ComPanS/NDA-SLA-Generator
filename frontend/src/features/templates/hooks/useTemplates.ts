import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { templatesApi, TemplatePayload } from '@/shared/api';
import { Template } from '@/shared/types';
import { authStore } from '@/features/auth/store/authStore';

export const useTemplates = () => {
  const isAuthenticated = authStore((state) => state.isAuthenticated);
  const hasHydrated = authStore((state) => state._hasHydrated);
  const isEnabled = hasHydrated && isAuthenticated;

  return useQuery({
    queryKey: ['templates'],
    queryFn: () => {
      return templatesApi.getAll();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isEnabled,
  });
};

export const useTemplate = (id?: string) => {
  return useQuery({
    queryKey: ['template', id],
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
      queryClient.setQueryData(['template', template.id], template);
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
      queryClient.setQueryData(['template', template.id], template);
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
