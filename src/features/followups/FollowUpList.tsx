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
    bg: 'var(--km-amp)',
    color: 'var(--km-am)',
    icon: '⏳',
  },
  VIEWED: {
    label: 'Viewed',
    bg: 'var(--km-acp)',
    color: 'var(--km-ac)',
    icon: '👁️',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'var(--km-acp)',
    color: 'var(--km-ac)',
    icon: '✏️',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'var(--km-grp)',
    color: 'var(--km-gr)',
    icon: '✅',
  },
  EXPIRED: {
    label: 'Expired',
    bg: 'var(--km-s3)',
    color: 'var(--km-tm)',
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
          window.location.assign(result.follow_up_url);
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
      <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin" style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--km-b)', borderTopColor: 'var(--km-ac)' }} />
        <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--km-tm)' }}>Loading follow-ups...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 14 }}>
        <div style={{ background: 'var(--km-rep)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--km-rs)', padding: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--km-re)' }}>{error}</p>
          <button
            onClick={loadFollowUps}
            style={{ marginTop: 6, fontSize: 12, color: 'var(--km-re)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (followUps.length === 0) {
    return (
      <div style={{ padding: '28px 18px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--km-s2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 11, color: 'var(--km-td)' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--km-t)', marginBottom: 4 }}>No follow-up questionnaires yet.</p>
        <p style={{ fontSize: 12, color: 'var(--km-tm)', lineHeight: 1.5, maxWidth: 210 }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Pending Follow-ups */}
      {pendingFollowUps.length > 0 && (
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--km-ac)', marginBottom: 8 }}>
            Action Required ({pendingFollowUps.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--km-gr)', marginBottom: 8 }}>
            Completed ({completedFollowUps.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
          <h3 style={{ fontSize: 12, fontWeight: 500, color: 'var(--km-tm)', marginBottom: 6 }}>
            Expired ({expiredFollowUps.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: 0.6 }}>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--km-s2)', border: '1px solid var(--km-b)', borderRadius: 'var(--km-rs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13 }}>{statusConfig.icon}</span>
          <span style={{ fontSize: 13, color: 'var(--km-tm)' }}>{followUp.questionnaire_name}</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--km-tm)' }}>
          Expired {formatDate(followUp.expires_at)}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--km-s2)',
        border: '1px solid var(--km-b)',
        borderRadius: 'var(--km-rs)',
        padding: '13px 14px',
        transition: 'border-color 0.2s',
        cursor: canStart ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--km-bh)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--km-b)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--km-t)' }}>
              {followUp.questionnaire_name}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '3px 8px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                background: statusConfig.bg,
                color: statusConfig.color,
                whiteSpace: 'nowrap',
              }}
            >
              {statusConfig.icon} {statusConfig.label}
            </span>
          </div>

          {followUp.treatment_type && (
            <p style={{ fontSize: 11, color: 'var(--km-tm)', marginBottom: 7 }}>
              {followUp.treatment_type}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: 'var(--km-tm)' }}>
            <span>Sent {formatDate(followUp.created_at)}</span>
            {followUp.completed_at ? (
              <span>Completed {formatDate(followUp.completed_at)}</span>
            ) : followUp.expires_at && (
              <span style={isExpiringSoon ? { color: 'var(--km-am)', fontWeight: 600 } : undefined}>
                {isExpiringSoon ? '⚠️ ' : ''}Expires {formatDate(followUp.expires_at)}
              </span>
            )}
          </div>
        </div>

        {canStart && onStart && (
          <button
            onClick={onStart}
            style={{
              padding: '9px 16px',
              background: followUp.status === 'IN_PROGRESS' ? 'var(--km-s3)' : 'var(--km-ac)',
              color: followUp.status === 'IN_PROGRESS' ? 'var(--km-t)' : '#fff',
              border: followUp.status === 'IN_PROGRESS' ? '1px solid var(--km-b)' : 'none',
              borderRadius: 8,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {followUp.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
          </button>
        )}
      </div>
    </div>
  );
}

export default FollowUpList;
