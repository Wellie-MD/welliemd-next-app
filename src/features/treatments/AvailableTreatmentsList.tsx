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
import { Button } from '@/components/ui/button';

interface AvailableTreatmentsListProps {
  onStartTreatment?: (treatment: AvailableTreatment) => void;
}

export function AvailableTreatmentsList({ onStartTreatment }: AvailableTreatmentsListProps) {
  const [treatments, setTreatments] = useState<AvailableTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading treatments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-200">{error}</p>
          <button
            onClick={loadTreatments}
            className="mt-2 text-sm text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (treatments.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 dark:text-slate-500 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <p className="text-muted-foreground">No treatments available.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Contact your provider for more information.
        </p>
      </div>
    );
  }

  // Separate available and blocked treatments
  const availableTreatments = treatments.filter(t => t.can_start);
  const blockedTreatments = treatments.filter(t => !t.can_start);

  return (
    <div className="space-y-6">
      {/* Available Treatments */}
      {availableTreatments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">
            Available ({availableTreatments.length})
          </h3>
          <div className="space-y-4">
            {availableTreatments.map((treatment) => (
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
      {blockedTreatments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Recently Completed ({blockedTreatments.length})
          </h3>
          <div className="space-y-3 opacity-70">
            {blockedTreatments.map((treatment) => (
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
      <div className="flex items-center justify-between py-3 px-4 bg-muted/70 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-lg">💊</span>
          <div>
            <span className="text-sm font-medium text-foreground">{treatment.name}</span>
            {treatment.days_remaining !== null && treatment.days_remaining > 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                Available in {treatment.days_remaining} days
              </span>
            )}
          </div>
        </div>
        {treatment.blocked_until && formatDate && (
          <span className="text-xs text-muted-foreground">
            {formatDate(treatment.blocked_until)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xl">💊</span>
            <h4 className="font-medium text-foreground break-words">{treatment.name}</h4>
            {treatment.can_start ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-emerald-900/50 text-green-800 dark:text-emerald-200">
                ✅ Available
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
                ⏳ Wait {treatment.days_remaining} days
              </span>
            )}
          </div>
          
          {treatment.description && (
            <p className="text-sm text-muted-foreground mb-2 ml-7 break-words">
              {treatment.description}
            </p>
          )}
          
          {treatment.treatment_type && (
            <span className="text-xs text-muted-foreground ml-7">
              Type: {treatment.treatment_type}
            </span>
          )}
        </div>
        
        {treatment.can_start && onStart && (
          <Button
            onClick={onStart}
            disabled={isStarting}
            size="sm"
            className="w-full md:w-auto md:ml-4 shrink-0 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {isStarting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Starting...
              </span>
            ) : (
              'Start'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default AvailableTreatmentsList;
