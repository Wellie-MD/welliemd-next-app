import type { LabOrder } from "./labs-types";

export const junctionMockEnabled =
  String(import.meta.env.VITE_JUNCTION_MOCK || import.meta.env.VITE_ENABLE_JUNCTION_MOCK || "").toLowerCase() === "true";

const base = {
  client_name: "Kin Meds",
  patient_phone: "+14155550142",
  payment_status: "Paid",
  ui_payment_status: "Paid",
};

export const mockLabOrders: LabOrder[] = [
  mockOrder("LAB-10042", "Amelia Torres", "Comprehensive Metabolic Panel", "Quest Diagnostics", 129, "Partial Results", "At Lab", "Partial Results", "testkit", true),
  mockOrder("LAB-10043", "Marcus Lee", "Lipid Panel", "Labcorp", 89, "Completed", "Results Ready", "Results Ready", "walk_in_test", true),
  mockOrder("LAB-10044", "Nora Patel", "Thyroid Panel", "Quest Diagnostics", 75, "In Process", "Appointment Scheduled", "Appointment Scheduled", "walk_in_test"),
  mockOrder("LAB-10045", "Caleb Morgan", "CBC with Differential", "BioReference", 59, "In Process", "Appointment Pending", "Appointment Pending", "at_home_phlebotomy"),
  mockOrder("LAB-10046", "Sofia Nguyen", "Vitamin D Panel", "Quest Diagnostics", 68, "In Process", "Kit Shipped", "Kit Shipped", "testkit"),
  mockOrder("LAB-10047", "Ethan Brooks", "Hormone Panel", "Labcorp", 149, "In Process", "Requisition Created", "Requisition Created", "walk_in_test"),
  mockOrder("LAB-10048", "Maya Iqbal", "Comprehensive Test Panel", "BioReference", 20, "Failed", "Failed", "Junction Auth Failed", "walk_in_test", false, "Pending"),
  mockOrder("LAB-10049", "Olivia Chen", "Metabolic + Lipids", "Quest Diagnostics", 155, "Completed", "Results Ready", "Critical Result", "at_home_phlebotomy", true),
];

function mockOrder(
  id: string,
  patient: string,
  panel: string,
  lab: string,
  price: number,
  orderStatus: string,
  fulfillment: string,
  event: string,
  method: string,
  resultsReady = false,
  payment = "Paid",
): LabOrder {
  return {
    ...base,
    id,
    patient_name: patient,
    patient_email: `${patient.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    product_name: panel,
    lab_provider: lab,
    collection_method: method,
    price,
    status: orderStatus,
    payment_status: payment,
    visit_status: event,
    fulfillment_status: fulfillment,
    lab_event: event.toLowerCase().replace(/\s+/g, "_"),
    lab_event_label: event,
    ui_order_status: orderStatus,
    ui_payment_status: payment,
    ui_fulfillment_status: fulfillment,
    ui_lab_event: event.toLowerCase().replace(/\s+/g, "_"),
    ui_lab_event_label: event,
    ui_lab_event_tone: event.includes("Failed") || event.includes("Critical") ? "danger" : "info",
    timeline: {
      ordered: "2026-07-01T15:00:00Z",
      requisition_created: "2026-07-01T15:05:00Z",
      appointment_booked: method === "walk_in_test" ? "2026-07-02T16:20:00Z" : "",
      sample_collected: resultsReady || fulfillment === "At Lab" ? "2026-07-04T12:15:00Z" : "",
      at_lab: resultsReady || event === "Partial Results" ? "2026-07-05T09:00:00Z" : "",
      partial_results: event === "Partial Results" ? "2026-07-06T13:20:00Z" : "",
      results: resultsReady ? "2026-07-07T14:00:00Z" : "",
    },
    resultsReady,
  };
}

const resultRows = [
  { biomarker: "Glucose", result: "102", units: "mg/dL", reference_range: "70 - 99", flag: "High" },
  { biomarker: "Creatinine", result: "0.92", units: "mg/dL", reference_range: "0.76 - 1.27", flag: "Normal" },
  { biomarker: "Total Cholesterol", result: "244", units: "mg/dL", reference_range: "< 200", flag: "High" },
  { biomarker: "Potassium", result: "6.1", units: "mmol/L", reference_range: "3.5 - 5.1", flag: "Critical" },
];

export const mockLabOrderResults = (orderId: string) => {
  const order = mockLabOrders.find((order) => order.id === orderId) || mockLabOrders[0];
  const method = order.collection_method || "walk_in_test";
  const events = [];
  events.push({ title: "Requisition Created", status: `received.${method}.requisition_created`, occurred_at: order.timeline?.requisition_created || "2026-07-01T15:05:00Z" });
  if (method === "walk_in_test" && order.timeline?.appointment_booked) {
    events.push({ title: "Appointment Scheduled", status: `collecting_sample.${method}.appointment_scheduled`, occurred_at: order.timeline.appointment_booked });
  } else if (method === "testkit") {
    events.push({ title: "Kit Shipped", status: `collecting_sample.${method}.shipped`, occurred_at: "2026-07-02T10:00:00Z" });
  }
  if (order.timeline?.sample_collected) {
    events.push({ title: "Sample Collected", status: `collecting_sample.${method}.draw_completed`, occurred_at: order.timeline.sample_collected });
  }
  if (method === "testkit" && order.timeline?.at_lab) {
    events.push({ title: "At Lab", status: `sample_with_lab.${method}.delivered_to_lab`, occurred_at: order.timeline.at_lab });
  }
  if (order.timeline?.partial_results) {
    events.push({ title: "Partial Results", status: `sample_with_lab.${method}.partial_results`, occurred_at: order.timeline.partial_results });
  }
  if (order.timeline?.results) {
    events.push({ title: "Results Ready", status: `completed.${method}.completed`, occurred_at: order.timeline.results });
  }

  return {
    order,
    lifecycle_events: events,
    result: { biomarkers: resultRows },
    biomarkers: resultRows,
    artifacts: {
      requisition_available: true,
      result_pdf_available: Boolean(order.resultsReady),
    },
    appointment_booking_link: method === "testkit" ? null : "https://app.junction.com/mock/appointments/" + order.id,
  };
};

export const updateMockLabOrder = (
  orderId: string,
  updates: { status?: string; tracking_number?: string },
) => {
  const order = mockLabOrders.find((item) => item.id === orderId);
  if (!order) return mockLabOrders[0];
  if (updates.status) {
    order.status = updates.status;
    order.ui_order_status = updates.status;
    order.visit_status = updates.status;
    order.lab_event_label = updates.status;
    order.ui_lab_event_label = updates.status;
  }
  if (updates.tracking_number !== undefined) {
    order.tracking_number = updates.tracking_number;
  }
  return order;
};
