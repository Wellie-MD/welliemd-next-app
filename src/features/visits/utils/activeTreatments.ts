import type { Visit } from "@/features/visits/services/visit.service";

export const PAID_ORDER_STATUSES = [
  "processing",
  "visit_pending",
  "consult_scheduled",
  "consult_rescheduled",
  "no_show",
  "referred",
  "prescribed",
  "billing_pending",
  "rx_sent",
  "shipped",
];

const INACTIVE_VISIT_STATUSES = ["completed", "cancelled"];

function normalizeTreatmentKey(value?: string | null): string {
  const compact = (value || "")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/(followup|onboarding|questionnaire|template|session)$/g, "");

  return compact;
}

export function getTreatmentName(visit: Visit): string {
  if (visit.assigned_template?.treatment_type) {
    return visit.assigned_template.treatment_type;
  }
  if (visit.assigned_template?.name) {
    return visit.assigned_template.name;
  }

  return visit.visit_type
    .replace(/followup$/i, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function getTreatmentStartedAt(visit: Visit): string | null {
  return visit.episode_started_at || visit.created_at || null;
}

export function isPaidActiveVisit(visit: Visit): boolean {
  const visitStatus = visit.status.toLowerCase();
  const orderStatus = visit.order_status?.toLowerCase();

  return (
    !INACTIVE_VISIT_STATUSES.includes(visitStatus) &&
    !!orderStatus &&
    PAID_ORDER_STATUSES.includes(orderStatus)
  );
}

function getActiveTreatmentDedupeKey(visit: Visit): string {
  if (visit.episode_id) {
    return `episode:${visit.episode_id}`;
  }

  const treatmentKey = normalizeTreatmentKey(
    visit.treatment_key ||
      visit.assigned_template?.treatment_type ||
      visit.assigned_template?.name ||
      visit.visit_type
  );

  return treatmentKey ? `treatment:${treatmentKey}` : `visit:${visit.id}`;
}

function getVisitSortTime(visit: Visit): number {
  return new Date(visit.created_at || visit.submitted_at || 0).getTime();
}

export function getActiveTreatmentVisits(visits: Visit[]): Visit[] {
  const latestFirst = visits
    .filter(isPaidActiveVisit)
    .slice()
    .sort((a, b) => getVisitSortTime(b) - getVisitSortTime(a));

  const seen = new Set<string>();
  return latestFirst.filter((visit) => {
    const key = getActiveTreatmentDedupeKey(visit);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
