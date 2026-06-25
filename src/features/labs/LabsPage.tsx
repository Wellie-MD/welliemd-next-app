import { useState, useEffect } from 'react';
import { TestTube, Calendar, Search, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { getLabResults, getLabSubmissions, type LabResult, type LabSubmission, type LabLifecycleEvent } from './api';
import { downloadFile } from '@/shared/lib/utils';

function formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateString;
    }
}

function getSubmissionStatusIcon(status: string | null) {
    switch (status?.toLowerCase()) {
        case 'completed':
            return <CheckCircle size={16} style={{ color: 'var(--km-gr)' }} />;
        case 'submitted':
            return <Clock size={16} style={{ color: 'var(--km-ac)' }} />;
        case 'pending':
            return <AlertCircle size={16} style={{ color: 'var(--km-am)' }} />;
        case 'failed':
            return <XCircle size={16} style={{ color: 'var(--km-re)' }} />;
        default:
            return <Clock size={16} style={{ color: 'var(--km-tm)' }} />;
    }
}

function getSubmissionStatusBadgeStyle(status: string | null) {
    const s = status?.toLowerCase();
    if (s === 'completed') return { background: 'rgba(34,197,94,.12)', color: 'var(--km-gr)', border: '1px solid rgba(34,197,94,.28)' };
    if (s === 'submitted') return { background: 'rgba(56,189,248,.14)', color: 'var(--km-ac)', border: '1px solid rgba(56,189,248,.28)' };
    if (s === 'pending') return { background: 'rgba(245,158,11,.14)', color: 'var(--km-am)', border: '1px solid rgba(245,158,11,.28)' };
    if (s === 'failed') return { background: 'rgba(239,68,68,.12)', color: 'var(--km-re)', border: '1px solid rgba(239,68,68,.25)' };
    return { background: 'var(--km-s2)', color: 'var(--km-tm)', border: '1px solid var(--km-b)' };
}

interface TimelineAction {
    label: string;
    url: string;
}

interface TimelineItem {
    id: string;
    title: string;
    description: string;
    occurredAt: string | null;
    sortTimestamp: number;
    actions: TimelineAction[];
}

function toSafeUrl(value?: string | null): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export function openAndDownloadPdf(dataUrl: string, filename: string): void {
    const base64Prefix = 'base64,';
    const prefixIndex = dataUrl.indexOf(base64Prefix);
    if (!dataUrl.startsWith('data:application/pdf;base64,') || prefixIndex === -1) {
        const fallbackWindow = window.open(dataUrl, '_blank', 'noopener,noreferrer');
        if (fallbackWindow) {
            fallbackWindow.opener = null;
        }
        return;
    }

    const base64 = dataUrl.slice(prefixIndex + base64Prefix.length).replace(/\s+/g, '');
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }

        const previewBlob = new Blob([bytes], { type: 'application/pdf' });
        const downloadBlob = new Blob([bytes], { type: 'application/octet-stream' });
        const blobUrl = window.URL.createObjectURL(previewBlob);

        const previewWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
        if (previewWindow) {
                previewWindow.opener = null;
        }

        downloadFile(downloadBlob, filename);

    window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
    }, 60_000);
}

function getEventType(event: LabLifecycleEvent): string {
    return (event.event_type || event.event || event.type || event.name || '').toUpperCase();
}

function getEventTimestamp(event: LabLifecycleEvent): string | null {
    return event.occurred_at || event.created_at || event.timestamp || null;
}

function getEventTitle(event: LabLifecycleEvent): string {
    if (event.title) return event.title;

    const eventType = getEventType(event);
    if (eventType === 'LAB_ORDER_REQUISITION_CREATED') return 'In-Person Lab Requisition Ready';
    if (eventType.length > 0) return eventType.toLowerCase().split('_').join(' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    return 'Lab Update';
}

function getEventDescription(event: LabLifecycleEvent): string {
    const payload = event.payload && typeof event.payload === 'object'
        ? event.payload as Record<string, unknown>
        : {};
    const info = payload.info && typeof payload.info === 'object'
        ? payload.info as Record<string, unknown>
        : {};
    const pick = (...keys: string[]): string | null => {
        for (const key of keys) {
            const value = payload[key];
            if (typeof value === 'string' && value.trim().length > 0) return value.trim();
        }
        return null;
    };
    const pickInfo = (...keys: string[]): string | null => {
        for (const key of keys) {
            const value = info[key];
            if (typeof value === 'string' && value.trim().length > 0) return value.trim();
        }
        return null;
    };
    const eventType = getEventType(event);

    if (event.description) return event.description;
    if (eventType === 'LAB_ORDER_RESULTS') {
        return pick('resultSummary', 'testResult') || 'Lab results were posted.';
    }
    if (eventType === 'LAB_ORDER_SHIPPED_TO_PATIENT' || eventType === 'LAB_ORDER_SHIPPED_TO_LAB') {
        const carrier = pick('carrier') || pickInfo('carrier');
        const tracking = pick('trackingNumber') || pick('tracking') || pickInfo('tracking');
        if (carrier && tracking) return `Carrier: ${carrier} • Tracking: ${tracking}`;
        if (carrier) return `Carrier: ${carrier}`;
        if (tracking) return `Tracking: ${tracking}`;
    }
    if (eventType === 'LAB_ORDER_DELIVERED_TO_PATIENT') {
        const proof = pick('deliveryProof');
        return proof ? `Delivery proof: ${proof.split('_').join(' ')}` : 'Lab kit delivered to patient.';
    }
    if (eventType === 'LAB_ORDER_RECEIVED_BY_LAB') {
        const accession = payload.specimen && typeof payload.specimen === 'object'
            ? (payload.specimen as Record<string, unknown>).accessionNumber
            : null;
        if (typeof accession === 'string' && accession.trim().length > 0) return `Accession: ${accession.trim()}`;
        return 'Lab has received the specimen and started processing.';
    }
    if (eventType === 'LAB_ORDER_CREATED') {
        const method = pick('labMethod');
        const panel = pick('panel');
        if (method && panel) return `Method: ${method} • Panel: ${panel}`;
        if (method) return `Method: ${method}`;
        if (panel) return `Panel: ${panel}`;
    }
    if (event.status) return `Status: ${event.status}`;
    return 'Lab update received.';
}

function eventActions(event: LabLifecycleEvent): TimelineAction[] {
    const payload = event.payload && typeof event.payload === 'object'
        ? event.payload as Record<string, unknown>
        : {};
    const info = payload.info && typeof payload.info === 'object'
        ? payload.info as Record<string, unknown>
        : {};
    const nested = (key: string): string | null => {
        const value = payload[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
        return null;
    };
    const nestedInfo = (key: string): string | null => {
        const value = info[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
        return null;
    };

    const actions: TimelineAction[] = [];
    const rawLabReqPdf = nested('labReqPdf');
    const requisitionFromBase64 = rawLabReqPdf && !rawLabReqPdf.startsWith('http') && !rawLabReqPdf.startsWith('data:')
        ? `data:application/pdf;base64,${rawLabReqPdf}`
        : rawLabReqPdf;
    const requisitionUrl = toSafeUrl(event.requisition_pdf_url) || toSafeUrl(event.requisition_url) || toSafeUrl(event.requisition_link)
        || toSafeUrl(nested('requisitionPdfUrl')) || toSafeUrl(requisitionFromBase64);
    const bookingUrl = toSafeUrl(event.booking_link) || toSafeUrl(event.booking_url) || toSafeUrl(event.result_booking_link) || toSafeUrl(event.result_booking_url)
        || toSafeUrl(nested('resultBookingLink')) || toSafeUrl(nested('bookingLink')) || toSafeUrl(nested('booking_url'));
    const trackingUrl = toSafeUrl(event.tracking_url) || toSafeUrl(event.tracking_link) || toSafeUrl(event.tracking_link_url)
        || toSafeUrl(nested('trackingUrl')) || toSafeUrl(nestedInfo('trackingUrl'));
    const trackingNumber = nested('trackingNumber') || nested('tracking') || nestedInfo('tracking');
    const carrier = nested('carrier') || nestedInfo('carrier');
    const resultPdfUrl = toSafeUrl(nested('resultPdfUrl'));

    if (requisitionUrl) actions.push({ label: 'Download Requisition', url: requisitionUrl });
    if (bookingUrl) actions.push({ label: 'Book Appointment', url: bookingUrl });
    if (trackingUrl) actions.push({ label: 'Track Shipment', url: trackingUrl });
    else if (trackingNumber) {
        const carrierLower = (carrier || '').toLowerCase();
        const trackingFallbackUrl = carrierLower.includes('fedex')
            ? `https://www.fedex.com/en-us/tracking.html?tracknumbers=${encodeURIComponent(trackingNumber)}`
            : carrierLower.includes('ups')
                ? `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`
                : `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(trackingNumber)}`;
        actions.push({
            label: carrier ? `Track ${carrier}` : 'Track Shipment',
            url: trackingFallbackUrl,
        });
    }
    if (resultPdfUrl) actions.push({ label: 'View Report', url: resultPdfUrl });

    return actions;
}

function normalizeTimeline(submission: LabSubmission): TimelineItem[] {
    const events = [
        ...(submission.events ?? []),
        ...(submission.lifecycle_events ?? []),
        ...(submission.activity_events ?? []),
    ];

    const seen = new Set<string>();
    const timeline: TimelineItem[] = [];

    events.forEach((event, index) => {
        const eventType = getEventType(event);
        const occurredAt = getEventTimestamp(event);
        const identity = [
            event.id || '',
            eventType,
            occurredAt || '',
            event.title || '',
            event.description || '',
        ].join('|');

        if (seen.has(identity)) return;
        seen.add(identity);

        const timestamp = occurredAt ? Date.parse(occurredAt) : Number.NaN;
        timeline.push({
            id: event.id || `${submission.id}-event-${index}`,
            title: getEventTitle(event),
            description: getEventDescription(event),
            occurredAt,
            sortTimestamp: Number.isFinite(timestamp) ? timestamp : 0,
            actions: eventActions(event),
        });
    });

    // Inject a synthetic 'Lab Order Created' timeline item for in-person flows.
    // Beluga often sends `LAB_ORDER_REQUISITION_CREATED` for in-person orders
    // but not a `LAB_ORDER_CREATED` event — surface a created card to match
    // the at-home experience when that's the case.
    const hasCreatedEvent = events.some(e => getEventType(e) === 'LAB_ORDER_CREATED');
    const hasRequisitionEvent = events.some(e => getEventType(e) === 'LAB_ORDER_REQUISITION_CREATED');
    if (!hasCreatedEvent && hasRequisitionEvent) {
        const syntheticEvent: LabLifecycleEvent = { event: 'LAB_ORDER_CREATED', occurred_at: submission.created_at || submission.submitted_at || null } as any;
        const occurred = getEventTimestamp(syntheticEvent);
        const ts = occurred ? Date.parse(occurred) : Number.NaN;
        timeline.push({
            id: `${submission.id}-created`,
            title: getEventTitle(syntheticEvent),
            description: getEventDescription(syntheticEvent),
            occurredAt: occurred,
            sortTimestamp: Number.isFinite(ts) ? ts : 0,
            actions: eventActions(syntheticEvent),
        });
    }

    // NOTE: We intentionally do not inject submission-level "Lab Order Links" into the
    // submission timeline here. Links (requisition/booking) are surfaced in lifecycle
    // events where they originate. This keeps the Submissions tab focused on status
    // and detailed lab results rather than duplicating actionable links.

    return timeline.sort((a, b) => b.sortTimestamp - a.sortTimestamp);
}

interface LabResultCardProps {
    result: LabResult;
    isExpanded: boolean;
    onToggle: () => void;
}

function LabResultCard({ result, isExpanded, onToggle }: LabResultCardProps) {
    return (
        <div className="km-card km-fade km-lab-row-card" style={{ marginBottom: 12 }}>
            <div style={{ padding: 16 }}>
                <div 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    onClick={onToggle}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ padding: 10, background: 'rgba(56,189,248,.10)', borderRadius: 8, flexShrink: 0, border: '1px solid rgba(56,189,248,.24)' }}>
                            <TestTube size={18} style={{ color: 'var(--km-t)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--km-t)' }}>{result.test_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--km-tm)' }}>
                                {result.sample_source || 'Sample type N/A'} • {formatDate(result.screening_date)}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--km-ac)' }}>{result.test_result} {result.test_result_units}</div>
                            {result.reference_range && (
                                <div style={{ fontSize: 11, color: 'var(--km-tm)' }}>Ref: {result.reference_range}</div>
                            )}
                        </div>
                        {isExpanded ? (
                            <ChevronUp size={18} style={{ color: 'var(--km-tm)' }} />
                        ) : (
                            <ChevronDown size={18} style={{ color: 'var(--km-tm)' }} />
                        )}
                    </div>
                </div>
                
                {isExpanded && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--km-b)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 4, textTransform: 'uppercase' }}>Report Date</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(result.report_date)}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 4, textTransform: 'uppercase' }}>Sample Source</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{result.sample_source || 'N/A'}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 4, textTransform: 'uppercase' }}>Test to Treat</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{result.test_to_treat ? 'Yes' : 'No'}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 4, textTransform: 'uppercase' }}>Submission Status</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--km-ac)' }}>{result.submission_status || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

interface SubmissionCardProps {
    submission: LabSubmission;
    isExpanded: boolean;
    onToggle: () => void;
}

function SubmissionCard({ submission, isExpanded, onToggle }: SubmissionCardProps) {
    const timeline = normalizeTimeline(submission);

    return (
        <div className="km-card km-fade km-lab-row-card" style={{ marginBottom: 12 }}>
            <div style={{ padding: 16 }}>
                <div 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    onClick={onToggle}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ padding: 10, background: 'var(--km-pup)', borderRadius: 8, flexShrink: 0, border: '1px solid rgba(167,139,250,0.26)' }}>
                            <Calendar size={18} style={{ color: 'var(--km-pu)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--km-t)' }}>
                                Lab Submission {submission.id.slice(0, 8)}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--km-tm)' }}>
                                {submission.lab_results.length} result{submission.lab_results.length !== 1 ? 's' : ''} • {formatDate(submission.created_at)}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...getSubmissionStatusBadgeStyle(submission.submission_status), padding: '5px 10px', borderRadius: 999 }}>
                            {getSubmissionStatusIcon(submission.submission_status)}
                            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>{submission.submission_status || 'Unknown'}</span>
                        </div>
                        {isExpanded ? (
                            <ChevronUp size={18} style={{ color: 'var(--km-tm)' }} />
                        ) : (
                            <ChevronDown size={18} style={{ color: 'var(--km-tm)' }} />
                        )}
                    </div>
                </div>
                
                {isExpanded && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--km-b)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 4, textTransform: 'uppercase' }}>Test to Treat</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{submission.test_to_treat ? 'Yes' : 'No'}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 4, textTransform: 'uppercase' }}>Master ID</div>
                                <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{submission.master_id || 'N/A'}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 4, textTransform: 'uppercase' }}>Beluga Visit ID</div>
                                <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{submission.beluga_visit_id || 'N/A'}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 4, textTransform: 'uppercase' }}>Submitted At</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(submission.submitted_at)}</div>
                            </div>
                        </div>
                        
                        {/* Removed inline rendering of submission.lab_results per UX request. */}

                        {timeline.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--km-t)' }}>Lifecycle Timeline</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {timeline.map((item) => (
                                        <div
                                            key={item.id}
                                            style={{
                                                padding: '10px 12px',
                                                background: 'var(--km-s2)',
                                                borderRadius: 10,
                                                border: '1px solid var(--km-b)',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--km-t)' }}>{item.title}</div>
                                                <div style={{ fontSize: 11, color: 'var(--km-tm)' }}>{formatDate(item.occurredAt)}</div>
                                            </div>
                                            <div style={{ marginTop: 5, fontSize: 12, color: 'var(--km-tm)', lineHeight: 1.45 }}>{item.description}</div>
                                            {item.actions.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                                    {item.actions.map((action) => (
                                                        <a
                                                            key={`${item.id}-${action.label}-${action.url}`}
                                                            href={action.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="km-btn"
                                                            style={{
                                                                fontSize: 11,
                                                                padding: '6px 10px',
                                                                textDecoration: 'none',
                                                                background: 'var(--km-ac)',
                                                                color: '#fff',
                                                                border: '1px solid transparent'
                                                            }}
                                                            onClick={(e) => {
                                                                try {
                                                                    const url = action.url || '';
                                                                    if (url.startsWith('data:application/pdf;base64,')) {
                                                                        e.preventDefault();
                                                                        const filename = `lab-requisition-${submission.master_id || submission.id || 'download'}.pdf`;
                                                                        openAndDownloadPdf(url, filename);
                                                                    }
                                                                } catch (err) {
                                                                    // fall back to default navigation on error
                                                                    // eslint-disable-next-line no-console
                                                                    console.error('Failed to open requisition PDF', err);
                                                                }
                                                            }}
                                                        >
                                                            {action.label}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {submission.error_details && (
                            <div className="km-vbox km-vbox-red" style={{ marginTop: 12 }}>
                                <AlertCircle size={14} style={{ color: 'var(--km-re)', flexShrink: 0, marginTop: 1 }} />
                                <div style={{ fontSize: 12, color: 'var(--km-re)' }}>{submission.error_details}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LabsPage() {
    const [labResults, setLabResults] = useState<LabResult[]>([]);
    const [labSubmissions, setLabSubmissions] = useState<LabSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'results' | 'submissions'>('results');
    const [expandedResult, setExpandedResult] = useState<string | null>(null);
    const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setError(null);
            
            const [results, submissions] = await Promise.all([
                getLabResults(),
                getLabSubmissions(),
            ]);
            // Merge Beluga-provided lab results contained on submissions into
            // the main lab results list so they appear under the "Lab Results" tab.
            const resultsMap: Record<string, typeof results[0]> = {};

            const keyFor = (r: any, fallbackMaster?: string) => {
                if (r.id) return r.id;
                const dateKey = r.report_date || r.screening_date || '';
                return `${(r.test_name || 'unknown').toLowerCase()}::${dateKey}::${fallbackMaster || ''}`;
            };

            // Add API results first
            for (const r of results) {
                resultsMap[keyFor(r)] = r;
            }

            // Also include lab_results embedded on submissions (avoid duplicates)
            for (const s of submissions) {
                const master = s.master_id || s.id || '';
                for (const r of (s.lab_results || [])) {
                    const key = keyFor(r, master);
                    if (!resultsMap[key]) {
                        // normalize id if missing to keep React keys stable
                        const normalized = { ...r, id: r.id || `${master}:${(r.test_name||'r').slice(0,20)}:${r.report_date||r.screening_date||''}` };
                        resultsMap[key] = normalized as any;
                    }
                }
            }

            setLabResults(Object.values(resultsMap));
            setLabSubmissions(submissions);
        } catch (err) {
            console.error('Error loading lab data:', err);
            setError('Failed to load lab data. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    const filteredResults = labResults.filter(result =>
        result.test_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSubmissions = labSubmissions.filter(submission =>
        submission.lab_results.some(r => 
            r.test_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const toggleResult = (id: string) => {
        setExpandedResult(expandedResult === id ? null : id);
    };

    const toggleSubmission = (id: string) => {
        setExpandedSubmission(expandedSubmission === id ? null : id);
    };

    if (loading) {
        return (
            <div className="pg" id="pg-labs">
                <p className="km-page-title km-fade">Labs</p>
                <p className="km-page-sub km-fade">View your lab results and submissions</p>
                <div className="km-card km-fade" style={{ padding: 14 }}>
                    <div className="km-skel" style={{ width: '30%', height: 20, marginBottom: 12 }}></div>
                    <div className="km-skel" style={{ width: '100%', height: 40, marginBottom: 12 }}></div>
                    <div className="km-skel" style={{ width: '100%', height: 40 }}></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pg" id="pg-labs">
                <p className="km-page-title km-fade">Labs</p>
                <p className="km-page-sub km-fade">View your lab results and submissions</p>
                <div className="km-vbox km-vbox-red km-fade">
                    <AlertCircle size={14} style={{ color: 'var(--km-re)', flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--km-t)', fontWeight: 600, marginBottom: 2 }}>Error Loading Labs</div>
                        <div style={{ color: 'var(--km-tm)' }}>{error}</div>
                        <button className="km-btn km-btn-outline" style={{ marginTop: 8, fontSize: 11, padding: '5px 12px' }} onClick={loadData}>
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pg" id="pg-labs">
            <p className="km-page-title km-fade" style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: 'var(--km-t)' }}>Labs</p>
            <p className="km-page-sub km-fade">View your lab results and submissions</p>
            
            <div className="km-swrap km-fade" style={{ marginBottom: 14 }}>
                <Search size={16} />
                <input
                    className="km-sinp"
                    placeholder="Search lab results..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="km-tabs km-fade" style={{ marginBottom: 14 }}>
                <button 
                    className={`km-tab ${activeTab === 'results' ? 'active' : ''}`}
                    onClick={() => setActiveTab('results')}
                >
                    Lab Results ({filteredResults.length})
                </button>
                <button 
                    className={`km-tab ${activeTab === 'submissions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('submissions')}
                >
                    Submissions ({filteredSubmissions.length})
                </button>
            </div>

            {activeTab === 'results' && (
                <div className="km-fade km-labs-list">
                    {filteredResults.length > 0 ? (
                        filteredResults.map((result) => (
                            <LabResultCard
                                key={result.id}
                                result={result}
                                isExpanded={expandedResult === result.id}
                                onToggle={() => toggleResult(result.id)}
                            />
                        ))
                    ) : (
                        <div className="km-sc">
                            <div className="km-empty">
                                <div className="km-eic">
                                    <TestTube size={20} />
                                </div>
                                <div className="km-et">No lab results</div>
                                <div className="km-es">
                                    {searchTerm 
                                        ? 'No results match your search criteria.' 
                                        : "You don't have any lab results yet."}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'submissions' && (
                <div className="km-fade km-labs-list">
                    {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map((submission) => (
                            <SubmissionCard
                                key={submission.id}
                                submission={submission}
                                isExpanded={expandedSubmission === submission.id}
                                onToggle={() => toggleSubmission(submission.id)}
                            />
                        ))
                    ) : (
                        <div className="km-sc">
                            <div className="km-empty">
                                <div className="km-eic">
                                    <Calendar size={20} />
                                </div>
                                <div className="km-et">No lab submissions</div>
                                <div className="km-es">
                                    {searchTerm 
                                        ? 'No submissions match your search criteria.' 
                                        : "You don't have any lab submissions yet."}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export { LabsPage };
