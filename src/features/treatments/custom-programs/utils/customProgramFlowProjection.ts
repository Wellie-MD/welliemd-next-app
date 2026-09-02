type SectionFlowItem = {
  id: string;
  kind: "section" | "section_field";
  title?: string;
  subtitle?: string;
  source?: string;
  sourceId?: string;
  source_id?: string;
  locked?: boolean;
  is_locked?: boolean;
  required?: boolean;
  treatmentTypeKey?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Map a persisted section-family flow item to the builder's Stage 1 model.
 *
 * A section_field is deliberately kept as its own kind. It references the
 * parent section through sourceId and the selected reusable field through
 * metadata.mapped_field; collapsing it into "section" would make the UI
 * claim that the whole section is included.
 */
export const mapBuilderSectionFlowItem = (item: SectionFlowItem) => {
  const metadata = item.metadata || {};
  const sourceId = item.sourceId || item.source_id || String(metadata.source_id || "") || undefined;
  const mappedField = String(metadata.mapped_field || "").trim() || undefined;
  const title = item.title || String(metadata.title || metadata.text || "") ||
    (item.kind === "section_field" ? "Section field details unavailable" : "Section details unavailable");
  const dependencyLabel = String(metadata.dependency_label || "").trim();
  const subtitle = item.subtitle || String(metadata.subtitle || "") ||
    (item.kind === "section_field"
      ? (dependencyLabel ? `${dependencyLabel} · selected reusable field` : "Selected reusable field")
      : "Reusable section fields.");

  return {
    id: item.id,
    kind: item.kind,
    title,
    subtitle,
    source: item.source || String(metadata.source || "") || "welliemd",
    locked: item.locked ?? true,
    required: item.required ?? (metadata.required === undefined ? true : Boolean(metadata.required)),
    treatmentTypeKey: item.treatmentTypeKey,
    sourceId,
    ...(mappedField ? { mappedField } : {}),
  };
};

export const mapBuilderSectionsFromFlowItems = (items: SectionFlowItem[]) =>
  items
    .filter((item) => item.kind === "section" || item.kind === "section_field")
    .map(mapBuilderSectionFlowItem);
