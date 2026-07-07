import { CalendarDays, Download, ExternalLink, X } from 'lucide-react';
import type { LabSubmission } from '../api/index';

type Props = {
  submission: (LabSubmission & any) | null;
  onClose: () => void;
  onDownloadRequisition: (orderId: string) => void;
};

export default function LabBookingModal({ submission, onClose, onDownloadRequisition }: Props) {
  if (!submission) return null;

  const bookingUrl = submission.booking_link || submission.booking_url || '';
  const panelName = submission._lab_panel_name || submission.lab_results?.[0]?.test_name || 'your lab test';
  const lab = submission._lab_provider || 'the lab';
  const canDownloadRequisition = Boolean(submission.requisition_pdf_url || submission.requisition_available);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Book lab appointment"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(15, 23, 42, .42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="km-dash-card"
        style={{ width: '100%', maxWidth: 480, padding: 0, overflow: 'hidden' }}
        onClick={event => event.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <CalendarDays size={16} color="var(--km-tm)" />
            <span style={{ fontSize: 12, color: 'var(--km-tm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {submission.master_id || submission.id}
            </span>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{ border: 0, background: 'transparent', color: 'var(--km-tm)', cursor: 'pointer', padding: 6, lineHeight: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '8px 18px 18px', textAlign: 'center' }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', margin: '0 auto 14px', background: 'var(--km-s2)', border: '1px solid var(--km-b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={24} color="var(--km-ac)" />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px', color: 'var(--km-t)' }}>
            Book your {lab} appointment
          </h2>
          <p style={{ fontSize: 13, color: 'var(--km-tm)', lineHeight: 1.5, margin: '0 0 16px' }}>
            Choose a time at a {lab} location near you for your {panelName}.
          </p>

          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="km-btn km-btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', marginBottom: 12 }}
            >
              <ExternalLink size={15} />
              Book appointment
            </a>
          )}

          <p style={{ fontSize: 11, color: 'var(--km-tm)', lineHeight: 1.5, margin: '0 0 14px', textAlign: 'left' }}>
            This link may also be sent to your email or phone by Junction. Prefer to walk in? You can visit an eligible {lab} location with your requisition.
          </p>

          {canDownloadRequisition && (
            <button
              type="button"
              className="km-btn km-btn-outline"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}
              onClick={() => onDownloadRequisition(submission.id)}
            >
              <Download size={15} />
              Download requisition
            </button>
          )}

          <button type="button" className="km-btn km-btn-outline" style={{ width: '100%' }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
