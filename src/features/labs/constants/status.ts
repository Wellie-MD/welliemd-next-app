export const LAB_STATUS_LABELS: Record<string, string> = {
  in_process: "In Process",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  completed: "Completed",
  canceled: "Canceled",
  cancelled: "Canceled",
  requisition_created: "Requisition Created",
  appointment_pending: "Appointment Pending",
  appointment_scheduled: "Appointment Scheduled",
  sample_collected: "Sample Collected",
  at_lab: "At Lab",
  partial_results: "Partial Results",
  results_ready: "Results Ready",
  junction_auth_failed: "Junction Auth Failed",
  junction_failed_auth_voided: "Junction Auth Failed",
};

export const humanizeLabStatus = (value?: string) => {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const key = raw.toLowerCase().replace(/[\s.-]+/g, "_");
  if (LAB_STATUS_LABELS[key]) return LAB_STATUS_LABELS[key];
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const normalizeLabFilterValue = (value: string) => humanizeLabStatus(value).toLowerCase();
