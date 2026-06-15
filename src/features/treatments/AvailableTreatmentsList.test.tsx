import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AvailableTreatmentsList } from './AvailableTreatmentsList';
import * as api from './api';

// Mock the API module
vi.mock('./api', () => ({
  getAvailableTreatments: vi.fn(),
  startNewTreatment: vi.fn(),
}));

describe('AvailableTreatmentsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dynamic tabs when multiple treatment categories are present', async () => {
    const mockTreatments = [
      {
        id: '1',
        name: 'Weight Loss Plan A',
        description: 'Description A',
        treatment_type: 'weight_loss',
        can_start: true,
        blocked_until: null,
        days_remaining: null,
      },
      {
        id: '2',
        name: 'ED treatment B',
        description: 'Description B',
        treatment_type: 'ed',
        can_start: true,
        blocked_until: null,
        days_remaining: null,
      },
      {
        id: '3',
        name: 'Uncategorized Plan',
        description: 'Description C',
        treatment_type: '',
        can_start: true,
        blocked_until: null,
        days_remaining: null,
      }
    ];

    vi.mocked(api.getAvailableTreatments).mockResolvedValue(mockTreatments);

    render(<AvailableTreatmentsList />);

    // Wait for treatments to load
    await waitFor(() => {
      expect(screen.getByText('Weight Loss Plan A')).toBeInTheDocument();
    });

    // Check tabs are rendered
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Weight Loss')).toBeInTheDocument();
    expect(screen.getByText('Erectile Dysfunction')).toBeInTheDocument();
    expect(screen.getByText('Other Treatments')).toBeInTheDocument();

    // The 'All' tab should be active by default, so all treatments are visible
    expect(screen.getByText('Weight Loss Plan A')).toBeInTheDocument();
    expect(screen.getByText('ED treatment B')).toBeInTheDocument();
    expect(screen.getByText('Uncategorized Plan')).toBeInTheDocument();

    // Click on 'Erectile Dysfunction' tab
    fireEvent.click(screen.getByText('Erectile Dysfunction'));

    // ED treatments should now be visible and others hidden
    expect(screen.getByText('ED treatment B')).toBeInTheDocument();
    expect(screen.queryByText('Weight Loss Plan A')).not.toBeInTheDocument();
    expect(screen.queryByText('Uncategorized Plan')).not.toBeInTheDocument();

    // Click on 'All' tab
    fireEvent.click(screen.getByText('All'));

    // All treatments should be visible again
    expect(screen.getByText('Weight Loss Plan A')).toBeInTheDocument();
    expect(screen.getByText('ED treatment B')).toBeInTheDocument();
    expect(screen.getByText('Uncategorized Plan')).toBeInTheDocument();
  });

  it('does not render tabs when only one treatment category is present', async () => {
    const mockTreatments = [
      {
        id: '1',
        name: 'Weight Loss Plan A',
        description: 'Description A',
        treatment_type: 'weight_loss',
        can_start: true,
        blocked_until: null,
        days_remaining: null,
      }
    ];

    vi.mocked(api.getAvailableTreatments).mockResolvedValue(mockTreatments);

    render(<AvailableTreatmentsList />);

    await waitFor(() => {
      expect(screen.getByText('Weight Loss Plan A')).toBeInTheDocument();
    });

    // Should NOT render a tab switcher because there's only 1 category
    expect(screen.queryByText('Weight Loss')).not.toBeInTheDocument();
  });

  it('renders general empty state when no treatments are returned', async () => {
    vi.mocked(api.getAvailableTreatments).mockResolvedValue([]);

    render(<AvailableTreatmentsList />);

    await waitFor(() => {
      expect(screen.getByText('No treatments available')).toBeInTheDocument();
    });
  });
});
