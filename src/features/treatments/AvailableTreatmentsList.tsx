/** Displays server-filtered treatment releases available to the signed-in patient. */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  ArrowRight,
  HeartPulse,
  LoaderCircle,
  PackageOpen,
  RefreshCw,
  Search,
  Sparkles,
  Stethoscope,
  Weight,
  X,
  type LucideIcon,
} from 'lucide-react';

import { getAvailableTreatments, startNewTreatment, type AvailableTreatment } from './api';

interface AvailableTreatmentsListProps {
  browseLabel?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

function treatmentCategories(treatment: AvailableTreatment): string[] {
  const categories = treatment.categories.filter(category => category.trim().length > 0);
  if (categories.length > 0) return categories;
  if (treatment.category.trim().length > 0) return [treatment.category];
  return ['Uncategorized'];
}

function normalizedSearchValue(treatment: AvailableTreatment): string {
  return [treatment.name, treatment.description, ...treatmentCategories(treatment)]
    .join(' ')
    .toLocaleLowerCase();
}

function ageRangeLabel(minAge: number | null, maxAge: number | null): string {
  if (minAge != null && maxAge != null) return `Ages ${minAge}–${maxAge}`;
  if (minAge != null) return `Ages ${minAge}+`;
  if (maxAge != null) return `Up to age ${maxAge}`;
  return 'All ages';
}

function bmiRangeLabel(minBmi: number | null, maxBmi: number | null): string | null {
  if (minBmi != null && maxBmi != null) return `BMI ${minBmi}–${maxBmi}`;
  if (minBmi != null) return `BMI ${minBmi}+`;
  if (maxBmi != null) return `BMI up to ${maxBmi}`;
  return null;
}

function sexRequirementLabel(sex: 'male' | 'female' | null): string | null {
  if (sex === 'female') return 'Female only';
  if (sex === 'male') return 'Male only';
  return null;
}

export function AvailableTreatmentsList({
  browseLabel = 'Browse by category',
  searchLabel = 'Search treatments',
  searchPlaceholder = 'Search treatments…',
  emptyStateTitle = 'No treatments available',
  emptyStateDescription = 'This can happen if your profile is missing information a treatment depends on (like age, biological sex, or a recent weight/BMI reading). Complete your profile or contact your provider for more information.',
}: AvailableTreatmentsListProps = {}) {
  const [treatments, setTreatments] = useState<AvailableTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadTreatments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAvailableTreatments();
      setTreatments(data);
    } catch (loadError) {
      console.error('Failed to load treatments:', loadError);
      setError('We could not load available treatments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTreatments();
  }, [loadTreatments]);

  const categories = useMemo(() => {
    const distinct = Array.from(new Set(treatments.flatMap(treatmentCategories)));
    const named = distinct
      .filter(category => category !== 'Uncategorized')
      .sort((left, right) => left.localeCompare(right));
    return distinct.includes('Uncategorized') ? [...named, 'Uncategorized'] : named;
  }, [treatments]);

  useEffect(() => {
    if (selectedCategory !== 'all' && !categories.includes(selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory]);

  const visibleTreatments = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    return treatments.filter(treatment => {
      const matchesCategory =
        selectedCategory === 'all' || treatmentCategories(treatment).includes(selectedCategory);
      const matchesSearch = query.length === 0 || normalizedSearchValue(treatment).includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory, treatments]);

  const clearFilters = () => {
    setSelectedCategory('all');
    setSearchTerm('');
  };

  if (loading) return <TreatmentsLoadingState />;

  if (error) {
    return (
      <section
        className="explore-state explore-state--error"
        role="alert"
        aria-label="Treatments unavailable"
      >
        <div className="explore-state__icon" aria-hidden="true">
          <RefreshCw size={20} />
        </div>
        <div className="explore-state__body">
          <h2>Unable to load treatments</h2>
          <p>{error}</p>
        </div>
        <button
          type="button"
          className="explore-secondary-button"
          onClick={() => void loadTreatments()}
        >
          <RefreshCw aria-hidden="true" size={15} />
          Try again
        </button>
      </section>
    );
  }

  if (treatments.length === 0) {
    return (
      <section className="explore-state" aria-labelledby="explore-empty-title">
        <div className="explore-state__icon" aria-hidden="true">
          <PackageOpen size={21} />
        </div>
        <div className="explore-state__body">
          <h2 id="explore-empty-title">{emptyStateTitle}</h2>
          <p>{emptyStateDescription}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="explore-browser" aria-labelledby="explore-browser-title">
      <div className="explore-toolbar">
        <div className="explore-toolbar__categories">
          <h2 id="explore-browser-title">{browseLabel}</h2>
          <div className="explore-category-list" role="group" aria-label={browseLabel}>
            <CategoryButton
              label="All"
              active={selectedCategory === 'all'}
              onClick={() => setSelectedCategory('all')}
            />
            {categories.map(category => (
              <CategoryButton
                key={category}
                label={category}
                active={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
              />
            ))}
          </div>
        </div>

        <div className="explore-search">
          <label htmlFor="treatment-search" className="explore-sr-only">
            {searchLabel}
          </label>
          <Search className="explore-search__icon" aria-hidden="true" size={16} />
          <input
            id="treatment-search"
            type="search"
            value={searchTerm}
            placeholder={searchPlaceholder}
            onChange={event => setSearchTerm(event.target.value)}
          />
          {searchTerm.length > 0 && (
            <button
              type="button"
              className="explore-search__clear"
              aria-label="Clear treatment search"
              onClick={() => setSearchTerm('')}
            >
              <X aria-hidden="true" size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="explore-results-meta" role="status" aria-live="polite">
        {visibleTreatments.length === 1
          ? '1 treatment option'
          : `${visibleTreatments.length} treatment options`}
      </div>

      {visibleTreatments.length > 0 ? (
        <div id="treatment-results" className="explore-treatment-grid">
          {visibleTreatments.map(treatment => (
            <TreatmentCard key={treatment.id} treatment={treatment} />
          ))}
        </div>
      ) : (
        <section
          className="explore-state explore-state--filtered"
          aria-labelledby="explore-filtered-title"
        >
          <div className="explore-state__icon" aria-hidden="true">
            <Search size={20} />
          </div>
          <div className="explore-state__body">
            <h2 id="explore-filtered-title">No matching treatments</h2>
            <p>Try another search or clear your selected category.</p>
          </div>
          <button type="button" className="explore-secondary-button" onClick={clearFilters}>
            Clear filters
          </button>
        </section>
      )}
    </section>
  );
}

function CategoryButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`explore-category-button${active ? ' is-active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function TreatmentsLoadingState() {
  return (
    <div className="explore-loading" role="status" aria-live="polite">
      <span className="explore-sr-only">Loading available treatments…</span>
      <div className="explore-loading__toolbar" aria-hidden="true">
        <div className="explore-skeleton explore-skeleton--wide" />
        <div className="explore-skeleton explore-skeleton--search" />
      </div>
      <div className="explore-treatment-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="explore-treatment-card explore-treatment-card--skeleton" key={index}>
            <div className="explore-skeleton explore-skeleton--icon" />
            <div className="explore-skeleton explore-skeleton--title" />
            <div className="explore-skeleton explore-skeleton--copy" />
            <div className="explore-skeleton explore-skeleton--copy-short" />
            <div className="explore-skeleton explore-skeleton--button" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EligibilityChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <li>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        width="13"
        height="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        {icon}
      </svg>
      {label}
    </li>
  );
}

const AGE_ICON = (
  <>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </>
);
const BMI_ICON = <path d="M3 12h4l3 8 4-16 3 8h4" />;
const SEX_ICON = (
  <>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>
);

interface TreatmentAppearance {
  icon: LucideIcon;
  tone: 'blue' | 'green' | 'purple';
}

function treatmentAppearance(treatment: AvailableTreatment): TreatmentAppearance {
  const categoryText = treatmentCategories(treatment).join(' ').toLocaleLowerCase();
  if (/(weight|metabolic)/.test(categoryText)) return { icon: Weight, tone: 'green' };
  if (/(men|hormone|testosterone|sexual)/.test(categoryText))
    return { icon: HeartPulse, tone: 'blue' };
  if (/(wellness|longevity|energy|recovery)/.test(categoryText))
    return { icon: Sparkles, tone: 'purple' };
  return { icon: Stethoscope, tone: 'blue' };
}

function TreatmentCard({ treatment }: { treatment: AvailableTreatment }) {
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const bmiLabel = bmiRangeLabel(treatment.min_bmi, treatment.max_bmi);
  const sexLabel = sexRequirementLabel(treatment.sex_requirement);
  const categories = treatmentCategories(treatment);
  const canLaunch = treatment.can_start && treatment.launch !== null;
  const appearance = treatmentAppearance(treatment);
  const TreatmentIcon = appearance.icon;
  const titleId = `treatment-title-${treatment.id}`;
  const descriptionId = `treatment-description-${treatment.id}`;

  const start = async () => {
    if (!canLaunch || starting) return;
    setStarting(true);
    setStartError(null);

    try {
      const result = await startNewTreatment(treatment);
      if (result.success && result.questionnaire_url) {
        window.location.assign(result.questionnaire_url);
        return;
      }
      setStartError(
        result.message ?? result.error ?? 'Unable to start this treatment intake.'
      );
    } catch (startRequestError) {
      console.error('Failed to start treatment:', startRequestError);
      setStartError('Unable to start this treatment intake. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <article
      className="explore-treatment-card"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="explore-treatment-card__topline">
        <div className={`explore-treatment-card__icon is-${appearance.tone}`} aria-hidden="true">
          <TreatmentIcon size={20} />
        </div>
        <span className={`explore-status-badge${canLaunch ? ' is-available' : ' is-unavailable'}`}>
          {canLaunch ? 'Available' : 'Not available'}
        </span>
      </div>

      <div className="explore-treatment-card__content">
        <h3 id={titleId}>{treatment.name}</h3>
        <p id={descriptionId}>
          {treatment.description ||
            'Start with a short intake so a licensed provider can review your request.'}
        </p>
        <ul className="explore-treatment-card__eligibility" aria-label="Program eligibility">
          {sexLabel && <EligibilityChip icon={SEX_ICON} label={sexLabel} />}
          <EligibilityChip
            icon={AGE_ICON}
            label={ageRangeLabel(treatment.min_age, treatment.max_age)}
          />
          {bmiLabel && <EligibilityChip icon={BMI_ICON} label={bmiLabel} />}
        </ul>
      </div>

      <div className="explore-treatment-card__footer">
        <div className="explore-treatment-card__categories" aria-label="Treatment categories">
          {categories.map(category => (
            <span key={category}>{category}</span>
          ))}
        </div>

        {treatment.program_count > 1 && (
          <p className="explore-treatment-card__program-count">
            Includes {treatment.program_count} treatment options
          </p>
        )}

        <button
          type="button"
          className="explore-primary-button"
          disabled={!canLaunch || starting}
          onClick={() => void start()}
        >
          {starting ? (
            <>
              <LoaderCircle className="explore-spin" aria-hidden="true" size={16} />
              Starting intake…
            </>
          ) : canLaunch ? (
            <>
              Get started
              <ArrowRight aria-hidden="true" size={16} />
            </>
          ) : (
            'Currently unavailable'
          )}
        </button>

        {startError && (
          <p className="explore-treatment-card__error" role="alert">
            {startError}
          </p>
        )}
      </div>
    </article>
  );
}

export default AvailableTreatmentsList;
