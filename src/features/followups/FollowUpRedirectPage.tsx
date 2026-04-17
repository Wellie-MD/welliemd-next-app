import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { startFollowUp } from './api';

export default function FollowUpRedirectPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const redirectToQuestionnaire = async () => {
      if (!sessionId) {
        setError('Follow-up session not found.');
        return;
      }

      try {
        const result = await startFollowUp(sessionId);
        if (!cancelled && result.success && result.follow_up_url) {
          window.location.href = result.follow_up_url;
          return;
        }

        if (!cancelled) {
          setError(result.error || 'Failed to start follow-up.');
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to start follow-up.');
        }
      }
    };

    redirectToQuestionnaire();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div
      style={{
        minHeight: 'calc(var(--app-vh, 1vh) * 100)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--km-bg, #0a0a0a)',
        color: 'var(--km-t, #f0f0f0)',
        fontFamily: "'Outfit', sans-serif",
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--km-s1, #111)',
          border: '1px solid var(--km-b, rgba(255,255,255,0.07))',
          borderRadius: 16,
          padding: '40px 28px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {error ? (
          <>
            {/* Error icon */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'var(--km-rep, rgba(239,68,68,0.08))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--km-re, #ef4444)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Unable to Open Follow-Up
            </h1>
            <p style={{ fontSize: 13, color: 'var(--km-tm, #666)', lineHeight: 1.6, marginBottom: 20 }}>
              {error}
            </p>
            <button
              onClick={() => window.history.back()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid var(--km-b, rgba(255,255,255,0.07))',
                background: 'var(--km-s2, #181818)',
                color: 'var(--km-t, #f0f0f0)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                transition: 'all 0.2s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Go Back
            </button>
          </>
        ) : (
          <>
            {/* Loading spinner */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '3px solid var(--km-b, rgba(255,255,255,0.07))',
                borderTopColor: 'var(--km-ac, #4f8ef7)',
                margin: '0 auto 24px',
                animation: 'km-spin 0.8s linear infinite',
              }}
            />
            <style>{`@keyframes km-spin { to { transform: rotate(360deg) } }`}</style>
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Opening your follow-up…
            </h1>
            <p style={{ fontSize: 13, color: 'var(--km-tm, #666)', lineHeight: 1.6 }}>
              Please wait while we securely redirect you to your questionnaire.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
