/**
 * Timeline normalisation and event helpers for standalone lab submissions.
 * Converts raw webhook/lifecycle events into a sorted, deduplicated TimelineItem[].
 */
import type { LabSubmission } from '../api/index';
import type { TimelineAction, TimelineItem } from './types';
import { safeLabUrl } from './urls';

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
    safeLabUrl(event.requisition_pdf_url, { allowPdfData: true }) ||
    safeLabUrl(event.requisition_url, { allowPdfData: true }) ||
    safeLabUrl(event.requisition_link, { allowPdfData: true }) ||
    safeLabUrl(payload.requisitionPdfUrl, { allowPdfData: true }) ||
    safeLabUrl(requisitionFromBase64, { allowPdfData: true });
  const bookingUrl =
    safeLabUrl(event.booking_link) ||
    safeLabUrl(event.booking_url) ||
    safeLabUrl(event.result_booking_link) ||
    safeLabUrl(event.result_booking_url) ||
    safeLabUrl(payload.resultBookingLink) ||
    safeLabUrl(payload.bookingLink) ||
    safeLabUrl(payload.booking_url);
  const trackingUrl =
    safeLabUrl(event.tracking_url) ||
    safeLabUrl(event.tracking_link) ||
    safeLabUrl(event.tracking_link_url) ||
    safeLabUrl(payload.trackingUrl) ||
    safeLabUrl(payload.info?.trackingUrl);

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
  const reqUrl = safeLabUrl(submission.requisition_pdf_url, { allowPdfData: true });
  const bookUrl = safeLabUrl(submission.booking_link) || safeLabUrl(submission.booking_url);
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
