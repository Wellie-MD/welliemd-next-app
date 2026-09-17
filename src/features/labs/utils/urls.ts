const PDF_DATA_URL = /^data:application\/pdf;base64,[a-z0-9+/=\s]+$/i;

export function safeLabUrl(value?: string | null, options?: { allowPdfData?: boolean }): string | null {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;
  if (options?.allowPdfData && PDF_DATA_URL.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}
