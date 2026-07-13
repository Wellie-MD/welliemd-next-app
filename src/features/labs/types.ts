import type { LabOrder } from "@/features/labs/api"

export interface LabResultRow {
  biomarker: string
  result: string
  units: string
  reference_range: string
  flag: string
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
  resultsReleased: boolean
  biomarkers: LabResultRow[]
  timeline: LabOrderTimelineSnapshot
  lifecycle_events: Array<Record<string, unknown>>
  result_access_message: string | null
}
