import { describe, expect, it } from 'vitest';

import { ErrorUtils } from '../errors';

describe('ErrorUtils.getErrorMessage', () => {
  it('returns the message from the structured API error used by staging', () => {
    expect(
      ErrorUtils.getErrorMessage({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Access forbidden',
          details: { status: 403 },
        },
      }),
    ).toBe('Access forbidden');
  });

  it('returns the message from a structured API error nested in an Axios response', () => {
    expect(
      ErrorUtils.getErrorMessage({
        response: {
          data: {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Payment method is invalid',
              details: { field: 'payment_method' },
            },
          },
        },
      }),
    ).toBe('Payment method is invalid');
  });

  it('never returns an object as display content', () => {
    expect(
      ErrorUtils.getErrorMessage({
        error: { code: 'UNKNOWN', details: { status: 500 } },
      }),
    ).toBe('An unknown error occurred');
  });
});
