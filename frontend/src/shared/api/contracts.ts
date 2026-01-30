import apiClient from './client';
import {
  GenerateContractRequest,
  GenerateContractResponse,
  RefineContractRequest,
  ExportContractResponse,
  ContractFieldInput,
} from '@/shared/types';

export const contractsApi = {
  getById: async (documentId: string): Promise<GenerateContractResponse> => {
    const response = await apiClient.get<GenerateContractResponse>(`/contracts/${documentId}`);
    return response.data;
  },

  getAll: async (): Promise<{ documents: Document[] }> => {
    const response = await apiClient.get<{ documents: Document[] }>('/contracts');
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
