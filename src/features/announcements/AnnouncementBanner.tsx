import { useState, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface AnnouncementBannerProps {
  /** Uppercase sender label shown before the message (e.g. "WellieMD"). */
  sender?: string;
  /** Banner body copy. Keep PHI out of announcement text. */
  message: ReactNode;
  /** Primary action label. Pass null to hide the action button. */
  ctaLabel?: string | null;
  /** Called when the CTA is clicked. Defaults to dismissing the banner. */
  onCta?: () => void;
  /** Called after the banner is dismissed (via the X or the default CTA). */
  onDismiss?: () => void;
  /** Render the dismiss (X) button. */
  dismissible?: boolean;
  className?: string;
}

/**
 * Inline announcement banner — the "top Banner" format. Sits at the top of a
 * page's content (before the page title) for proactive, low-urgency updates
 * (shipping delays, service notices).
 *
 * Styled with the patient portal's "km" design tokens (inline styles, like the
 * rest of the patient UI) so it sits natively in both the light and dark themes
 * instead of clashing as a shadcn-white card.
 */
export function AnnouncementBanner({
  sender = 'WellieMD',
  message,
  ctaLabel = 'Got it',
  onCta,
  onDismiss,
  dismissible = true,
  className,
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [ctaHover, setCtaHover] = useState(false);
  const [dismissHover, setDismissHover] = useState(false);

  const dismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleCta = () => {
    if (onCta) onCta();
    else dismiss();
  };

  if (dismissed) return null;

  return (
    <div
      role="status"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        background: 'var(--km-s1)',
        border: '1px solid var(--km-b)',
        borderLeft: '3px solid var(--km-am)',
        borderRadius: 'var(--km-r)',
        padding: '13px 14px',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 8,
          background: 'var(--km-amp)',
          color: 'var(--km-am)',
        }}
      >
        <AlertTriangle width={17} height={17} strokeWidth={2} />
      </span>

      <p
        style={{
          flex: 1,
          margin: 0,
          fontSize: 13.5,
          lineHeight: 1.45,
          color: 'var(--km-t)',
        }}
      >
        {sender && (
          <span
            style={{
              marginRight: 7,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--km-tm)',
            }}
          >
            {sender}
          </span>
        )}
        {message}
      </p>

      {ctaLabel && (
        <button
          type="button"
          onClick={handleCta}
          onMouseEnter={() => setCtaHover(true)}
          onMouseLeave={() => setCtaHover(false)}
          style={{
            whiteSpace: 'nowrap',
            background: ctaHover ? 'var(--km-s3)' : 'var(--km-s2)',
            border: `1px solid ${ctaHover ? 'var(--km-bh)' : 'var(--km-b)'}`,
            borderRadius: 'var(--km-rs)',
            padding: '7px 13px',
            fontFamily: "'Outfit', sans-serif",
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--km-t)',
            cursor: 'pointer',
            transition: 'background 0.2s, border-color 0.2s',
          }}
        >
          {ctaLabel}
        </button>
      )}

      {dismissible && (
        <button
          type="button"
          onClick={dismiss}
          onMouseEnter={() => setDismissHover(true)}
          onMouseLeave={() => setDismissHover(false)}
          aria-label="Dismiss"
          style={{
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'none',
            border: 'none',
            padding: 4,
            color: dismissHover ? 'var(--km-t)' : 'var(--km-tm)',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
        >
          <X width={16} height={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
