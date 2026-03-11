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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        {error ? (
          <>
            <h1 className="text-xl font-semibold">Unable to Open Follow-Up</h1>
            <p className="mt-3 text-sm text-muted-foreground">{error}</p>
          </>
        ) : (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <h1 className="mt-4 text-xl font-semibold">Opening your follow-up...</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Please wait while we securely redirect you to your questionnaire.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
