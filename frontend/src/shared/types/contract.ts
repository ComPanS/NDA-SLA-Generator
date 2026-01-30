export type DocumentStatus = 'draft' | 'final';

export interface DocumentVersion {
  id: string;
  version: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  owner_id: string;
  template_id: string | null;
  template_name?: string | null;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
  versions: DocumentVersion[];
  current_version?: DocumentVersion;
  fields?: ContractField[];
   sections?: ContractSection[];
}

export interface GenerateContractRequest {
  title: string;
  template_id?: string;
  prompt: string;
  format_mode?: string;
  risk_check?: boolean;
  fields?: ContractFieldInput[];
  sections?: ContractSectionInput[];
}

export interface RefineContractRequest {
  prompt: string;
  format_mode?: string;
  risk_check?: boolean;
}

export interface GenerateContractResponse {
  document: Document;
}

export interface ExportContractResponse {
  success: boolean;
}

export interface ContractField {
  id: string;
  document_id: string;
  template_field_id?: string;
  group_label: string;
  group_order: number;
  label: string;
  key: string;
  value: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ContractFieldInput {
  id?: string;
  template_field_id?: string;
  group_label: string;
  group_order?: number;
  label: string;
  key: string;
  value?: string;
  order?: number;
}

export interface ContractSection {
  id: string;
  document_id: string;
  template_section_id?: string;
  title: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ContractSectionInput {
  id?: string;
  template_section_id?: string;
  title: string;
  order?: number;
}
