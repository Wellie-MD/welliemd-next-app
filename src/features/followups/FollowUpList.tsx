/**
 * FollowUpList - Component displaying patient's follow-up questionnaires.
 * 
 * Shows:
 * - List of pending, in-progress, and completed follow-ups
 * - Status badges with appropriate colors
 * - Action buttons to start or continue follow-ups
 * - Expiry warnings for pending follow-ups
 */
import React, { useEffect, useState } from 'react';
import { getPatientFollowUps, startFollowUp, FollowUp } from './api';

interface FollowUpListProps {
  questionnaireAppUrl?: string;
  onStartFollowUp?: (followUp: FollowUp) => void;
}

const STATUS_CONFIG = {
  CREATED: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏳',
  },
  VIEWED: {
    label: 'Viewed',
    color: 'bg-blue-100 text-blue-800',
    icon: '👁️',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-800',
    icon: '✏️',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    icon: '✅',
  },
  EXPIRED: {
    label: 'Expired',
    color: 'bg-gray-100 text-gray-500',
    icon: '⏰',
  },
};

export function FollowUpList({ questionnaireAppUrl, onStartFollowUp }: FollowUpListProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFollowUps();
  }, []);

  const loadFollowUps = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPatientFollowUps();
      setFollowUps(data);
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
      setError('Failed to load follow-ups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartFollowUp = async (followUp: FollowUp) => {
    if (onStartFollowUp) {
      onStartFollowUp(followUp);
    } else {
      // Call backend to get the proper questionnaire URL with correct domain
      try {
        const result = await startFollowUp(followUp.id);
        if (result.success && result.follow_up_url) {
          window.open(result.follow_up_url, '_blank');
        } else {
          console.error('Failed to start follow-up:', result.error);
          alert(result.error || 'Failed to start follow-up. Please try again.');
        }
      } catch (error) {
        console.error('Error starting follow-up:', error);
        alert('Failed to start follow-up. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    if (!expiresAt) return false;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry > 0 && hoursUntilExpiry < 24;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Loading follow-ups...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadFollowUps}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (followUps.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <p className="text-gray-500">No follow-up questionnaires yet.</p>
        <p className="text-sm text-gray-400 mt-1">
          When your provider sends you a follow-up, it will appear here.
        </p>
      </div>
    );
  }

  // Group by status
  const pendingFollowUps = followUps.filter(f => ['CREATED', 'VIEWED', 'IN_PROGRESS'].includes(f.status));
  const completedFollowUps = followUps.filter(f => f.status === 'COMPLETED');
  const expiredFollowUps = followUps.filter(f => f.status === 'EXPIRED');

  return (
    <div className="space-y-6">
      {/* Pending Follow-ups */}
      {pendingFollowUps.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Action Required ({pendingFollowUps.length})
          </h3>
          <div className="space-y-4">
            {pendingFollowUps.map((followUp) => (
              <FollowUpCard
                key={followUp.id}
                followUp={followUp}
                onStart={() => handleStartFollowUp(followUp)}
                isExpiringSoon={isExpiringSoon(followUp.expires_at)}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Follow-ups */}
      {completedFollowUps.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Completed ({completedFollowUps.length})
          </h3>
          <div className="space-y-4">
            {completedFollowUps.map((followUp) => (
              <FollowUpCard
                key={followUp.id}
                followUp={followUp}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expired Follow-ups */}
      {expiredFollowUps.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Expired ({expiredFollowUps.length})
          </h3>
          <div className="space-y-3 opacity-60">
            {expiredFollowUps.map((followUp) => (
              <FollowUpCard
                key={followUp.id}
                followUp={followUp}
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

interface FollowUpCardProps {
  followUp: FollowUp;
  onStart?: () => void;
  isExpiringSoon?: boolean;
  formatDate: (date: string) => string;
  compact?: boolean;
}

function FollowUpCard({ followUp, onStart, isExpiringSoon, formatDate, compact }: FollowUpCardProps) {
  const statusConfig = STATUS_CONFIG[followUp.status] || STATUS_CONFIG.CREATED;
  const canStart = ['CREATED', 'VIEWED', 'IN_PROGRESS'].includes(followUp.status);

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm">{statusConfig.icon}</span>
          <span className="text-sm text-gray-600">{followUp.questionnaire_name}</span>
        </div>
        <span className="text-xs text-gray-400">
          Expired {formatDate(followUp.expires_at)}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">
              {followUp.questionnaire_name}
            </h4>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
              {statusConfig.icon} {statusConfig.label}
            </span>
          </div>
          
          {followUp.treatment_type && (
            <p className="text-sm text-gray-500 mb-2">
              {followUp.treatment_type}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Sent {formatDate(followUp.created_at)}</span>
            {followUp.completed_at ? (
              <span>Completed {formatDate(followUp.completed_at)}</span>
            ) : followUp.expires_at && (
              <span className={isExpiringSoon ? 'text-orange-500 font-medium' : ''}>
                {isExpiringSoon ? '⚠️ ' : ''}Expires {formatDate(followUp.expires_at)}
              </span>
            )}
          </div>
        </div>
        
        {canStart && onStart && (
          <button
            onClick={onStart}
            className="ml-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            {followUp.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
          </button>
        )}
      </div>
    </div>
  );
}

export default FollowUpList;
