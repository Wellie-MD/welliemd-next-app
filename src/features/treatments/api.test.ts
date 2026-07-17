import { describe, expect, it } from 'vitest';
import { startNewTreatment, type AvailableTreatment } from './api';

const treatment = (overrides: Partial<AvailableTreatment> = {}): AvailableTreatment => ({
  id: 'wrapper-1',
  name: 'Combined Program',
  description: '',
  slug: 'combined-program',
  category: 'Weight Management',
  categories: ['Weight Management', 'Hormone Health'],
  program_count: 2,
  sex_requirement: null,
  min_age: 18,
  max_age: null,
  min_bmi: null,
  max_bmi: null,
  can_start: true,
  blocked_until: null,
  days_remaining: null,
  launch: {
    custom_program_id: 'wrapper-1',
    release_token: 'release-token',
    release_version: 4,
    path: '/start/combined-program',
  },
  ...overrides,
});

describe('startNewTreatment', () => {
  it('builds a release-bound launch URL without mutable clinical values', async () => {
    const result = await startNewTreatment(treatment());
    const url = new URL(result.questionnaire_url!);
    expect(result.success).toBe(true);
    expect(url.pathname).toBe('/start/combined-program');
    expect(url.searchParams.get('custom_program_id')).toBe('wrapper-1');
    expect(url.searchParams.get('release_token')).toBe('release-token');
    expect(url.searchParams.get('release_version')).toBe('4');
    expect(url.searchParams.has('patient_id')).toBe(false);
  });

  it('does not launch without a published release', async () => {
    const result = await startNewTreatment(treatment({ can_start: false, launch: null }));
    expect(result).toEqual({ success: false, message: 'This treatment has no published release.' });
  });
});
