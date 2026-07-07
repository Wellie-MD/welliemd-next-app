export const extractLabResultRows = (result: Record<string, unknown> | null | undefined) => {
  if (!result) return [];
  const maybeRows =
    (Array.isArray(result.biomarkers) && result.biomarkers) ||
    (Array.isArray(result.results) && result.results) ||
    (Array.isArray(result.items) && result.items) ||
    [];
  return maybeRows.map((row: any) => ({
    biomarker: row.biomarker || row.test_name || row.name || "",
    result: row.result || row.value || "",
    units: row.units || row.unit || "",
    reference_range: row.reference_range || row.referenceRange || row.range || "",
    flag: row.flag || row.interpretation || "",
  }));
};
