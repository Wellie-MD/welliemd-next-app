import { fireEvent, render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAvailableTreatments, startNewTreatment, type AvailableTreatment } from './api';
import { AvailableTreatmentsList } from './AvailableTreatmentsList';

vi.mock('./api', () => ({
  getAvailableTreatments: vi.fn(),
  startNewTreatment: vi.fn(),
}));

const mockGetAvailableTreatments = vi.mocked(getAvailableTreatments);
const mockStartNewTreatment = vi.mocked(startNewTreatment);

function treatment(overrides: Partial<AvailableTreatment> = {}): AvailableTreatment {
  return {
    id: 'treatment-1',
    name: 'Metabolic Reset',
    description: 'A provider-reviewed weight management program.',
    slug: 'metabolic-reset',
    category: 'Weight Management',
    categories: ['Weight Management'],
    program_count: 1,
    sex_requirement: null,
    min_age: 18,
    max_age: null,
    min_bmi: 25,
    max_bmi: 40,
    can_start: true,
    blocked_until: null,
    days_remaining: null,
    launch: {
      custom_program_id: 'treatment-1',
      release_token: 'release-token-1',
      release_version: 2,
      path: '/start/metabolic-reset',
      questionnaire_url: 'https://intake.example.com/start/metabolic-reset',
    },
    ...overrides,
  };
}

const metabolicTreatment = treatment();

const catalog = [
  metabolicTreatment,
  treatment({
    id: 'treatment-2',
    name: 'Hormone Support',
    description: 'Complete an intake for hormone health options.',
    slug: 'hormone-support',
    category: 'Hormone Health',
    categories: ['Hormone Health', "Men's Health"],
    launch: {
      custom_program_id: 'treatment-2',
      release_token: 'release-token-2',
      release_version: 1,
      path: '/start/hormone-support',
      questionnaire_url: 'https://intake.example.com/start/hormone-support',
    },
  }),
  treatment({
    id: 'treatment-3',
    name: 'Energy & Recovery',
    description: 'Explore personalized wellness options.',
    slug: 'energy-recovery',
    category: 'Wellness',
    categories: ['Wellness', 'Longevity'],
    program_count: 2,
    launch: {
      custom_program_id: 'treatment-3',
      release_token: 'release-token-3',
      release_version: 3,
      path: '/start/energy-recovery',
      questionnaire_url: 'https://intake.example.com/start/energy-recovery',
    },
  }),
];

describe('AvailableTreatmentsList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the server-filtered catalog with existing eligibility details and no fabricated clinical state', async () => {
    mockGetAvailableTreatments.mockResolvedValue(catalog);

    render(<AvailableTreatmentsList />);

    expect(screen.getByText('Loading available treatments…')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Metabolic Reset' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hormone Support' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Energy & Recovery' })).toBeInTheDocument();
    expect(screen.getByText('3 treatment options')).toBeInTheDocument();
    expect(screen.getAllByText('Available')).toHaveLength(3);
    expect(screen.getAllByText('Ages 18+')).toHaveLength(3);
    expect(screen.getAllByText('BMI 25–40')).toHaveLength(3);

    expect(screen.queryByText(/supervising physician/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/active protocol/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/dosage/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/medical advisory board/i)).not.toBeInTheDocument();
  });

  it('combines server-derived category filters with case-insensitive search', async () => {
    mockGetAvailableTreatments.mockResolvedValue(catalog);

    render(<AvailableTreatmentsList />);
    await screen.findByRole('heading', { name: 'Metabolic Reset' });

    const hormoneFilter = screen.getByRole('button', { name: 'Hormone Health' });
    fireEvent.click(hormoneFilter);
    expect(hormoneFilter).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Hormone Support' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Metabolic Reset' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search treatments' }), {
      target: { value: 'metabolic' },
    });
    expect(
      screen.getByRole('heading', { name: 'No matching treatments' })
    ).toBeInTheDocument();
    expect(screen.getByText('0 treatment options')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Metabolic Reset' })).toBeInTheDocument();

    const search = screen.getByRole('searchbox', { name: 'Search treatments' });
    fireEvent.change(search, { target: { value: 'LONGEVITY' } });
    expect(screen.getByRole('heading', { name: 'Energy & Recovery' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Hormone Support' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear treatment search' }));
    expect(search).toHaveValue('');
  });

  it('shows the profile-aware empty state returned by an empty catalog', async () => {
    mockGetAvailableTreatments.mockResolvedValue([]);

    render(<AvailableTreatmentsList />);

    expect(
      await screen.findByRole('heading', { name: 'No treatments available' })
    ).toBeInTheDocument();
    expect(screen.getByText(/recent weight\/BMI reading/i)).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('recovers from a catalog error when the patient retries', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockGetAvailableTreatments
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce([metabolicTreatment]);

    render(<AvailableTreatmentsList />);

    expect(
      await screen.findByRole('heading', { name: 'Unable to load treatments' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Metabolic Reset' })).toBeInTheDocument();
    expect(mockGetAvailableTreatments).toHaveBeenCalledTimes(2);
    consoleError.mockRestore();
  });

  it('keeps unavailable programs truthful and non-interactive', async () => {
    mockGetAvailableTreatments.mockResolvedValue([treatment({ can_start: false, launch: null })]);

    render(<AvailableTreatmentsList />);
    const card = (await screen.findByRole('heading', { name: 'Metabolic Reset' })).closest(
      'article'
    );
    expect(card).not.toBeNull();
    if (!card) throw new Error('Expected a treatment card');

    const unavailableCard = within(card);
    expect(unavailableCard.getByText('Not available')).toBeInTheDocument();
    const button = unavailableCard.getByRole('button', { name: 'Currently unavailable' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mockStartNewTreatment).not.toHaveBeenCalled();
  });

  it('shows a card-local launch error and re-enables the action', async () => {
    mockGetAvailableTreatments.mockResolvedValue([metabolicTreatment]);
    mockStartNewTreatment.mockResolvedValue({
      success: false,
      message: 'Intake is temporarily unavailable.',
    });

    render(<AvailableTreatmentsList />);
    const button = await screen.findByRole('button', { name: 'Get started' });
    fireEvent.click(button);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Intake is temporarily unavailable.'
    );
    expect(button).toBeEnabled();
    expect(mockStartNewTreatment).toHaveBeenCalledTimes(1);
    expect(mockStartNewTreatment).toHaveBeenCalledWith(metabolicTreatment);
  });

  it('has no automated accessibility violations in the loaded catalog', async () => {
    mockGetAvailableTreatments.mockResolvedValue(catalog);

    const { container } = render(<AvailableTreatmentsList />);
    await screen.findByRole('heading', { name: 'Metabolic Reset' });

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
