import apiClient from './client';
import {
  GenerateContractRequest,
  GenerateContractResponse,
  RefineContractRequest,
  ContractFieldInput,
  ContractSectionInput,
  Document as ContractDocument,
  DocumentStatus,
  GuestGenerateRequest,
  GuestGenerateResponse,
  GuestExportRequest,
  GuestClarifyRequest,
  GuestClarifyResponse,
  GuestImportRequest,
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

  updateStatus: async (documentId: string, status: DocumentStatus): Promise<GenerateContractResponse> => {
    const response = await apiClient.patch<GenerateContractResponse>(`/contracts/${documentId}/status`, {
      status,
    });
    return response.data;
  },

  updateContent: async (documentId: string, content: string): Promise<GenerateContractResponse> => {
    const response = await apiClient.patch<GenerateContractResponse>(`/contracts/${documentId}/content`, {
      content,
    });
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

  guestGenerate: async (request: GuestGenerateRequest): Promise<GuestGenerateResponse> => {
    const response = await apiClient.post<GuestGenerateResponse>('/contracts/guest/generate', request);
    return response.data;
  },

  guestExport: async ({ html, title, format }: GuestExportRequest): Promise<Blob> => {
    const response = await apiClient.post(
      `/contracts/guest/export/${format}`,
      { html, title },
      { responseType: 'blob' }
    );
    return response.data;
  },

  guestClarify: async (request: GuestClarifyRequest): Promise<GuestClarifyResponse> => {
    const response = await apiClient.post<GuestClarifyResponse>('/contracts/guest/clarify', request);
    return response.data;
  },

  guestImport: async (request: GuestImportRequest): Promise<GenerateContractResponse> => {
    const response = await apiClient.post<GenerateContractResponse>('/contracts/guest/import', request);
    return response.data;
  },

  getPublicStats: async (): Promise<{ contracts_total: number }> => {
    const response = await apiClient.get<{ contracts_total: number }>('/contracts/public-stats');
    return response.data;
  },
};
