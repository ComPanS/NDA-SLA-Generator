export type DocumentStatus = 'draft' | 'final';

export interface RiskAssessment {
  id: string;
  document_version_id: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  version: number;
  content: string;
  created_at: string;
  updated_at: string;
  risk_assessment?: RiskAssessment | null;
}

export interface Document {
  id: string;
  title: string;
  owner_id: string;
  template_id: string | null;
  template_name?: string | null;
  jurisdiction_country: string;
  output_language: string;
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
  country_code?: string;
  output_language?: string;
  fields?: ContractFieldInput[];
  sections?: ContractSectionInput[];
}

export interface RefineContractRequest {
  prompt: string;
  format_mode?: string;
  risk_check?: boolean;
  country_code?: string;
  output_language?: string;
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
  /** Stable client id for UI (e.g. drag-and-drop); omitted from persistence on the server. */
  section_uid?: string;
  title: string;
  order?: number;
}

export interface GuestGenerateRequest {
  title: string;
  prompt: string;
  /** Только `system-*`; UUID пользовательских шаблонов в гостевом API не допускаются. */
  template_id?: string;
  risk_check?: boolean;
  country_code?: string;
  output_language?: string;
  fields?: ContractFieldInput[];
  sections?: ContractSectionInput[];
}

export interface GuestGenerateResponse {
  content: string;
  title: string;
  risk_assessment?: string | null;
}

export interface GuestExportRequest {
  html: string;
  title: string;
  format: 'docx' | 'pdf';
}

export interface GuestClarifyRequest {
  title: string;
  content: string;
  prompt: string;
  risk_check?: boolean;
  country_code?: string;
  output_language?: string;
}

export interface GuestClarifyResponse {
  content: string;
  risk_assessment?: string | null;
}

export interface GuestImportRequest {
  title: string;
  content: string;
  fields?: ContractFieldInput[];
  sections?: ContractSectionInput[];
  risk_assessment?: string | null;
  country_code?: string;
  output_language?: string;
}
