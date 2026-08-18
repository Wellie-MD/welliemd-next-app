import { beforeEach, describe, expect, it, vi } from 'vitest';

import { startNewTreatment, type AvailableTreatment } from './api';
import { apiClient } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  apiClient: { post: vi.fn() },
}));

const mockPost = vi.mocked(apiClient.post);

const treatment = (overrides: Partial<AvailableTreatment> = {}): AvailableTreatment => ({
  kind: 'custom_program',
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
    questionnaire_url: 'https://intake.example.com/start/combined-program',
  },
  ...overrides,
});

describe('startNewTreatment', () => {
  beforeEach(() => mockPost.mockReset());

  it('requests a pre-authenticated release launch from the tenant backend', async () => {
    mockPost.mockResolvedValue({
      data: {
        success: true,
        questionnaire_url: 'https://intake.example.com/start/combined-program?portal_handoff=opaque',
      },
    });
    const result = await startNewTreatment(treatment());
    expect(result.success).toBe(true);
    expect(mockPost).toHaveBeenCalledWith('/treatments/available/launch/', {
      kind: 'custom_program',
      id: 'wrapper-1',
    });
    expect(result.questionnaire_url).toContain('portal_handoff=opaque');
  });

  it('requests a pre-authenticated launch for a standalone Program', async () => {
    mockPost.mockResolvedValue({
      data: {
        success: true,
        questionnaire_url: 'https://intake.example.com/start/standalone-program?portal_handoff=opaque',
      },
    });
    const result = await startNewTreatment(
      treatment({
        kind: 'program',
        id: 'program-1',
        slug: 'standalone-program',
        launch: {
          program_id: 'program-1',
          release_token: 'program-release-token',
          release_version: 7,
          path: '/start/standalone-program',
          questionnaire_url: 'https://intake.example.com/start/standalone-program',
        },
      })
    );

    expect(result.success).toBe(true);
    expect(mockPost).toHaveBeenCalledWith('/treatments/available/launch/', {
      kind: 'program',
      id: 'program-1',
    });
  });

  it('does not launch without a published release', async () => {
    const result = await startNewTreatment(treatment({ can_start: false, launch: null }));
    expect(result).toEqual({ success: false, message: 'This treatment has no published release.' });
  });

});
