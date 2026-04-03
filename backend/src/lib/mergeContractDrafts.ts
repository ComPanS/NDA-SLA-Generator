import type { ContractFieldDraft, ContractSectionDraft } from './systemTemplates';

type IncomingField = {
  template_field_id?: string;
  group_label: string;
  group_order?: number;
  label: string;
  key: string;
  value?: string;
  order?: number;
};

type IncomingSection = {
  template_section_id?: string;
  title: string;
  order?: number;
};

export function mergeIncomingFieldsIntoDrafts(
  fieldCopies: ContractFieldDraft[],
  incomingFields: IncomingField[] | undefined,
): void {
  if (!incomingFields?.length) return;
  for (const [idx, field] of incomingFields.entries()) {
    const existingIdx = fieldCopies.findIndex(
      (f) =>
        (field.template_field_id && f.templateFieldId === field.template_field_id) ||
        f.key === field.key,
    );
    const normalized: ContractFieldDraft = {
      templateFieldId: field.template_field_id,
      groupLabel: field.group_label,
      groupOrder: field.group_order ?? idx,
      label: field.label,
      key: field.key,
      value: field.value ?? '',
      order: field.order ?? idx,
    };
    if (existingIdx >= 0) {
      fieldCopies[existingIdx] = { ...fieldCopies[existingIdx], ...normalized };
    } else {
      fieldCopies.push(normalized);
    }
  }
}

export function mergeIncomingSectionsIntoDrafts(
  sectionCopies: ContractSectionDraft[],
  incomingSections: IncomingSection[] | undefined,
): void {
  if (!incomingSections?.length) return;
  for (const [idx, section] of incomingSections.entries()) {
    const existingIdx = sectionCopies.findIndex(
      (s) =>
        (section.template_section_id && s.templateSectionId === section.template_section_id) ||
        s.title === section.title,
    );
    const normalized: ContractSectionDraft = {
      templateSectionId: section.template_section_id,
      title: section.title,
      order: section.order ?? idx,
    };
    if (existingIdx >= 0) {
      sectionCopies[existingIdx] = { ...sectionCopies[existingIdx], ...normalized };
    } else {
      sectionCopies.push(normalized);
    }
  }
}
