import { api } from './http';
import { Template } from '../types/template';

export async function listTemplates(): Promise<Template[]> {
  const { data } = await api.get<Template[]>('/templates');
  return data;
}
