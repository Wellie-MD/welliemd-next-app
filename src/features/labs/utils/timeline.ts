/**
 * Timeline normalisation and event helpers for standalone lab submissions.
 * Converts raw webhook/lifecycle events into a sorted, deduplicated TimelineItem[].
 */
import type { LabSubmission } from '../api/index';
import type { TimelineAction, TimelineItem } from './types';

function toSafeUrl(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getEventType(event: Record<string, any>): string {
  return (event.event_type || event.event || event.type || event.name || '').toUpperCase();
}

function getEventTimestamp(event: Record<string, any>): string | null {
  return event.occurred_at || event.created_at || event.timestamp || null;
}

function getEventTitle(event: Record<string, any>): string {
  if (event.title) return event.title;
  const eventType = getEventType(event);
  if (eventType === 'LAB_ORDER_REQUISITION_CREATED') return 'In-Person Lab Requisition Ready';
  if (eventType.length > 0)
    return eventType.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  return 'Lab Update';
}

function getEventDescription(event: Record<string, any>): string {
  if (event.description) return event.description;
  const eventType = getEventType(event);
  if (eventType === 'LAB_ORDER_RESULTS') {
    return event.payload?.resultSummary || event.payload?.testResult || 'Lab results were posted.';
  }
  if (
    eventType === 'LAB_ORDER_SHIPPED_TO_PATIENT' ||
    eventType === 'LAB_ORDER_SHIPPED_TO_LAB'
  ) {
    const carrier = event.payload?.carrier || event.payload?.info?.carrier;
    const tracking =
      event.payload?.trackingNumber || event.payload?.tracking || event.payload?.info?.tracking;
    if (carrier && tracking) return `Carrier: ${carrier} • Tracking: ${tracking}`;
    if (carrier) return `Carrier: ${carrier}`;
    if (tracking) return `Tracking: ${tracking}`;
  }
  return event.status ? `Status: ${event.status}` : 'Lab update received.';
}

function eventActions(event: Record<string, any>): TimelineAction[] {
  const actions: TimelineAction[] = [];
  const payload = event.payload || {};

  const rawLabReqPdf = payload.labReqPdf;
  const requisitionFromBase64 =
    rawLabReqPdf && !rawLabReqPdf.startsWith('http') && !rawLabReqPdf.startsWith('data:')
      ? `data:application/pdf;base64,${rawLabReqPdf}`
      : rawLabReqPdf;

  const requisitionUrl =
    toSafeUrl(event.requisition_pdf_url) ||
    toSafeUrl(event.requisition_url) ||
    toSafeUrl(event.requisition_link) ||
    toSafeUrl(payload.requisitionPdfUrl) ||
    toSafeUrl(requisitionFromBase64);
  const bookingUrl =
    toSafeUrl(event.booking_link) ||
    toSafeUrl(event.booking_url) ||
    toSafeUrl(event.result_booking_link) ||
    toSafeUrl(event.result_booking_url) ||
    toSafeUrl(payload.resultBookingLink) ||
    toSafeUrl(payload.bookingLink) ||
    toSafeUrl(payload.booking_url);
  const trackingUrl =
    toSafeUrl(event.tracking_url) ||
    toSafeUrl(event.tracking_link) ||
    toSafeUrl(event.tracking_link_url) ||
    toSafeUrl(payload.trackingUrl) ||
    toSafeUrl(payload.info?.trackingUrl);

  if (requisitionUrl) actions.push({ label: 'Download Requisition', url: requisitionUrl });
  if (bookingUrl) actions.push({ label: 'Book Appointment', url: bookingUrl });
  if (trackingUrl) actions.push({ label: 'Track Shipment', url: trackingUrl });

  return actions;
}

export function normalizeTimeline(submission: LabSubmission): TimelineItem[] {
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

    const eventId = typeof event.id === 'string' ? event.id : '';
    const fallbackOccurredAt = typeof submission.created_at === 'string' ? submission.created_at : '';
    const timestamp = occurredAt ? Date.parse(occurredAt) : Date.parse(fallbackOccurredAt);
    timeline.push({
      id: eventId || `${submission.id}-event-${index}`,
      title: getEventTitle(event),
      description: getEventDescription(event),
      occurredAt: occurredAt || fallbackOccurredAt,
      sortTimestamp: Number.isFinite(timestamp) ? timestamp : 0,
      sortOrder: 5,
      actions: eventActions(event),
    });
  });

  // Surface requisition / booking links from submission root if not already in events
  const existingActionLabels = new Set(
    timeline.flatMap((item) => item.actions.map((a) => a.label))
  );
  const submissionActions: TimelineAction[] = [];
  const reqUrl = toSafeUrl(submission.requisition_pdf_url);
  const bookUrl = toSafeUrl(submission.booking_link) || toSafeUrl(submission.booking_url);
  if (reqUrl && !existingActionLabels.has('Download Requisition'))
    submissionActions.push({ label: 'Download Requisition', url: reqUrl });
  if (bookUrl && !existingActionLabels.has('Book Appointment'))
    submissionActions.push({ label: 'Book Appointment', url: bookUrl });

  if (submissionActions.length > 0) {
    timeline.push({
      id: `${submission.id}-links`,
      title: 'Lab Order Links',
      description: 'Quick access to requisition and booking resources.',
      occurredAt: submission.created_at,
      sortTimestamp: Date.parse(submission.created_at),
      sortOrder: 100,
      actions: submissionActions,
    });
  }

  return timeline.sort((a, b) => b.sortTimestamp - a.sortTimestamp);
}
