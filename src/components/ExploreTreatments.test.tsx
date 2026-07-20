import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';

import ExploreTreatments from './ExploreTreatments';

vi.mock('@/features/treatments', () => ({
  AvailableTreatmentsList: () => <div data-testid="available-treatments">Treatment catalog</div>,
}));

describe('ExploreTreatments', () => {
  it('renders the suggested-treatment page hierarchy and safe journey steps', () => {
    render(<ExploreTreatments />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Explore Treatments' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'How it works' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Treatment request steps' })).toHaveTextContent(
      'SelectIntakeReview'
    );
    expect(screen.getByText('Availability based on your profile')).toBeInTheDocument();
    expect(screen.getByTestId('available-treatments')).toBeInTheDocument();

    expect(screen.queryByText(/deliver/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/HIPAA secured/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/supervising physician/i)).not.toBeInTheDocument();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<ExploreTreatments />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
