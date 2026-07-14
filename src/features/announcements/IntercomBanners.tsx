import { AnnouncementBanner } from './AnnouncementBanner';
import { AnnouncementPost } from './AnnouncementPost';
import { useIntercomBanners } from './IntercomBannersContext';

/**
 * Renders the inline (top) banner when Intercom returns a `type:inline`
 * banner for the contact. Place in the page content, before the title.
 */
export function IntercomInlineBanner({ className }: { className?: string }) {
  const { inline, dismiss } = useIntercomBanners();
  if (!inline) return null;

  const message = [inline.title, inline.body].filter(Boolean).join(' — ');
  const handleCta = () => {
    if (inline.action?.type === 'url' && inline.action.target) {
      window.open(inline.action.target, '_blank', 'noopener,noreferrer');
    }
    dismiss(inline.view_id);
  };
  return (
    <AnnouncementBanner
      message={message}
      className={className}
      onDismiss={() => dismiss(inline.view_id)}
      onCta={handleCta}
      ctaLabel={inline.action?.label ?? undefined}
    />
  );
}

/**
 * Renders the floating card (bottom-left) when Intercom returns a `type:card`
 * banner for the contact. Fixed-position, so it can live in the layout.
 */
export function IntercomCardBanner() {
  const { card, dismiss } = useIntercomBanners();
  if (!card) return null;

  // Only render a CTA when Intercom actually defined a URL action — otherwise
  // there's no button (no fabricated "See what's new" that just closes it).
  const hasUrlAction = card.action?.type === 'url' && !!card.action.target;
  const handleCta = () => {
    if (hasUrlAction) {
      window.open(card.action!.target!, '_blank', 'noopener,noreferrer');
    }
    dismiss(card.view_id);
  };
  return (
    <AnnouncementPost
      sender={card.sender || undefined}
      eyebrow={card.eyebrow || undefined}
      title={card.title || undefined}
      body={card.body}
      onDismiss={() => dismiss(card.view_id)}
      onCta={hasUrlAction ? handleCta : undefined}
      ctaLabel={hasUrlAction ? card.action?.label || 'Learn more' : null}
      showDismiss={card.show_dismiss_button !== false}
    />
  );
}
