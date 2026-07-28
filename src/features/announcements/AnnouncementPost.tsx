import { useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
 * Floating announcement post — the "corner Post" format from the client portal
 * mockup. Fixed to the bottom-left of the viewport and used for richer,
 * single-topic announcements (feature releases, what's-new).
 *
 * Visibility is currently always-on once mounted; conditional/targeted display
 * is wired in separately.
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
      className={cn(
        'fixed bottom-6 left-6 z-[8900] w-[322px] max-w-[calc(100vw-48px)] rounded-2xl border border-border bg-card pb-[18px] pl-[18px] pr-[18px] pt-[17px] shadow-[0_14px_44px_rgba(15,23,42,0.22)]',
        'max-[560px]:bottom-[14px] max-[560px]:left-[14px] max-[560px]:right-[14px] max-[560px]:w-auto',
        className,
      )}
    >
      {(hasSender || hasEyebrow || showDismiss) && (
        <div className="mb-[11px] flex items-center justify-between">
          {hasSender || hasEyebrow ? (
            <div className="flex items-center gap-2">
              {hasSender && (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">
                  {avatar}
                </span>
              )}
              <div>
                {hasSender && (
                  <div className="text-[12.5px] font-semibold text-foreground">{sender}</div>
                )}
                {hasEyebrow && (
                  <div className="text-[10.5px] text-muted-foreground">{eyebrow}</div>
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
              aria-label="Dismiss"
              className="flex-shrink-0 p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {title && (
        <h4 className="mb-[5px] text-[15px] font-bold text-foreground">{title}</h4>
      )}
      <p className="mb-[14px] text-[13px] leading-[1.5] text-muted-foreground">{body}</p>

      {ctaLabel && (
        <button
          type="button"
          onClick={handleCta}
          className="w-full rounded-lg bg-primary px-3 py-[9px] text-center text-[12.5px] font-semibold text-primary-foreground transition hover:brightness-105"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
