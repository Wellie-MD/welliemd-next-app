import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/client';
import { PaymentMethodsService } from '../payment-methods.service';

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('PaymentMethodsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads NMI payment methods from the backend payments route', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] } as never);

    await PaymentMethodsService.listPaymentMethods('nmi');

    expect(apiClient.get).toHaveBeenCalledWith('/payments/payment-methods/');
  });
});
