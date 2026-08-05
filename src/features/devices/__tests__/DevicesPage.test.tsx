import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/__tests__/utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DevicesPage from '../DevicesPage';
import * as api from '../api';

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api');
  return {
    ...actual,
    getConnections: vi.fn().mockResolvedValue([]),
    getDeviceData: vi.fn().mockResolvedValue({
      steps: '8500',
      sleep: '7h 45m',
      restingHr: '62',
      activeDays: '25',
      readiness: 88,
      recovery: 85,
      sleepScore: 90,
      stepsSeries: [{ date: '2026-08-01', val: 8500 }],
      sleepSeries: [{ date: '2026-08-01', val: 7.75 }],
      readinessSeries: [{ date: '2026-08-01', val: 88 }],
      workoutsSeries: [{ date: '2026-08-01', val: 45 }],
      recentWorkouts: [],
    }),
    getVitalsHistory: vi.fn().mockResolvedValue([]),
    getHealthGoal: vi.fn().mockResolvedValue({ goal: null }),
    saveHealthGoal: vi.fn().mockResolvedValue({ goal: null }),
  };
});

vi.mock('@/features/profile/services/profile.service', () => ({
  profileService: {
    getPatientProfile: vi.fn().mockResolvedValue({
      id: 'patient-1',
      vitals_source_priority: ['questionnaire', 'patient_portal', 'wearable'],
    }),
  },
}));

vi.mock('sonner', () => ({
  Toaster: () => null,
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('DevicesPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders device page and loads cached data first without blocking network requests', async () => {
    render(<DevicesPage />);

    await waitFor(() => {
      expect(api.getDeviceData).toHaveBeenCalledWith(365, true);
    });

    expect(api.getDeviceData).toHaveBeenCalledWith(30, false);
    expect(screen.getByText('Glucose')).toBeInTheDocument();
  });
});
