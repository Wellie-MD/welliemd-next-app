import type { LabResultRow } from "@/features/labs/types"

export const extractLabResultRows = (result: Record<string, unknown> | null | undefined): LabResultRow[] => {
  if (!result) return [];
  const maybeRows =
    (Array.isArray(result.biomarkers) && result.biomarkers) ||
    (Array.isArray(result.results) && result.results) ||
    (Array.isArray(result.items) && result.items) ||
    [];
  return maybeRows.map((row) => {
    const data = typeof row === "object" && row !== null ? row as Record<string, unknown> : {}
    return {
      biomarker: String(data.biomarker || data.test_name || data.name || ""),
      result: String(data.result || data.value || ""),
      units: String(data.units || data.unit || ""),
      reference_range: String(data.reference_range || data.referenceRange || data.range || ""),
      flag: String(data.flag || data.interpretation || ""),
      interpretation: String(data.interpretation || data.flag || ""),
      collected_at: data.collected_at ? String(data.collected_at) : null,
      reported_at: data.reported_at ? String(data.reported_at) : null,
      min_range_value: typeof data.min_range_value === "number" ? data.min_range_value : null,
      max_range_value: typeof data.max_range_value === "number" ? data.max_range_value : null,
    }
  })
};
