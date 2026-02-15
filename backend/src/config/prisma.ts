import { PrismaClient } from '@prisma/client';
import { decryptString, encryptString } from '../lib/crypto';

type AnyRecord = Record<string, unknown>;

function normalizeArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function encryptDocumentData(data: AnyRecord): AnyRecord {
  if (typeof data.title === 'string') data.title = encryptString(data.title);

  if (data.versions && typeof data.versions === 'object') {
    const versions = data.versions as AnyRecord;
    if (versions.create) {
      versions.create = normalizeArray(versions.create as unknown[]).map((v) =>
        encryptDocumentVersionData({ ...(v as AnyRecord) }),
      );
    }
    if (versions.update) {
      versions.update = normalizeArray(versions.update as unknown[]).map((v) =>
        encryptDocumentVersionData({ ...(v as AnyRecord) }),
      );
    }
    if (versions.upsert) {
      versions.upsert = normalizeArray(versions.upsert as unknown[]).map((v) => ({
        where: (v as AnyRecord).where,
        update: encryptDocumentVersionData({ ...((v as AnyRecord).update as AnyRecord) }),
        create: encryptDocumentVersionData({ ...((v as AnyRecord).create as AnyRecord) }),
      }));
    }
  }

  if (data.fields && typeof data.fields === 'object') {
    const fields = data.fields as AnyRecord;
    if (fields.create) {
      fields.create = normalizeArray(fields.create as unknown[]).map((f) =>
        encryptContractFieldData({ ...(f as AnyRecord) }),
      );
    }
    if (fields.createMany) {
      const createMany = fields.createMany as AnyRecord;
      if (createMany.data) {
        createMany.data = normalizeArray(createMany.data as unknown[]).map((f) =>
          encryptContractFieldData({ ...(f as AnyRecord) }),
        );
      }
    }
    if (fields.update) {
      fields.update = normalizeArray(fields.update as unknown[]).map((f) =>
        encryptContractFieldData({ ...(f as AnyRecord) }),
      );
    }
    if (fields.upsert) {
      fields.upsert = normalizeArray(fields.upsert as unknown[]).map((f) => ({
        ...(f as AnyRecord),
        update: encryptContractFieldData({ ...((f as AnyRecord).update as AnyRecord) }),
        create: encryptContractFieldData({ ...((f as AnyRecord).create as AnyRecord) }),
      }));
    }
  }

  if (data.sections && typeof data.sections === 'object') {
    const sections = data.sections as AnyRecord;
    if (sections.create) {
      sections.create = normalizeArray(sections.create as unknown[]).map((s) =>
        encryptContractSectionData({ ...(s as AnyRecord) }),
      );
    }
    if (sections.createMany) {
      const createMany = sections.createMany as AnyRecord;
      if (createMany.data) {
        createMany.data = normalizeArray(createMany.data as unknown[]).map((s) =>
          encryptContractSectionData({ ...(s as AnyRecord) }),
        );
      }
    }
  }

  return data;
}

function encryptDocumentVersionData(data: AnyRecord): AnyRecord {
  if (typeof data.content === 'string') data.content = encryptString(data.content);
  if (data.riskAssessment && typeof data.riskAssessment === 'object') {
    const ra = data.riskAssessment as AnyRecord;
    if (ra.create && typeof (ra.create as AnyRecord).summary === 'string') {
      (ra.create as AnyRecord).summary = encryptString((ra.create as AnyRecord).summary as string);
    }
    if (typeof ra.summary === 'string') {
      ra.summary = encryptString(ra.summary);
    }
  }
  return data;
}

function encryptContractFieldData(data: AnyRecord): AnyRecord {
  if (typeof data.value === 'string') data.value = encryptString(data.value);
  if (typeof data.groupLabel === 'string') data.groupLabel = encryptString(data.groupLabel);
  if (typeof data.label === 'string') data.label = encryptString(data.label);
  return data;
}

function encryptContractSectionData(data: AnyRecord): AnyRecord {
  if (typeof data.title === 'string') data.title = encryptString(data.title);
  return data;
}

function encryptTemplateData(data: AnyRecord): AnyRecord {
  if (typeof data.content === 'string') data.content = encryptString(data.content);
  if (typeof data.description === 'string') data.description = encryptString(data.description);
  return data;
}

function encryptTemplateGroupData(data: AnyRecord): AnyRecord {
  if (typeof data.label === 'string') data.label = encryptString(data.label);
  return data;
}

function encryptTemplateFieldData(data: AnyRecord): AnyRecord {
  if (typeof data.label === 'string') data.label = encryptString(data.label);
  if (typeof data.defaultValue === 'string') data.defaultValue = encryptString(data.defaultValue);
  return data;
}

function encryptTemplateSectionData(data: AnyRecord): AnyRecord {
  if (typeof data.title === 'string') data.title = encryptString(data.title);
  return data;
}

function encryptRiskAssessmentData(data: AnyRecord): AnyRecord {
  if (typeof data.summary === 'string') data.summary = encryptString(data.summary);
  return data;
}

function decryptDocumentVersion(result: AnyRecord): AnyRecord {
  if (typeof result.content === 'string') result.content = decryptString(result.content);
  if (result.riskAssessment) {
    const ra = result.riskAssessment as AnyRecord;
    if (typeof ra.summary === 'string') ra.summary = decryptString(ra.summary);
  }
  return result;
}

function decryptContractField(result: AnyRecord): AnyRecord {
  if (typeof result.value === 'string') result.value = decryptString(result.value);
  if (typeof result.groupLabel === 'string') result.groupLabel = decryptString(result.groupLabel);
  if (typeof result.label === 'string') result.label = decryptString(result.label);
  return result;
}

function decryptContractSection(result: AnyRecord): AnyRecord {
  if (typeof result.title === 'string') result.title = decryptString(result.title);
  return result;
}

function decryptTemplate(result: AnyRecord): AnyRecord {
  if (typeof result.content === 'string') result.content = decryptString(result.content);
  if (typeof result.description === 'string') result.description = decryptString(result.description);
  if (result.groups) {
    result.groups = (result.groups as AnyRecord[]).map((g) => decryptTemplateGroup({ ...g }));
    for (const group of result.groups as AnyRecord[]) {
      if (group.fields) {
        group.fields = (group.fields as AnyRecord[]).map((f) => decryptTemplateField({ ...f }));
      }
    }
  }
  if (result.sections) {
    result.sections = (result.sections as AnyRecord[]).map((s) => decryptTemplateSection({ ...s }));
  }
  return result;
}

function decryptTemplateGroup(result: AnyRecord): AnyRecord {
  if (typeof result.label === 'string') result.label = decryptString(result.label);
  return result;
}

function decryptTemplateField(result: AnyRecord): AnyRecord {
  if (typeof result.label === 'string') result.label = decryptString(result.label);
  if (typeof result.defaultValue === 'string') result.defaultValue = decryptString(result.defaultValue);
  return result;
}

function decryptTemplateSection(result: AnyRecord): AnyRecord {
  if (typeof result.title === 'string') result.title = decryptString(result.title);
  return result;
}

function decryptRiskAssessment(result: AnyRecord): AnyRecord {
  if (typeof result.summary === 'string') result.summary = decryptString(result.summary);
  return result;
}

function decryptDocument(result: AnyRecord): AnyRecord {
  if (typeof result.title === 'string') result.title = decryptString(result.title);
  if (result.versions) {
    result.versions = (result.versions as AnyRecord[]).map((v) => decryptDocumentVersion({ ...v }));
  }
  if (result.fields) {
    result.fields = (result.fields as AnyRecord[]).map((f) => decryptContractField({ ...f }));
  }
  if (result.sections) {
    result.sections = (result.sections as AnyRecord[]).map((s) => decryptContractSection({ ...s }));
  }
  if (result.template) {
    result.template = decryptTemplate({ ...(result.template as AnyRecord) });
  }
  return result;
}

function maybeDecrypt(model?: string, data?: unknown): unknown {
  if (!data) return data;
  const apply = (value: AnyRecord) => {
    switch (model) {
      case 'Document':
        return decryptDocument({ ...value });
      case 'DocumentVersion':
        return decryptDocumentVersion({ ...value });
      case 'ContractField':
        return decryptContractField({ ...value });
      case 'ContractSection':
        return decryptContractSection({ ...value });
      case 'Template':
        return decryptTemplate({ ...value });
      case 'TemplateGroup':
        return decryptTemplateGroup({ ...value });
      case 'TemplateField':
        return decryptTemplateField({ ...value });
      case 'TemplateSection':
        return decryptTemplateSection({ ...value });
      case 'RiskAssessment':
        return decryptRiskAssessment({ ...value });
      default:
        return value;
    }
  };

  if (Array.isArray(data)) return data.map((item) => apply(item as AnyRecord));
  return apply(data as AnyRecord);
}

function maybeEncrypt(model?: string, action?: string, args?: AnyRecord): AnyRecord | undefined {
  if (!args || !args.data) return args;

  // Handle createMany/updateMany arrays first to avoid treating array data as objects
  if ((action === 'createMany' || action === 'updateMany') && Array.isArray(args.data)) {
    args.data = (args.data as AnyRecord[]).map((item) => maybeEncrypt(model, 'single', { data: item })?.data);
    return args;
  }

  const data = args.data as AnyRecord;
  switch (model) {
    case 'Document':
      args.data = encryptDocumentData({ ...data });
      break;
    case 'DocumentVersion':
      args.data = encryptDocumentVersionData({ ...data });
      break;
    case 'ContractField':
      args.data = encryptContractFieldData({ ...data });
      break;
    case 'ContractSection':
      args.data = encryptContractSectionData({ ...data });
      break;
    case 'Template':
      args.data = encryptTemplateData({ ...data });
      break;
    case 'TemplateGroup':
      args.data = encryptTemplateGroupData({ ...data });
      break;
    case 'TemplateField':
      args.data = encryptTemplateFieldData({ ...data });
      break;
    case 'TemplateSection':
      args.data = encryptTemplateSectionData({ ...data });
      break;
    case 'RiskAssessment':
      args.data = encryptRiskAssessmentData({ ...data });
      break;
    default:
      break;
  }

  return args;
}

const prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export const prisma = prismaClient.$extends({
  query: {
    $allModels: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async $allOperations({ model, operation, args, query }: any) {
        if (['create', 'update', 'upsert', 'createMany', 'updateMany'].includes(operation)) {
          args = maybeEncrypt(model, operation, args);
        }
        const result = await query(args);
        if (
          ['findUnique', 'findFirst', 'findMany', 'create', 'update', 'upsert', 'createMany', 'updateMany'].includes(
            operation,
          )
        ) {
          return maybeDecrypt(model, result);
        }
        return result;
      },
    },
  },
});
