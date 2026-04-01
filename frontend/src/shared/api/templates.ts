import apiClient from './client';
import { Template } from '@/shared/types';

export interface TemplatePayload {
  name: string;
  description?: string | null;
  content: string;
  is_active?: boolean;
  default_country_code?: string | null;
  groups: Array<{
    label: string;
    order?: number;
    fields: Array<{
      label: string;
      key: string;
      default_value?: string;
      order?: number;
    }>;
  }>;
  sections: Array<{
    title: string;
    order?: number;
  }>;
}

export const templatesApi = {
  getAll: async (): Promise<Template[]> => {
    const response = await apiClient.get<Template[]>('/templates');
    return response.data;
  },

  getById: async (id: string): Promise<Template> => {
    const response = await apiClient.get<{ template: Template }>(`/templates/${id}`);
    return response.data.template;
  },

  create: async (payload: TemplatePayload): Promise<Template> => {
    const response = await apiClient.post<{ template: Template }>('/templates', payload);
    return response.data.template;
  },

  update: async (id: string, payload: TemplatePayload): Promise<Template> => {
    const response = await apiClient.put<{ template: Template }>(`/templates/${id}`, payload);
    return response.data.template;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/templates/${id}`);
  },
};
