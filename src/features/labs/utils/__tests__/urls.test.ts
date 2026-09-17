import { describe, expect, it } from 'vitest';

import { safeLabUrl } from '../urls';

describe('safeLabUrl', () => {
  it('allows HTTP(S) and same-origin relative paths', () => {
    expect(safeLabUrl('https://patient.junction.health/book/1')).toBe(
      'https://patient.junction.health/book/1'
    );
    expect(safeLabUrl('/api/v1/patient/labs/1/pdf/')).toBe('/api/v1/patient/labs/1/pdf/');
  });

  it('rejects executable and protocol-relative URLs', () => {
    expect(safeLabUrl('javascript:alert(1)')).toBeNull();
    expect(safeLabUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(safeLabUrl('//attacker.example/path')).toBeNull();
  });

  it('allows PDF data only when explicitly requested', () => {
    const pdf = 'data:application/pdf;base64,JVBERi0xLjQ=';
    expect(safeLabUrl(pdf)).toBeNull();
    expect(safeLabUrl(pdf, { allowPdfData: true })).toBe(pdf);
  });
});
