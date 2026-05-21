import { useState, useEffect } from 'react';
import { TestTube, Calendar, Search, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { getLabResults, getLabSubmissions, type LabResult, type LabSubmission } from './api';

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

function getResultValueStyle(value: string | null) {
    const v = (value || '').toLowerCase();
    if (v.includes('complete') || v.includes('normal')) return { color: 'var(--km-gr)' };
    if (v.includes('pending') || v.includes('process')) return { color: 'var(--km-ac)' };
    if (v.includes('fail') || v.includes('reject')) return { color: 'var(--km-re)' };
    return { color: 'var(--km-t)' };
}

function getResultSourceLabel(source?: string | null) {
    const normalized = (source || '').toLowerCase();
    if (normalized === 'junction') return 'Junction';
    if (normalized === 'beluga') return 'Beluga';
    if (normalized === 'manual') return 'Manual';
    if (normalized === 'import') return 'Import';
    return 'Unknown source';
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
    if (eventType.length > 0) return eventType.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
        return proof ? `Delivery proof: ${proof.replaceAll('_', ' ')}` : 'Lab kit delivered to patient.';
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

    const submissionActions: TimelineAction[] = [];
    const requisitionUrl = toSafeUrl(submission.requisition_pdf_url);
    const bookingUrl = toSafeUrl(submission.booking_link) || toSafeUrl(submission.booking_url);
    if (requisitionUrl) submissionActions.push({ label: 'Download Requisition', url: requisitionUrl });
    if (bookingUrl) submissionActions.push({ label: 'Book Appointment', url: bookingUrl });

    if (submissionActions.length > 0) {
        timeline.push({
            id: `${submission.id}-links`,
            title: 'Lab Order Links',
            description: 'Quick access to requisition and booking resources.',
            occurredAt: submission.created_at,
            sortTimestamp: Date.parse(submission.created_at),
            actions: submissionActions,
        });
    }

    const hasInPersonEvent = timeline.some((item) => item.title === 'In-Person Lab Requisition Ready');
    if (!hasInPersonEvent && submissionActions.some((action) => action.label === 'Download Requisition')) {
        timeline.push({
            id: `${submission.id}-in-person-fallback`,
            title: 'In-Person Lab Requisition Ready',
            description: 'Your requisition is available for in-person lab testing.',
            occurredAt: submission.created_at,
            sortTimestamp: Date.parse(submission.created_at),
            actions: submissionActions.filter((action) => action.label === 'Download Requisition'),
        });
    }

    return timeline.sort((a, b) => b.sortTimestamp - a.sortTimestamp);
}

interface LabResultCardProps {
    result: LabResult;
    isExpanded: boolean;
    onToggle: () => void;
}

function LabResultCard({ result, isExpanded, onToggle }: LabResultCardProps) {
    const sourceLabel = getResultSourceLabel(result.source_system);
    return (
        <div className="km-card km-fade" style={{ marginBottom: 16 }}>
            <div style={{ padding: 14 }}>
                <div 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    onClick={onToggle}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ padding: 8, background: 'var(--km-s2)', borderRadius: 8, flexShrink: 0, border: '1px solid var(--km-b)' }}>
                            <TestTube size={18} style={{ color: 'var(--km-t)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--km-t)' }}>{result.test_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--km-tm)' }}>
                                {result.sample_source || 'Sample type N/A'} • {formatDate(result.screening_date)}
                            </div>
                            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: result.source_system === 'junction' ? 'rgba(56,189,248,.14)' : 'rgba(148,163,184,.14)', color: 'var(--km-t)' }}>
                                    Source: {sourceLabel}
                                </span>
                                {result.result_interpretation && (
                                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'rgba(148,163,184,.14)', color: 'var(--km-t)' }}>
                                        Interpretation: {result.result_interpretation}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, ...getResultValueStyle(result.test_result) }}>
                                {result.test_result} {result.test_result_units}
                            </div>
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Report Date</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(result.report_date)}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sample Source</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{result.sample_source || 'N/A'}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Test to Treat</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{result.test_to_treat ? 'Yes' : 'No'}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submission Status</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{result.submission_status || 'N/A'}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 4, textTransform: 'uppercase' }}>Source</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{sourceLabel}</div>
                            </div>
                            {result.external_order_id && (
                                <div style={{ flex: 1, minWidth: '40%' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 4, textTransform: 'uppercase' }}>External Order ID</div>
                                    <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{result.external_order_id}</div>
                                </div>
                            )}
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
    return (
        <div className="km-card km-fade" style={{ marginBottom: 16 }}>
            <div style={{ padding: 14 }}>
                <div 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    onClick={onToggle}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ padding: 8, background: 'var(--km-pup)', borderRadius: 8, flexShrink: 0, border: '1px solid rgba(167,139,250,0.2)' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {getSubmissionStatusIcon(submission.submission_status)}
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: 999,
                                    ...getSubmissionStatusBadgeStyle(submission.submission_status),
                                }}
                            >
                                {submission.submission_status || 'Unknown'}
                            </span>
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Test to Treat</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{submission.test_to_treat ? 'Yes' : 'No'}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Master ID</div>
                                <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{submission.master_id || 'N/A'}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Beluga Visit ID</div>
                                <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{submission.beluga_visit_id || 'N/A'}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: '40%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-tm)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submitted At</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(submission.submitted_at)}</div>
                            </div>
                        </div>
                        
                        {submission.lab_results.length > 0 && (
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Lab Results</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {submission.lab_results.map((result) => (
                                        <div key={result.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--km-s2)', borderRadius: 8, border: '1px solid var(--km-b)' }}>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{result.test_name}</span>
                                            <span style={{ fontSize: 13 }}>{result.test_result} {result.test_result_units}</span>
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
            
            setLabResults(results);
            setLabSubmissions(submissions);
        } catch (err) {
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
            <p className="km-page-title km-fade" style={{ fontFamily: "'Playfair Display', serif", fontSize: 32 }}>Labs</p>
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
            
            <div className="km-tabs km-fade" style={{ marginBottom: 16 }}>
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
                <div className="km-fade">
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
                                : "You don't have any lab results yet. When a lab result is synced from Junction, it will appear here with the source shown."}
                        </div>
                    </div>
                </div>
                    )}
                </div>
            )}

            {activeTab === 'submissions' && (
                <div className="km-fade">
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
                                : "You don't have any lab submissions yet. Requisition and tracking links will appear here when available."}
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
