import { FormatMode } from './format';

export type ContractGeneratePayload = {
  title: string;
  template_id?: string;
  prompt: string;
  format_mode?: FormatMode;
  risk_check?: boolean;
};

export type ContractRefinePayload = {
  prompt: string;
  format_mode?: FormatMode;
  risk_check?: boolean;
};

export type DocumentVersion = {
  id: string;
  version: number;
  content: string;
  created_at: string;
};

export type Document = {
  id: string;
  title: string;
  owner_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  versions: DocumentVersion[];
};

export type ContractResponse = {
  document: Document;
  risk_report?: string[];
};

export type ExportResponse = {
  document_id: string;
  format: string;
  message: string;
  content_preview: string;
};
