export const extractLabResultRows = (result: any) => {
  if (!result) return [];
  const maybeRows =
    (Array.isArray(result.biomarkers) && result.biomarkers) ||
    (Array.isArray(result.result?.biomarkers) && result.result.biomarkers) ||
    (Array.isArray(result.result?.results) && result.result.results) ||
    (Array.isArray(result.results) && result.results) ||
    (Array.isArray(result.items) && result.items) ||
    [];
  return maybeRows.map((row: any, i: number) => ({
    id: row.id || `row-${i}`,
    name: row.name || row.biomarker || row.test_name || "",
    result: row.result || row.value || "",
    units: row.units || row.unit || "",
    reference_range: row.reference_range || row.referenceRange || "",
    flag: row.flag || row.interpretation || "normal",
  }));
};
