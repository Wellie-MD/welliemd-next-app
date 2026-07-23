export const junctionMockEnabled = true;

export const mockStandaloneResults = [
  {
    order_id: "LAB-DUMMY-01",
    lab_panel_name: "Dummy Complete Blood Count",
    lab_provider: "Quest Diagnostics",
    collected_at: "2026-07-22T10:00:00Z",
    reported_at: "2026-07-23T08:00:00Z",
    status: "results_ready",
    biomarkers: [
      { biomarker: "Hemoglobin", result: "14.2", units: "g/dL", reference_range: "12.0 - 16.0", flag: "normal" },
      { biomarker: "Platelets", result: "350", units: "K/uL", reference_range: "150 - 450", flag: "normal" }
    ]
  },
  {
    order_id: "LAB-10042",
    lab_panel_name: "Comprehensive Metabolic Panel",
    lab_provider: "Quest Diagnostics",
    collected_at: "2026-07-04T12:15:00Z",
    reported_at: "2026-07-06T13:20:00Z",
    status: "partial_results",
    biomarkers: [
      { biomarker: "Glucose", result: "102", units: "mg/dL", reference_range: "70 - 99", flag: "high" },
      { biomarker: "Creatinine", result: "0.92", units: "mg/dL", reference_range: "0.76 - 1.27", flag: "normal" }
    ]
  },
  {
    order_id: "LAB-10043",
    lab_panel_name: "Lipid Panel",
    lab_provider: "Labcorp",
    collected_at: "2026-07-04T12:15:00Z",
    reported_at: "2026-07-06T13:20:00Z",
    status: "results_ready",
    biomarkers: [
      { biomarker: "Total Cholesterol", result: "244", units: "mg/dL", reference_range: "< 200", flag: "high" },
      { biomarker: "HDL", result: "45", units: "mg/dL", reference_range: "> 40", flag: "normal" }
    ]
  },
  {
    order_id: "LAB-10049",
    lab_panel_name: "Metabolic + Lipids",
    lab_provider: "Quest Diagnostics",
    collected_at: "2026-07-04T12:15:00Z",
    reported_at: "2026-07-06T13:20:00Z",
    status: "critical",
    biomarkers: [
      { biomarker: "Potassium", result: "6.1", units: "mmol/L", reference_range: "3.5 - 5.1", flag: "critical", interpretation: "Critical High" }
    ]
  }
];

export const mockStandaloneSubmissions = [
  {
    id: "LAB-DUMMY-02",
    patient_name: "Sofia Nguyen",
    submission_status: "pending",
    submitted_at: "2026-07-20T11:00:00Z",
    lab_panel_name: "Dummy Urinalysis",
    lab_provider: "Quest Diagnostics",
    collection_method: "walk_in_test",
    collection_method_display: "Walk-in lab draw",
    stage: "requisition_created",
    stage_display: "Requisition ready — book or walk in",
    bucket: "needs_attention",
    requisition_available: true,
    requisition_pdf_url: "mock-url",
    booking_link: "https://questdiagnostics.com/booking",
    lifecycle_events: [
      { title: "Requisition Created", description: "Requisition form is available", occurredAt: "2026-07-20T11:05:00Z" }
    ]
  },
  {
    id: "LAB-10044",
    patient_name: "Nora Patel",
    submission_status: "pending",
    submitted_at: "2026-07-01T15:00:00Z",
    lab_panel_name: "Thyroid Panel",
    lab_provider: "Quest Diagnostics",
    collection_method: "walk_in_test",
    collection_method_display: "Walk-in lab draw",
    stage: "appointment_pending",
    stage_display: "Appointment pending",
    bucket: "needs_attention",
    requisition_available: true,
    requisition_pdf_url: "mock-url",
    booking_link: "https://questdiagnostics.com/booking",
    lifecycle_events: [
      { title: "Requisition Created", description: "Requisition form is available", occurredAt: "2026-07-01T15:05:00Z" }
    ]
  },
  {
    id: "LAB-10046",
    patient_name: "Sofia Nguyen",
    submission_status: "pending",
    submitted_at: "2026-07-01T15:00:00Z",
    lab_panel_name: "Vitamin D Panel",
    lab_provider: "Quest Diagnostics",
    collection_method: "testkit",
    collection_method_display: "At-home test kit",
    stage: "kit_shipped",
    stage_display: "Kit shipped",
    bucket: "in_progress",
    tracking_url: "https://fedex.com/tracking",
    lifecycle_events: [
      { title: "Kit Shipped", description: "Tracking # 1Z99999999", occurredAt: "2026-07-02T10:00:00Z" }
    ]
  }
];
