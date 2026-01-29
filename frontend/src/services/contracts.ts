import { api } from './http';
import {
  ContractGeneratePayload,
  ContractResponse,
  ContractRefinePayload,
  ExportResponse,
} from '../types/contract';

export async function generateContract(
  payload: ContractGeneratePayload,
): Promise<ContractResponse> {
  const { data } = await api.post<ContractResponse>('/contracts/generate', payload);
  return data;
}

export async function refineContract(
  id: string,
  payload: ContractRefinePayload,
): Promise<ContractResponse> {
  const { data } = await api.post<ContractResponse>(`/contracts/${id}/refine`, payload);
  return data;
}

export async function exportContract(id: string, fmt: 'docx' | 'pdf'): Promise<ExportResponse> {
  const { data } = await api.post<ExportResponse>(`/contracts/${id}/export/${fmt}`);
  return data;
}
