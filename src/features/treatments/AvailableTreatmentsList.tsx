/**
 * AvailableTreatmentsList - Component displaying treatments the patient can start.
 * 
 * Shows:
 * - List of available onboarding questionnaires for the patient's client
 * - Status indicating if patient can start (or blocked by refill interval)
 * - Action buttons to start new treatments
 */
import { useEffect, useState } from 'react';
import { getAvailableTreatments, startNewTreatment, AvailableTreatment } from './api';

const formatCategoryName = (type: string | null | undefined): string => {
  if (!type) return 'Other Treatments';
  const normalized = type.toLowerCase().trim();
  if (normalized === 'all') return 'All';
  const mapping: Record<string, string> = {
    weight_loss: 'Weight Loss',
    glp: 'GLP-1 Weight Loss',
    ed: 'Erectile Dysfunction',
    glutathione: 'Glutathione',
    general: 'General',
    glp_microdosing: 'GLP Microdosing',
    sermorelin: 'Sermorelin',
    nad_plus: 'NAD+',
    individualized_glp: 'Individualized GLP',
    other: 'Other Treatments',
  };
  
  if (mapping[normalized]) {
    return mapping[normalized];
  }
  
  return type
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface AvailableTreatmentsListProps {
  onStartTreatment?: (treatment: AvailableTreatment) => void;
}

export function AvailableTreatmentsList({ onStartTreatment }: AvailableTreatmentsListProps) {
  const [treatments, setTreatments] = useState<AvailableTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>('');

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

  const handleStartTreatment = async (treatment: AvailableTreatment) => {
    if (onStartTreatment) {
      onStartTreatment(treatment);
      return;
    }

    try {
      setStartingId(treatment.id);
      const result = await startNewTreatment(treatment.id);

      if (result.success && result.questionnaire_url) {
        // Same-window navigation: new tabs opened before async work complete are
        // blocked as pop-ups on mobile Safari/Chrome; assigning after the API
        // returns is not user-gesture synchronous.
        window.location.assign(result.questionnaire_url);
      } else {
        console.error('Failed to start treatment:', result.error);
        alert(result.message || result.error || 'Failed to start treatment. Please try again.');
      }
    } catch (error) {
      console.error('Error starting treatment:', error);
      alert('Failed to start treatment. Please try again.');
    } finally {
      setStartingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Extract and sort unique categories from treatments list
  const categories = (() => {
    const rawCats = treatments.map(t => t.treatment_type?.toLowerCase().trim() || 'other');
    const uniqueCats = Array.from(new Set(rawCats));
    
    // Sort categories: custom priority order first, then alphabetical, 'other' always last
    const sortedCats = uniqueCats.sort((a, b) => {
      const priority = ['weight_loss', 'glp', 'ed', 'glutathione', 'sermorelin', 'nad_plus', 'general'];
      const aIdx = priority.indexOf(a);
      const bIdx = priority.indexOf(b);
      
      if (a === 'other') return 1;
      if (b === 'other') return -1;
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });

    // Add 'all' to the front if there's more than one category
    return sortedCats.length > 1 ? ['all', ...sortedCats] : sortedCats;
  })();

  // Keep active tab in sync with loaded categories list
  useEffect(() => {
    if (categories.length > 0) {
      if (!activeTab || !categories.includes(activeTab)) {
        setActiveTab(categories.includes('all') ? 'all' : categories[0]);
      }
    } else {
      setActiveTab('');
    }
  }, [treatments]);

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
          <div className="km-et">No treatments available</div>
          <div className="km-es">Contact your provider for more information.</div>
        </div>
      </div>
    );
  }

  // Filter available and blocked treatments for the active category
  const filteredAvailable = treatments.filter(t => {
    const cat = t.treatment_type?.toLowerCase().trim() || 'other';
    return t.can_start && (categories.length <= 1 || activeTab === 'all' || cat === activeTab);
  });

  const filteredBlocked = treatments.filter(t => {
    const cat = t.treatment_type?.toLowerCase().trim() || 'other';
    return !t.can_start && (categories.length <= 1 || activeTab === 'all' || cat === activeTab);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Category Tabs Switcher */}
      {categories.length > 1 && (
        <div className="km-tabs" style={{ marginBottom: 4 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`km-tab ${activeTab === cat ? 'active' : ''}`}
              onClick={() => setActiveTab(cat)}
            >
              {formatCategoryName(cat)}
            </button>
          ))}
        </div>
      )}

      {/* Available Treatments */}
      {filteredAvailable.length > 0 && (
        <div>
          <div className="fd" style={{ fontSize: 11, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>
            Available Treatments
          </div>
          <div className="fd" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredAvailable.map((treatment) => (
              <TreatmentCard
                key={treatment.id}
                treatment={treatment}
                onStart={() => handleStartTreatment(treatment)}
                isStarting={startingId === treatment.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Blocked Treatments */}
      {filteredBlocked.length > 0 && (
        <div style={{ opacity: 0.7 }}>
          <div className="fd" style={{ fontSize: 11, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>
            Recently Completed Treatments
          </div>
          <div className="fd" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredBlocked.map((treatment) => (
              <TreatmentCard
                key={treatment.id}
                treatment={treatment}
                formatDate={formatDate}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {filteredAvailable.length === 0 && filteredBlocked.length === 0 && (
        <div className="km-empty" style={{ padding: '36px 18px' }}>
          <div className="km-et">
            {activeTab === 'all' ? 'No treatments available' : 'No treatments available in this category'}
          </div>
        </div>
      )}
    </div>
  );
}

interface TreatmentCardProps {
  treatment: AvailableTreatment;
  onStart?: () => void;
  isStarting?: boolean;
  formatDate?: (date: string | null) => string;
  compact?: boolean;
}

function TreatmentCard({ treatment, onStart, isStarting, formatDate, compact }: TreatmentCardProps) {
  if (compact) {
    return (
      <div className="km-etx-card km-fade" style={{ padding: '12px 14px', cursor: 'default' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>💊</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--km-t)' }}>{treatment.name}</div>
              {treatment.days_remaining !== null && treatment.days_remaining > 0 && (
                <div style={{ fontSize: 11, color: 'var(--km-re)', marginTop: 2, fontWeight: 500 }}>
                  Wait {treatment.days_remaining} days
                </div>
              )}
            </div>
          </div>
          {treatment.blocked_until && formatDate && (
            <div style={{ fontSize: 11, color: 'var(--km-tm)', fontWeight: 600, fontFamily: 'monospace' }}>
              {formatDate(treatment.blocked_until)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="km-etx-card km-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--km-acp)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--km-b)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--km-ac)" strokeWidth="1.8"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/></svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--km-t)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{treatment.name}</div>
            <span className="km-badge km-badge-blue" style={{ fontSize: 10 }}>Available</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--km-tm)', lineHeight: 1.4 }}>
            {treatment.description || "Start your journey with a short intake questionnaire."}
          </div>
        </div>
      </div>
      {treatment.can_start && onStart && (
        <button
          className="km-etx-btn"
          onClick={(e) => {
            e.stopPropagation();
            onStart();
          }}
          disabled={isStarting}
          style={{ opacity: isStarting ? 0.7 : 1, marginTop: 4 }}
        >
          {isStarting ? "Initializing..." : "Get Started"}
        </button>
      )}
    </div>
  );
}

export default AvailableTreatmentsList;
