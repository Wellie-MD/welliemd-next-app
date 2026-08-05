import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatConnection, getConnections, getDeviceData, getVitalsHistory } from '../api';
import type { RawConnection } from '../types';

describe('Devices API & Formatting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatConnection', () => {
    it('formats raw connection correctly and preserves isBackfilling only if defined', () => {
      const rawConn: RawConnection = {
        id: 'conn-1',
        provider: 'garmin',
        status: 'CONNECTED',
        last_sync_at: '2026-08-04T00:00:00Z',
        last_error: null,
        updated_at: new Date().toISOString(),
        is_backfilling: true,
      };

      const formatted = formatConnection(rawConn);
      expect(formatted.id).toBe('conn-1');
      expect(formatted.provider).toBe('garmin');
      expect(formatted.isBackfilling).toBe(true);
    });

    it('omits isBackfilling property when raw connection field is undefined for exactOptionalPropertyTypes compliance', () => {
      const rawConn: RawConnection = {
        id: 'conn-2',
        provider: 'oura',
        status: 'CONNECTED',
        last_sync_at: '2026-08-01T00:00:00Z',
        last_error: null,
        updated_at: new Date().toISOString(),
      };

      const formatted = formatConnection(rawConn);
      expect(formatted.id).toBe('conn-2');
      expect(Object.prototype.hasOwnProperty.call(formatted, 'isBackfilling')).toBe(false);
    });
  });
});
