import { formatDate, normalizeTimeline } from '../utils/index';
import type { LabSubmission } from '../api/index';
import { labCollectionMethodLabel } from '../constants/collectionMethods';
import { labStageLabel } from '../constants/stages';
import { labSubmissionBadgeTone } from '../constants/tones';

export default function SubmissionCard({ sub, expanded, onToggle, onDownloadRequisition, onBookAppointment }: {
  sub: LabSubmission & any;
  expanded: boolean;
  onToggle: () => void;
  onDownloadRequisition: (orderId: string) => void;
  onBookAppointment: (submission: LabSubmission & any) => void;
}) {
  const timelineItems = normalizeTimeline(sub);
  const panelName = sub._lab_panel_name || (sub.lab_results?.[0]?.test_name) || 'Lab Panel';
  const provider = sub._lab_provider || '—';
  const collection = sub._collection_method_display || labCollectionMethodLabel(sub._collection_method);
  const stage = sub._stage_display || labStageLabel(sub._stage || sub.submission_status);
  const hasBooking = Boolean(sub.booking_link || sub.booking_url);
  const hasRequisition = Boolean(sub.requisition_pdf_url || sub.requisition_available);
  
  const isKit = String(sub._collection_method || "").toLowerCase().includes("testkit") || String(sub._collection_method || "").toLowerCase().includes("kit");
  const isShippedOrDelivered = String(sub._stage || "").toLowerCase().includes("shipped") || String(sub._stage || "").toLowerCase().includes("delivered");
  const hasTracking = isKit && isShippedOrDelivered;

  return (
    <div style={{ borderBottom: '1px solid var(--km-b)' }}>
      <div className="km-oitem" onClick={onToggle}>
        <div className="km-oimg" style={{ background: 'rgba(245,158,11,0.1)' }}>🧪</div>
        <div className="km-oileft">
          <div className="km-oiid">
            {sub.id.substring(0, 16).toUpperCase()}{' '}
            <span className={`km-badge ${labSubmissionBadgeTone(sub.submission_status)}`} style={{ fontSize: 10, marginLeft: 6 }}>
              {stage}
            </span>
          </div>
          <div className="km-oinm">{panelName}</div>
          <div className="km-oiph">{provider}{collection ? ` · ${collection}` : ''}</div>
        </div>
        <div className="km-oiright">
          {hasTracking ? (
            <button
              type="button"
              className="km-btn km-btn-primary"
              style={{ fontSize: 11, padding: '5px 12px', marginBottom: 6 }}
              onClick={event => {
                event.stopPropagation();
                if (sub.tracking_url || sub.tracking_link) window.open(sub.tracking_url || sub.tracking_link, '_blank');
                else alert("Tracking information is not available yet.");
              }}
            >
              Track shipment
            </button>
          ) : hasBooking ? (
            <button
              type="button"
              className="km-btn km-btn-primary"
              style={{ fontSize: 11, padding: '5px 12px', marginBottom: 6 }}
              onClick={event => { event.stopPropagation(); onBookAppointment(sub); }}
            >
              Book appointment
            </button>
          ) : hasRequisition ? (
            <button
              type="button"
              className="km-btn km-btn-outline"
              style={{ fontSize: 11, padding: '5px 12px', marginBottom: 6 }}
              onClick={event => { event.stopPropagation(); onDownloadRequisition(sub.id); }}
            >
              Download requisition
            </button>
          ) : null}
          <div className="km-oidt">{formatDate(sub.created_at)}</div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '16px 20px', background: 'var(--km-s2)' }}>
          {(hasRequisition || hasBooking || hasTracking) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {hasRequisition && (
                <button type="button" onClick={() => onDownloadRequisition(sub.id)} className="km-btn km-btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>
                  Download requisition
                </button>
              )}
              {hasBooking && !hasTracking && (
                <button type="button" onClick={() => onBookAppointment(sub)} className="km-btn km-btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>
                  Book appointment
                </button>
              )}
              {hasTracking && (
                <button type="button" onClick={() => {
                  if (sub.tracking_url || sub.tracking_link) window.open(sub.tracking_url || sub.tracking_link, '_blank');
                  else alert("Tracking information is not available yet.");
                }} className="km-btn km-btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>
                  Track shipment
                </button>
              )}
            </div>
          )}

          {timelineItems.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--km-tm)', letterSpacing: '.5px', marginBottom: 12 }}>Timeline</div>
              {timelineItems.map((item, index) => {
                const isLast = index === timelineItems.length - 1;
                return (
                  <div key={item.id} style={{ position: 'relative', paddingLeft: 24, paddingBottom: isLast ? 0 : 20 }}>
                    {!isLast && <div style={{ position: 'absolute', left: 4, top: 16, bottom: -4, width: '1.5px', background: 'var(--km-b)' }} />}
                    <div style={{ position: 'absolute', left: 1, top: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--km-ac)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--km-t)', lineHeight: 1.2 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--km-tm)', marginTop: 4, lineHeight: 1.4 }}>{item.description}</div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--km-tm)', fontWeight: 500, whiteSpace: 'nowrap' }}>{formatDate(item.occurredAt)}</div>
                    </div>
                    {item.actions.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        {item.actions.map((act, idx) => (
                          act.label === 'Download Requisition' ? (
                            <button key={idx} type="button" onClick={() => onDownloadRequisition(sub.id)} className="km-btn km-btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>
                              {act.label}
                            </button>
                          ) : (
                            <button key={idx} type="button" onClick={() => onBookAppointment(sub)} className="km-btn km-btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>
                              {act.label}
                            </button>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
