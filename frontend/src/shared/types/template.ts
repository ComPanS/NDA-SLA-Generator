export type TemplateFieldType = 'text';

export interface TemplateField {
  id: string;
  template_id: string;
  group_id: string;
  label: string;
  key: string;
  type: TemplateFieldType;
  default_value: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateGroup {
  id: string;
  template_id: string;
  label: string;
  order: number;
  created_at: string;
  updated_at: string;
  fields: TemplateField[];
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  content: string;
  is_active: boolean;
  default_country_code?: string | null;
  default_output_language?: string | null;
  created_at: string;
  updated_at: string;
  groups: TemplateGroup[];
  sections: TemplateSection[];
}

export interface TemplateSection {
  id: string;
  template_id: string;
  title: string;
  order: number;
  created_at: string;
  updated_at: string;
}
