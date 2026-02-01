import { describe, expect, it } from 'vitest';
import { toTemplate, toDocument } from '../lib/mappers';

describe('mappers', () => {
  it('maps template essentials', () => {
    const dto = toTemplate({
      id: 'tpl1',
      name: 'Template',
      description: null,
      content: 'base content',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-02'),
      groups: [],
      sections: [],
    } as any);

    expect(dto).toMatchObject({
      id: 'tpl1',
      name: 'Template',
      content: 'base content',
      is_active: true,
    });
  });

  it('maps document essentials', () => {
    const dto = toDocument({
      id: 'doc1',
      title: 'Doc',
      ownerId: 'user1',
      templateId: 'tpl1',
      status: 'draft',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-02'),
    } as any);

    expect(dto).toMatchObject({
      id: 'doc1',
      title: 'Doc',
      owner_id: 'user1',
      status: 'draft',
    });
  });
});
