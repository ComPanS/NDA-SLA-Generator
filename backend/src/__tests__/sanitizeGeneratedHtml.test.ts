import { describe, expect, it } from 'vitest';
import { sanitizeGeneratedHtml } from '../routes/contracts';

describe('sanitizeGeneratedHtml', () => {
  it('removes scripts and javascript URLs', () => {
    const dirty = '<h1>Title</h1><script>alert(1)</script><a href="javascript:alert(1)">x</a>';
    const result = sanitizeGeneratedHtml(dirty, 'Title');

    expect(result).toContain('<h1>Title</h1>');
    expect(result).not.toMatch(/<script/i);
    expect(result).not.toContain('javascript:');
  });

  it('keeps formatting and enforces safe anchor attributes', () => {
    const html =
      '<p><strong>Bold</strong> <a href="https://example.com" target="_blank">link</a></p>';
    const result = sanitizeGeneratedHtml(html, 'Title');

    expect(result).toContain('<strong>Bold</strong>');
    expect(result).toContain('https://example.com');
    expect(result).toContain('rel="noopener noreferrer"');
  });
});
