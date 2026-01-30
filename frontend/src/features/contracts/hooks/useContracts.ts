import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contractsApi } from '@/shared/api';
import { ContractFieldInput, ContractSectionInput, Document, GenerateContractRequest, RefineContractRequest } from '@/shared/types';

export const useContract = (documentId: string) => {
  return useQuery({
    queryKey: ['contracts', documentId],
    queryFn: () => contractsApi.getById(documentId),
    enabled: !!documentId,
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
  return useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const data = await contractsApi.getAll();
      return data.documents as Document[];
    },
    staleTime: 60_000,
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
