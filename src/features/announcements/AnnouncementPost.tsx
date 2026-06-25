import { useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface AnnouncementPostProps {
  /** Sender name shown next to the avatar (e.g. "WellieMD"). */
  sender?: string;
  /** Small eyebrow line under the sender (e.g. "Product update"). */
  eyebrow?: string;
  /** Single character/initials rendered inside the avatar circle. */
  avatarText?: string;
  /** Card heading. Only rendered when provided. */
  title?: string;
  /** Card body copy. Keep PHI out of announcement text. */
  body: ReactNode;
  /** Primary action label. Pass null to hide the action button. */
  ctaLabel?: string | null;
  /** Called when the CTA is clicked. Defaults to dismissing the post. */
  onCta?: () => void;
  /** Called after the post is dismissed (via the X or the default CTA). */
  onDismiss?: () => void;
  /** Show the dismiss (X) button. Mirrors Intercom's `show_dismiss_button`. */
  showDismiss?: boolean;
  className?: string;
}

/**
 * Floating announcement post — the "corner Post" format. Fixed to the
 * bottom-left of the viewport, for richer single-topic announcements (feature
 * releases, what's-new).
 *
 * Styled with the patient portal's "km" design tokens (inline styles) so it
 * matches the native UI in both the light and dark themes.
 */
export function AnnouncementPost({
  sender,
  eyebrow,
  avatarText,
  title,
  body,
  ctaLabel = "See what's new",
  onCta,
  onDismiss,
  showDismiss = true,
  className,
}: AnnouncementPostProps) {
  // Header sender/eyebrow/title are shown only when provided — never fabricated.
  const hasSender = Boolean(sender && sender.trim());
  const hasEyebrow = Boolean(eyebrow && eyebrow.trim());
  const avatar = avatarText || (sender?.trim()[0] ?? '').toUpperCase();
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
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 8900,
        width: 322,
        maxWidth: 'calc(100vw - 48px)',
        background: 'var(--km-s1)',
        border: '1px solid var(--km-b)',
        borderRadius: 'var(--km-r)',
        boxShadow: '0 14px 44px rgba(0, 0, 0, 0.28)',
        padding: '17px 18px 18px',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {(hasSender || hasEyebrow || showDismiss) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 11,
          }}
        >
          {hasSender || hasEyebrow ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {hasSender && (
                <span
                  style={{
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '50%',
                    background: 'var(--km-ac)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {avatar}
                </span>
              )}
              <div>
                {hasSender && (
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--km-t)' }}>
                    {sender}
                  </div>
                )}
                {hasEyebrow && (
                  <div style={{ fontSize: 10.5, color: 'var(--km-tm)' }}>{eyebrow}</div>
                )}
              </div>
            </div>
          ) : (
            <span />
          )}
          {showDismiss && (
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
      )}

      {title && (
        <h4
          style={{
            margin: '0 0 5px',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--km-t)',
          }}
        >
          {title}
        </h4>
      )}
      <p
        style={{
          margin: '0 0 14px',
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--km-tm)',
        }}
      >
        {body}
      </p>

      {ctaLabel && (
        <button
          type="button"
          onClick={handleCta}
          onMouseEnter={() => setCtaHover(true)}
          onMouseLeave={() => setCtaHover(false)}
          style={{
            width: '100%',
            background: 'var(--km-ac)',
            border: 'none',
            borderRadius: 'var(--km-rs)',
            padding: '9px 12px',
            textAlign: 'center',
            fontFamily: "'Outfit', sans-serif",
            fontSize: 12.5,
            fontWeight: 600,
            color: '#fff',
            cursor: 'pointer',
            filter: ctaHover ? 'brightness(1.08)' : 'none',
            transition: 'filter 0.2s',
          }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
