/**
 * AvailableTreatmentsList - Component displaying treatments the patient can start.
 *
 * Each item is an eligibility-filtered Custom Program (the catalog "wrapper" unit - see
 * apps.treatments.services.eligibility_service on the backend). Only the treatments the
 * patient's profile (sex/age/BMI) qualifies for are ever returned, so there is no
 * blocked/ineligible state to render here - the list is already the eligible set.
 *
 * Category tabs and the age/BMI/sex chips mirror the Patient_Portal.html prototype's
 * `pg-explore` design exactly (same tab/chip visual language), driven by the real,
 * per-patient composed eligibility rule the backend now returns per treatment instead of
 * a static client-side config table.
 *
 * "Get Started" is a stub for now: no Program/CustomProgram intake-start endpoint exists
 * yet (see apps.questionnaires.views.start_treatment_views.StartNewTreatmentView, which
 * only accepts a QuestionnaireTemplate id). Shown disabled until that lands.
 */
import { useEffect, useMemo, useState } from 'react';
import { getAvailableTreatments, AvailableTreatment } from './api';

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

interface AvailableTreatmentsListProps {
  browseLabel?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export function AvailableTreatmentsList({
  browseLabel = 'Browse by category',
  emptyStateTitle = 'No treatments available',
  emptyStateDescription = 'This can happen if your profile is missing information a treatment depends on (like age, biological sex, or a recent weight/BMI reading). Complete your profile or contact your provider for more information.',
}: AvailableTreatmentsListProps = {}) {
  const [treatments, setTreatments] = useState<AvailableTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadTreatments();
  }, []);

  const loadTreatments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAvailableTreatments();
      setTreatments(data);
    } catch (err) {
      console.error('Failed to load treatments:', err);
      setError('Failed to load available treatments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    // Task 2.5: predictable category ordering, not incidental first-appearance order -
    // alphabetical (matching TreatmentType's own Meta.ordering), with the Uncategorized
    // fallback bucket always last rather than wherever it happens to sort.
    const distinct = Array.from(new Set(treatments.map((t) => t.category)));
    const named = distinct.filter((c) => c !== 'Uncategorized').sort((a, b) => a.localeCompare(b));
    return distinct.includes('Uncategorized') ? [...named, 'Uncategorized'] : named;
  }, [treatments]);

  useEffect(() => {
    if (selectedCategory !== 'all' && !categories.includes(selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory]);

  if (loading) {
    return (
      <div className="km-sc km-fade" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="km-skel" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <div style={{ flex: 1 }}>
            <div className="km-skel" style={{ width: '40%', height: 14, marginBottom: 4 }} />
            <div className="km-skel" style={{ width: '60%', height: 11 }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="km-vbox km-vbox-red km-fade">
        <div style={{ flex: 1 }}>
          <div style={{ color: 'var(--km-t)', fontWeight: 600, marginBottom: 2 }}>{error}</div>
          <button
            onClick={loadTreatments}
            className="km-btn km-btn-ghost"
            style={{ padding: '2px 0', fontSize: 11 }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (treatments.length === 0) {
    return (
      <div className="km-sc km-fade">
        <div className="km-empty" style={{ padding: '36px 18px' }}>
          <div className="km-eic">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div className="km-et">{emptyStateTitle}</div>
          <div className="km-es">{emptyStateDescription}</div>
        </div>
      </div>
    );
  }

  const visibleTreatments =
    selectedCategory === 'all' ? treatments : treatments.filter((t) => t.category === selectedCategory);

  return (
    <div>
      <div
        className="fd"
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--km-tm)',
          marginBottom: 10,
          textTransform: 'uppercase',
          letterSpacing: '.5px',
        }}
      >
        {browseLabel}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <CategoryTab
          label="All"
          active={selectedCategory === 'all'}
          onClick={() => setSelectedCategory('all')}
        />
        {categories.map((category) => (
          <CategoryTab
            key={category}
            label={category}
            active={selectedCategory === category}
            onClick={() => setSelectedCategory(category)}
          />
        ))}
      </div>
      <div className="fd" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibleTreatments.map((treatment) => (
          <TreatmentCard key={treatment.id} treatment={treatment} />
        ))}
      </div>
    </div>
  );
}

function CategoryTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: '0 0 auto',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 12.5,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        padding: '7px 14px',
        borderRadius: 999,
        border: `1px solid ${active ? 'var(--km-ac)' : 'var(--km-b)'}`,
        background: active ? 'var(--km-ac)' : 'var(--km-s2)',
        color: active ? '#fff' : 'var(--km-tm)',
        transition: 'all .12s',
      }}
    >
      {label}
    </button>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        color: 'var(--km-tm)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: 'var(--km-s2)',
        border: '1px solid var(--km-b)',
        borderRadius: 999,
        padding: '3px 9px',
        whiteSpace: 'nowrap',
      }}
    >
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
      {label}
    </span>
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

function TreatmentCard({ treatment }: { treatment: AvailableTreatment }) {
  const bmiLabel = bmiRangeLabel(treatment.min_bmi, treatment.max_bmi);
  const sexLabel = sexRequirementLabel(treatment.sex_requirement);

  return (
    <div className="km-etx-card km-fade">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--km-s2)', border: '1px solid var(--km-b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--km-tm)' }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 3v11.5a3.5 3.5 0 0 0 7 0V3" />
            <line x1="6" y1="3" x2="18" y2="3" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.25, color: 'var(--km-t)' }}>{treatment.name}</div>
            <span className="km-badge km-badge-blue" style={{ fontSize: 10, flexShrink: 0 }}>Available</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--km-tm)', marginTop: 3, lineHeight: 1.45 }}>
            {treatment.description || 'Start your journey with a short intake questionnaire.'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
            {sexLabel && <Chip icon={SEX_ICON} label={sexLabel} />}
            <Chip icon={AGE_ICON} label={ageRangeLabel(treatment.min_age, treatment.max_age)} />
            {bmiLabel && <Chip icon={BMI_ICON} label={bmiLabel} />}
            {treatment.program_count > 1 && (
              <span style={{ fontSize: 10.5, color: 'var(--km-tm)', display: 'inline-flex', alignItems: 'center', padding: '3px 2px' }}>
                {treatment.program_count} treatments included
              </span>
            )}
          </div>
        </div>
      </div>
      <button
        className="km-etx-btn"
        disabled
        title="Starting this treatment isn't available yet. Please check back soon."
        style={{ opacity: 0.5, cursor: 'not-allowed' }}
      >
        Coming Soon
      </button>
    </div>
  );
}

export default AvailableTreatmentsList;
