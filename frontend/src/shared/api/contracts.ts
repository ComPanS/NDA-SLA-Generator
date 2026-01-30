import apiClient from './client';
import {
  GenerateContractRequest,
  GenerateContractResponse,
  RefineContractRequest,
  ExportContractResponse,
  ContractFieldInput,
  ContractSectionInput,
  Document as ContractDocument,
} from '@/shared/types';

export const contractsApi = {
  getById: async (documentId: string): Promise<GenerateContractResponse> => {
    const response = await apiClient.get<GenerateContractResponse>(`/contracts/${documentId}`);
    return response.data;
  },

  getAll: async (): Promise<{ documents: ContractDocument[] }> => {
    const response = await apiClient.get<{ documents: ContractDocument[] }>('/contracts');
    return response.data;
  },

  generate: async (request: GenerateContractRequest): Promise<GenerateContractResponse> => {
    const response = await apiClient.post<GenerateContractResponse>('/contracts/generate', request);
    return response.data;
  },

  refine: async (
    documentId: string,
    request: RefineContractRequest
  ): Promise<GenerateContractResponse> => {
    const response = await apiClient.post<GenerateContractResponse>(
      `/contracts/${documentId}/refine`,
      request
    );
    return response.data;
  },

  updateFields: async (documentId: string, fields: ContractFieldInput[]): Promise<GenerateContractResponse> => {
    const response = await apiClient.put<GenerateContractResponse>(`/contracts/${documentId}/fields`, {
      fields,
    });
    return response.data;
  },

  updateSections: async (documentId: string, sections: ContractSectionInput[]): Promise<GenerateContractResponse> => {
    const response = await apiClient.put<GenerateContractResponse>(`/contracts/${documentId}/sections`, {
      sections,
    });
    return response.data;
  },

  rename: async (documentId: string, title: string): Promise<GenerateContractResponse> => {
    const response = await apiClient.patch<GenerateContractResponse>(`/contracts/${documentId}`, { title });
    return response.data;
  },

  delete: async (documentId: string): Promise<void> => {
    await apiClient.delete(`/contracts/${documentId}`);
  },

  export: async (documentId: string, format: 'docx' | 'pdf'): Promise<Blob> => {
    const response = await apiClient.post(
      `/contracts/${documentId}/export/${format}`,
      {},
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};
