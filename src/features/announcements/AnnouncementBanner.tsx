import { useState, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

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
 * Inline announcement banner — the "top Banner" format from the client portal
 * mockup. Sits at the top of a page's content (before the page title) and is
 * used for proactive, low-urgency updates (shipping delays, service notices).
 *
 * Visibility is currently always-on once mounted; conditional/targeted display
 * (by attribute, company, etc.) is wired in separately.
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
        'flex items-center gap-[13px] rounded-xl border border-border border-l-4 border-l-amber-500 bg-card px-4 py-[13px]',
        className,
      )}
    >
      <span className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-lg bg-amber-500/15">
        <AlertTriangle
          className="h-[17px] w-[17px] text-amber-700 dark:text-amber-500"
          strokeWidth={2}
        />
      </span>

      <p className="flex-1 text-[13.5px] leading-[1.45] text-foreground">
        {sender && (
          <span className="mr-[7px] text-[11px] font-bold uppercase tracking-[0.04em] text-muted-foreground">
            {sender}
          </span>
        )}
        {message}
      </p>

      {ctaLabel && (
        <button
          type="button"
          onClick={handleCta}
          className="whitespace-nowrap rounded-lg border border-border bg-card px-[13px] py-[7px] text-[12.5px] font-semibold text-foreground transition-colors hover:bg-muted"
        >
          {ctaLabel}
        </button>
      )}

      {dismissible && (
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
  );
}
