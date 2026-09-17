export const sanitizeTreatmentSlugDraft = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-");

export const normalizeTreatmentSlug = (value: string) =>
  sanitizeTreatmentSlugDraft(value.trim())
    .replace(/^-|-$/g, "");
