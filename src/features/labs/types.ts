import type { Biomarker, LabOrder } from "@/features/labs/api"

export interface LabResultRow {
  biomarker: string
  result: string
  units: string
  reference_range: string
  flag: string
  interpretation: string
  collected_at: string | null
  reported_at: string | null
  min_range_value: number | null
  max_range_value: number | null
}

export interface LabOrderTimelineSnapshot {
  ordered: string
  requisition: string
  appointment_pending: string
  appointment_scheduled: string
  sample_collected: string
  at_lab: string
  results: string
}

export type LabOrderView = LabOrder & {
  product_name: string
  pharmacy_display: string
  orderTotal: string
  price: number
  status: string
  resultsReady: boolean
  resultsAvailable: boolean
  resultPdfAvailable: boolean
  biomarkers: LabResultRow[]
  panelBiomarkers: Biomarker[]
  requisitionAvailable: boolean
  sampleId: string
  physicianName: string
  physicianNpi: string
  expectedResultByDate: string | null
  worstCaseResultByDate: string | null
  timeline: LabOrderTimelineSnapshot
  lifecycle_events: Array<Record<string, unknown>>
  result_access_message: string | null
}
