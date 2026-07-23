import type { LabOrder, LabOrderDetail } from "@/features/labs/api";

export const junctionMockEnabled =
  String(import.meta.env.VITE_JUNCTION_MOCK || import.meta.env.VITE_ENABLE_JUNCTION_MOCK || "").toLowerCase() === "true";

export const mockLabOrders: LabOrder[] = [
  mockOrder("4f8d8f5d-5b5a-42ec-a40c-1a30bc21a111", "LAB-10042", "Amelia Torres", "Comprehensive Metabolic Panel", "Quest Diagnostics", "testkit", "in_process", "paid", "with_lab", "Partial Results", "partial_results", 129, true),
  mockOrder("30bb5b72-b060-4023-b625-193673cdf222", "LAB-10043", "Marcus Lee", "Lipid Panel", "Labcorp", "walk_in_test", "completed", "paid", "completed", "Results Ready", "results_ready", 89, true),
  mockOrder("90f52d4b-76e6-4c0a-ad8d-3093c3aa3333", "LAB-10044", "Nora Patel", "Thyroid Panel", "Quest Diagnostics", "walk_in_test", "in_process", "paid", "collecting_sample", "Appointment Scheduled", "appointment_scheduled", 75),
  mockOrder("a2177c5e-bb73-45f5-8540-d91173be4444", "LAB-10045", "Caleb Morgan", "CBC with Differential", "BioReference", "at_home_phlebotomy", "in_process", "paid", "collecting_sample", "Appointment Pending", "appointment_pending", 59),
  mockOrder("d8d30237-2473-4fdb-8b6b-143490cc5555", "LAB-10046", "Sofia Nguyen", "Vitamin D Panel", "Quest Diagnostics", "testkit", "in_process", "paid", "collecting_sample", "Kit Shipped", "kit_shipped", 68),
  mockOrder("28ef06d1-439d-493f-a80e-4220f3536666", "LAB-10047", "Ethan Brooks", "Hormone Panel", "Labcorp", "walk_in_test", "in_process", "paid", "received", "Requisition Created", "requisition_created", 149),
  mockOrder("f90a68df-04f6-4077-8080-f7a9a7217777", "LAB-10048", "Maya Iqbal", "Comprehensive Test Panel", "BioReference", "walk_in_test", "failed", "pending", "failed", "Junction Auth Failed", "junction_auth_failed", 20),
  mockOrder("6b7a9759-8861-460d-a491-72d166ae8888", "LAB-10049", "Olivia Chen", "Metabolic + Lipids", "Quest Diagnostics", "at_home_phlebotomy", "completed", "paid", "completed", "Critical Result", "critical", 155, true),
];

function mockOrder(
  id: string,
  displayId: string,
  patient: string,
  panel: string,
  lab: string,
  method: string,
  orderStatus: string,
  payment: string,
  fulfillment: string,
  event: string,
  eventKey: string,
  total: number,
  access = false,
): LabOrder {
  return {
    id,
    display_id: displayId,
    patient_name: patient,
    patient_email: `${patient.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    patient_phone: "+14155550142",
    lab_panel_name: panel,
    lab_provider: lab,
    collection_method: method,
    lab_event: eventKey,
    lab_event_label: event,
    ui_order_status: orderStatus,
    ui_payment_status: payment,
    ui_fulfillment_status: fulfillment,
    ui_lab_event: eventKey,
    ui_lab_event_label: event,
    ui_lab_event_tone: event.includes("Failed") || event.includes("Critical") ? "danger" : "info",
    payment_status: payment,
    order_status: orderStatus,
    results_status: eventKey === "partial_results" ? "partial_results" : eventKey === "critical" || eventKey === "results_ready" ? "results_ready" : "pending",
    total_paid: total,
    created_at: "2026-07-01T15:00:00Z",
    result_access_allowed: access,
  };
}

const biomarkers = [
  { biomarker: "Glucose", result: "102", units: "mg/dL", reference_range: "70 - 99", flag: "High" },
  { biomarker: "Creatinine", result: "0.92", units: "mg/dL", reference_range: "0.76 - 1.27", flag: "Normal" },
  { biomarker: "Total Cholesterol", result: "244", units: "mg/dL", reference_range: "< 200", flag: "High" },
  { biomarker: "Potassium", result: "6.1", units: "mmol/L", reference_range: "3.5 - 5.1", flag: "Critical" },
];

export const mockLabOrderDetail = (orderId: string): LabOrderDetail | null => {
  const order = mockLabOrders.find((item) => item.id === orderId || item.display_id === orderId);
  if (!order) return null;
  
  const method = order.collection_method || "walk_in_test";
  const evts = [];
  evts.push(["evt-1", "Requisition Created", `received.${method}.requisition_created`, "2026-07-01T15:05:00Z"]);
  if (method === "walk_in_test") {
    evts.push(["evt-2", "Appointment Scheduled", `collecting_sample.${method}.appointment_scheduled`, "2026-07-02T16:20:00Z"]);
  } else if (method === "testkit") {
    evts.push(["evt-2", "Kit Shipped", `collecting_sample.${method}.shipped`, "2026-07-02T10:00:00Z"]);
  }
  evts.push(["evt-3", "Sample Collected", `collecting_sample.${method}.draw_completed`, "2026-07-04T12:15:00Z"]);
  if (method === "testkit") {
    evts.push(["evt-4", "At Lab", `sample_with_lab.${method}.delivered_to_lab`, "2026-07-05T09:00:00Z"]);
  }
  if (order.results_status === "partial_results") {
    evts.push(["evt-5", "Partial Results", `sample_with_lab.${method}.partial_results`, "2026-07-06T13:20:00Z"]);
  } else if (order.results_status === "results_ready") {
    evts.push(["evt-6", "Results Ready", `completed.${method}.completed`, "2026-07-07T14:00:00Z"]);
  }

  return {
    order,
    lifecycle_events: evts.map(([id, title, status, occurred_at]) => ({
      id,
      title,
      status,
      event_type: "labtest.order.updated",
      occurred_at,
      created_at: occurred_at,
    })),
    result_access_allowed: Boolean(order.result_access_allowed),
    result_access_message: order.result_access_allowed ? null : "Result sharing is not enabled for this client.",
    result: { biomarkers },
  };
};
