import {
  ContractField,
  Document,
  DocumentStatus,
  DocumentVersion,
  Subscription,
  Template,
  TemplateField,
  TemplateGroup,
  TemplateSection,
  ContractSection,
  RiskAssessment,
} from '@prisma/client';

type TemplateWithRelations = Template & {
  groups?: Array<TemplateGroup & { fields?: TemplateField[] }>;
  sections?: TemplateSection[];
};
type DocumentTemplateMinimal = Pick<Template, 'name'> & Partial<Template>;

type DocumentWithRelations = Document & {
  template?: DocumentTemplateMinimal | null;
  versions?: Array<DocumentVersion & { riskAssessment?: RiskAssessment | null }>;
  fields?: ContractField[];
  sections?: ContractSection[];
};

type SubscriptionWithMeta = Subscription & {
  autoRenew?: boolean | null;
};

export function toTemplateField(api: TemplateField) {
  return {
    id: api.id,
    template_id: api.templateId,
    group_id: api.groupId,
    label: api.label,
    key: api.key,
    type: api.type,
    default_value: api.defaultValue ?? '',
    order: api.order,
    created_at: api.createdAt.toISOString(),
    updated_at: api.updatedAt.toISOString(),
  };
}

export function toTemplateGroup(api: TemplateGroup & { fields?: TemplateField[] }) {
  return {
    id: api.id,
    template_id: api.templateId,
    label: api.label,
    order: api.order,
    created_at: api.createdAt.toISOString(),
    updated_at: api.updatedAt.toISOString(),
    fields: (api.fields || []).map(toTemplateField).sort((a, b) => a.order - b.order),
  };
}

export function toTemplate(api: TemplateWithRelations) {
  return {
    id: api.id,
    name: api.name,
    description: api.description || undefined,
    content: api.content,
    is_active: api.isActive,
    created_at: api.createdAt.toISOString(),
    updated_at: api.updatedAt.toISOString(),
    groups: (api.groups || []).map(toTemplateGroup).sort((a, b) => a.order - b.order),
    sections: (api.sections || [])
      .map((s) => ({
        id: s.id,
        template_id: s.templateId,
        title: s.title,
        order: s.order,
        created_at: s.createdAt.toISOString(),
        updated_at: s.updatedAt.toISOString(),
      }))
      .sort((a, b) => a.order - b.order),
  };
}

export function toRiskAssessment(api?: RiskAssessment | null) {
  if (!api) return null;
  return {
    id: api.id,
    document_version_id: api.documentVersionId,
    summary: api.summary,
    created_at: api.createdAt.toISOString(),
    updated_at: api.updatedAt.toISOString(),
  };
}

export function toVersion(api: DocumentVersion & { riskAssessment?: RiskAssessment | null }) {
  return {
    id: api.id,
    version: api.version,
    content: api.content,
    created_at: api.createdAt.toISOString(),
    updated_at: api.updatedAt.toISOString(),
    risk_assessment: toRiskAssessment(api.riskAssessment || null),
  };
}

export function toContractField(api: ContractField) {
  return {
    id: api.id,
    document_id: api.documentId,
    template_field_id: api.templateFieldId || undefined,
    group_label: api.groupLabel,
    group_order: api.groupOrder,
    label: api.label,
    key: api.key,
    value: api.value ?? '',
    order: api.order,
    created_at: api.createdAt.toISOString(),
    updated_at: api.updatedAt.toISOString(),
  };
}

export function toDocument(api: DocumentWithRelations) {
  const versionsSorted = (api.versions || []).slice().sort((a, b) => a.version - b.version);
  return {
    id: api.id,
    title: api.title,
    owner_id: api.ownerId,
    template_id: api.templateId,
    status: api.status,
    created_at: api.createdAt.toISOString(),
    updated_at: api.updatedAt.toISOString(),
    template_name: api.template?.name,
    versions: versionsSorted.map(toVersion),
    fields: (api.fields || []).map(toContractField).sort((a, b) => {
      if (a.group_order === b.group_order) {
        return a.order - b.order;
      }
      return a.group_order - b.group_order;
    }),
    sections: (api.sections || [])
      .map((s) => ({
        id: s.id,
        document_id: s.documentId,
        template_section_id: s.templateSectionId || undefined,
        title: s.title,
        order: s.order,
        created_at: s.createdAt.toISOString(),
        updated_at: s.updatedAt.toISOString(),
      }))
      .sort((a, b) => a.order - b.order),
  };
}

export function toBilling(sub?: Subscription | null) {
  if (!sub) {
    return { plan: 'freemium', status: 'active', auto_renew: false };
  }
  const subscription = sub as SubscriptionWithMeta;
  const autoRenew =
    subscription.autoRenew !== undefined && subscription.autoRenew !== null
      ? Boolean(subscription.autoRenew)
      : true;
  return {
    id: sub.id,
    plan: sub.plan,
    status: sub.status,
    expires_at: sub.expiresAt?.toISOString() || null,
    auto_renew: autoRenew,
    created_at: sub.createdAt.toISOString(),
    updated_at: sub.updatedAt.toISOString(),
  };
}

export function defaultDocumentStatus(): DocumentStatus {
  return 'draft';
}
