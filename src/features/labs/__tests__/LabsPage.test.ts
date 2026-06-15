import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { downloadFile } from '@/shared/lib/utils';
import { openAndDownloadPdf } from '../LabsPage';

vi.mock('@/shared/lib/utils', async () => {
  const actual = await vi.importActual<typeof import('@/shared/lib/utils')>('@/shared/lib/utils');
  return {
    ...actual,
    downloadFile: vi.fn(),
  };
});

describe('openAndDownloadPdf', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockReturnValue({ opener: {} } as unknown as Window);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens a PDF preview and triggers a download from the same data URL', async () => {
    const pdfBytes = '%PDF-1.4\n%EOF\n';
    const dataUrl = `data:application/pdf;base64,${btoa(pdfBytes)}`;

    openAndDownloadPdf(dataUrl, 'lab-requisition-123.pdf');

    expect(window.open).toHaveBeenCalledWith('blob:test-url', '_blank', 'noopener,noreferrer');
    expect(downloadFile).toHaveBeenCalledTimes(1);
    const call = vi.mocked(downloadFile).mock.calls[0];
    expect(call).toBeDefined();
    const blob = call?.[0];
    const filename = call?.[1];
    expect(blob).toBeInstanceOf(Blob);
    expect(filename).toBe('lab-requisition-123.pdf');
  });
});
