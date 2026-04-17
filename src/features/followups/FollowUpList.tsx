import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { getPatientFollowUps } from './api';
import type { FollowUp } from './api';

interface FollowUpListProps {
  questionnaireAppUrl?: string; // We'll keep this in case needed for routing later
  onStartFollowUp?: (followUp: FollowUp) => void;
}

export function FollowUpList({ onStartFollowUp }: FollowUpListProps) {
  const navigate = useNavigate();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollowUps();
  }, []);

  const loadFollowUps = async () => {
    try {
      setLoading(true);
      const data = await getPatientFollowUps();
      setFollowUps(data || []);
    } catch (err) {
      console.error('Failed to load follow-ups', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="km-qcard">
          <div className="km-skel" style={{ width: 120, height: 16, marginBottom: 8 }} />
          <div className="km-skel" style={{ width: 180, height: 12, marginBottom: 16 }} />
          <div className="km-skel" style={{ width: "100%", height: 36, borderRadius: 8 }} />
        </div>
      </div>
    );
  }

  // Only show action required questionnaires according to kinmeds3 tracking
  const pendingFollowUps = followUps.filter(f => ['CREATED', 'VIEWED', 'IN_PROGRESS'].includes(f.status));

  if (pendingFollowUps.length === 0) {
    return null; // Or some empty state, but kinmeds3 usually hides the section if 0
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const resolveAccessInfo = (followUp: FollowUp) => {
    const expiryDate = followUp.link_expires_at || followUp.expires_at;
    if (!expiryDate) {
      return {
        label: 'Access',
        value: 'Active until completion',
      };
    }
    return {
      label: 'Access expires',
      value: formatDate(expiryDate),
    };
  };

  const handleStart = (f: FollowUp) => {
    if (onStartFollowUp) {
      onStartFollowUp(f);
    } else {
      // Route to the FollowUpRedirectPage which calls the API and redirects
      navigate(`/follow-up/${f.id}`);
    }
  };

  return (
    <>
      {pendingFollowUps.map((f) => {
        const inProgress = f.status === 'IN_PROGRESS';
        const cardClass = inProgress ? 'km-qcard inprog' : 'km-qcard urgent';
        const accessInfo = resolveAccessInfo(f);
        const accessClass = accessInfo.label === 'Access expires'
          ? 'km-qcard-access expiring'
          : 'km-qcard-access';
        
        return (
          <div key={f.id} className={cardClass}>
            <div className="km-qcard-top">
              <div className="km-qcard-name">{f.questionnaire_name}</div>
              {inProgress ? (
                <span className="km-badge km-badge-blue">In Progress</span>
              ) : (
                <span className="km-badge km-badge-amber">Pending</span>
              )}
            </div>
            {f.treatment_type && (
              <div style={{ fontSize: 11, color: 'var(--km-tm)', marginTop: 2, fontWeight: 500 }}>
                {f.treatment_type}
              </div>
            )}
            <div className="km-qcard-meta">
              <span>Sent {formatDate(f.created_at)}</span>
            </div>
            {f.due_date && (
              <div className="km-qcard-expiry due">
                <Clock size={11} strokeWidth={2} />
                <span>Due date {formatDate(f.due_date)}</span>
              </div>
            )}
            <div className={accessClass}>
              <Clock size={11} strokeWidth={2} />
              {accessInfo.label}: {accessInfo.value}
            </div>
            <button 
              className={inProgress ? 'km-qbtn km-qbtn-cont' : 'km-qbtn'}
              onClick={() => handleStart(f)}
            >
              {inProgress ? 'Continue' : 'Start Questionnaire'}
            </button>
          </div>
        );
      })}
    </>
  );
}

// Keep export default for any lazy loading
export default FollowUpList;
