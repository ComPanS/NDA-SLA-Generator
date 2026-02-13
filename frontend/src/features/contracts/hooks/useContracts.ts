import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contractsApi } from '@/shared/api';
import {
  ContractFieldInput,
  ContractSectionInput,
  Document,
  DocumentStatus,
  GenerateContractRequest,
  RefineContractRequest,
  GuestGenerateRequest,
  GuestClarifyRequest,
  GuestExportRequest,
} from '@/shared/types';
import { authStore } from '@/features/auth/store/authStore';

export const useContract = (documentId: string) => {
  const isAuthenticated = authStore((state) => state.isAuthenticated);
  const hasHydrated = authStore((state) => state._hasHydrated);

  return useQuery({
    queryKey: ['contracts', documentId],
    queryFn: () => contractsApi.getById(documentId),
    enabled: !!documentId && hasHydrated && isAuthenticated,
  });
};

export const useGenerateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateContractRequest) => contractsApi.generate(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};

export const useContractsList = () => {
  const isAuthenticated = authStore((state) => state.isAuthenticated);
  const hasHydrated = authStore((state) => state._hasHydrated);

  return useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const data = await contractsApi.getAll();
      return data.documents as Document[];
    },
    staleTime: 60_000,
    enabled: hasHydrated && isAuthenticated,
  });
};

export const useRefineContract = (documentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RefineContractRequest) => contractsApi.refine(documentId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', documentId] });
    },
  });
};

export const useUpdateContractFields = (documentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fields: ContractFieldInput[]) => contractsApi.updateFields(documentId, fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', documentId] });
    },
  });
};

export const useUpdateContractSections = (documentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sections: ContractSectionInput[]) => contractsApi.updateSections(documentId, sections),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', documentId] });
    },
  });
};

export const useExportContract = () => {
  return useMutation({
    mutationFn: async ({ documentId, format, title }: { 
      documentId: string; 
      format: 'docx' | 'pdf';
      title: string;
    }) => {
      const blob = await contractsApi.export(documentId, format);
      
      // Создаем URL для blob
      const url = window.URL.createObjectURL(blob);
      
      // Создаем временную ссылку для скачивания
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.${format}`;
      document.body.appendChild(link);
      link.click();
      
      // Очищаем
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
  });
};

export const useRenameContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, title }: { documentId: string; title: string }) =>
      contractsApi.rename(documentId, title),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => contractsApi.delete(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};

export const useUpdateContractStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, status }: { documentId: string; status: DocumentStatus }) =>
      contractsApi.updateStatus(documentId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};

export const useUpdateContractContent = (documentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => contractsApi.updateContent(documentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', documentId] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};

export const useGuestGenerateContract = () => {
  return useMutation({
    mutationFn: (request: GuestGenerateRequest) => contractsApi.guestGenerate(request),
  });
};

export const useGuestExportContract = () => {
  return useMutation({
    mutationFn: async ({ html, title, format }: GuestExportRequest) => {
      const blob = await contractsApi.guestExport({ html, title, format });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeTitle = `${title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.${format}`;
      link.href = url;
      link.download = safeTitle;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    },
  });
};

export const useGuestClarifyContract = () => {
  return useMutation({
    mutationFn: (request: GuestClarifyRequest) => contractsApi.guestClarify(request),
  });
};
