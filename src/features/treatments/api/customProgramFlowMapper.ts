import type {
  CustomProgram,
  CustomProgramBuilderStageItem,
  CustomProgramFlowItem,
} from "@/features/treatments/types";
import { normalizeCustomProgramSlug } from "@/features/treatments/custom-programs/utils/customProgramSlug";

type CustomProgramApiFlowItem = Partial<
  CustomProgramFlowItem & CustomProgramBuilderStageItem
> & {
  id: string;
  kind: CustomProgramFlowItem["kind"];
  source?: string;
  source_id?: string;
  is_locked?: boolean;
  metadata?: Record<string, unknown>;
  question_kind?: string;
  answer_options?: string[];
  choices?: string[];
  choice_count?: number;
  visibility_rule?: Record<string, unknown>;
  visibility_rules?: Record<string, unknown>;
};

type MappedBuilderQuestion = CustomProgramBuilderStageItem & {
  __apiFlowItem?: CustomProgramApiFlowItem;
};

export type MappedCustomProgram = CustomProgram & {
  __apiFlowItems?: CustomProgramApiFlowItem[];
};

export type CustomProgramPatch = Partial<CustomProgram> & {
  __apiFlowItems?: CustomProgramApiFlowItem[];
};

export type CustomProgramApiRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: CustomProgram["status"];
  audience: CustomProgram["audience"];
  min_age: number;
  max_age?: number | null;
  included_program_ids: string[];
  section_ids: string[];
  consent_ids: string[];
  checkout_options: CustomProgram["checkoutOptions"];
  flow_items: CustomProgramApiFlowItem[];
  visit_type?: string | null;
  onboarding_name?: string;
  question_count?: number;
  runtime_summary?: {
    status: "ready" | "republish_required";
    schema_version: number;
    release_id: string;
    release_version: number;
    effective_question_count: number | null;
    screening_question_count: number;
    routing_question_count: number;
    common_question_count: number;
    consent_count: number;
    checkout_question_count: number;
    product_count: number;
    medicine_count: number;
    supply_count: number;
    lab_count: number;
    program_count: number;
  } | null;
  icon?: string;
  icon_bg?: string;
  icon_color?: string;
  tags?: string[];
  is_multi?: boolean;
  created_at?: string;
  updated_at?: string;
};

const currentDateStamp = () => new Date().toISOString().split("T")[0];

const isBuilderQuestionFlowItem = (item: CustomProgramApiRecord["flow_items"][number]) =>
  item.kind === "routing_question" || item.kind === "question";

const mapBuilderQuestionFromFlowItem = (
  item: CustomProgramApiRecord["flow_items"][number]
): MappedBuilderQuestion => {
  const metadata = item.metadata || {};
  const sources = [item.source, metadata.source]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  const isClientQuestion = sources.includes("client") && !sources.some((source) => source !== "client");
  const title = item.title || String(metadata.title || metadata.text || "");
  const subtitle = item.subtitle || String(metadata.subtitle || "");
  const questionKind =
    item.questionKind ||
    item.question_kind ||
    String(metadata.questionKind || metadata.question_kind || "single_choice");
  const answerOptions =
    item.answerOptions ||
    item.answer_options ||
    item.choices ||
    (Array.isArray(metadata.answerOptions)
      ? metadata.answerOptions.map(String)
      : Array.isArray(metadata.answer_options)
        ? metadata.answer_options.map(String)
        : []);
  const choiceCount = item.choiceCount ?? item.choice_count ?? (answerOptions.length || undefined);
  const required =
    item.required ??
    (metadata.required === undefined ? true : Boolean(metadata.required));

  return {
    id: item.id,
    kind: "question",
    title,
    subtitle,
    source: isClientQuestion ? "client" : "admin",
    locked: isClientQuestion
      ? item.locked ?? item.is_locked ?? Boolean(metadata.is_locked)
      : true,
    required,
    questionKind: questionKind as CustomProgramBuilderStageItem["questionKind"],
    choiceCount,
    answerOptions,
    treatmentTypeKey: item.treatmentTypeKey,
    sourceId: item.sourceId || item.source_id || String(metadata.source_id || "") || undefined,
    __apiFlowItem: item,
  };
};

const mapBuilderTreatmentOptionFromFlowItem = (
  item: CustomProgramApiRecord["flow_items"][number]
): CustomProgramBuilderStageItem => ({
  id: item.id,
  kind: "program",
  title: item.title,
  subtitle: item.subtitle || "",
  source: item.source || "welliemd",
  locked: item.locked ?? true,
  required: item.required ?? true,
  treatmentTypeKey: item.treatmentTypeKey,
  sourceId: item.sourceId,
});

const mapBuilderSectionFromFlowItem = (
  item: CustomProgramApiRecord["flow_items"][number]
): CustomProgramBuilderStageItem => ({
  id: item.id,
  kind: "section",
  title: item.title,
  subtitle: item.subtitle || "Reusable section fields.",
  source: item.source || "welliemd",
  locked: item.locked ?? true,
  required: item.required ?? true,
  treatmentTypeKey: item.treatmentTypeKey,
  sourceId: item.sourceId,
});

export const mapCustomProgramFromApi = (
  record: CustomProgramApiRecord,
): MappedCustomProgram => {
  const flowItems = record.flow_items || [];

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description || "",
    status: record.status,
    audience: record.audience,
    minAge: record.min_age,
    maxAge: record.max_age ?? undefined,
    includedProgramIds: record.included_program_ids || [],
    sectionIds: record.section_ids || [],
    consentIds: record.consent_ids || [],
    checkoutOptions: record.checkout_options || [],
    flowItems: flowItems.filter((item) => !isBuilderQuestionFlowItem(item)) as CustomProgramFlowItem[],
    updatedAt: record.updated_at?.split("T")[0] || currentDateStamp(),
    slugOverride: null,
    visitType: record.visit_type ?? null,
    onboardingName: record.onboarding_name || "",
    questionCount: record.question_count || 0,
    runtimeSummary: record.runtime_summary ? {
      status: record.runtime_summary.status,
      schemaVersion: record.runtime_summary.schema_version,
      releaseId: record.runtime_summary.release_id,
      releaseVersion: record.runtime_summary.release_version,
      effectiveQuestionCount: record.runtime_summary.effective_question_count,
      screeningQuestionCount: record.runtime_summary.screening_question_count,
      routingQuestionCount: record.runtime_summary.routing_question_count,
      commonQuestionCount: record.runtime_summary.common_question_count,
      consentCount: record.runtime_summary.consent_count,
      checkoutQuestionCount: record.runtime_summary.checkout_question_count,
      productCount: record.runtime_summary.product_count,
      medicineCount: record.runtime_summary.medicine_count,
      supplyCount: record.runtime_summary.supply_count,
      labCount: record.runtime_summary.lab_count,
      programCount: record.runtime_summary.program_count,
    } : null,
    icon: record.icon || undefined,
    iconBg: record.icon_bg || undefined,
    iconColor: record.icon_color || undefined,
    tags: record.tags || [],
    isMulti: record.is_multi ?? false,
    builderQuestions: flowItems.filter(isBuilderQuestionFlowItem).map(mapBuilderQuestionFromFlowItem),
    builderSections: flowItems
      .filter((item) => item.kind === "section")
      .map(mapBuilderSectionFromFlowItem),
    builderTreatmentOptions: flowItems
      .filter((item) => item.kind === "program")
      .map(mapBuilderTreatmentOptionFromFlowItem),
    __apiFlowItems: flowItems,
  };
};

const mapBuilderQuestionToFlowItem = (
  question: CustomProgramBuilderStageItem,
): CustomProgramApiRecord["flow_items"][number] => {
  const mappedQuestion = question as MappedBuilderQuestion;
  if (mappedQuestion.source !== "client" && mappedQuestion.__apiFlowItem) {
    return mappedQuestion.__apiFlowItem;
  }

  return {
    id: question.id,
    kind: "routing_question",
    title: question.title,
    subtitle: question.subtitle || "",
    locked: question.locked,
    source: question.source,
    required: question.required,
    questionKind: question.questionKind,
    choiceCount: question.choiceCount,
    answerOptions: question.answerOptions || [],
    treatmentTypeKey: question.treatmentTypeKey,
    sourceId: question.sourceId,
  };
};

const flowItemKey = (item: CustomProgramApiFlowItem | CustomProgramFlowItem) =>
  item.id || item.sourceId || item.source_id || "";

const isExplicitClientFlowItem = (item: CustomProgramApiFlowItem) => {
  const metadata = item.metadata || {};
  return String(item.source || metadata.source || "").trim().toLowerCase() === "client";
};

const flowItemStage = (item: CustomProgramApiFlowItem) => {
  switch (item.kind) {
    case "authentication": return 0;
    case "routing_question":
    case "question":
    case "section":
    case "section_field": return 1;
    case "program": return 2;
    case "consent": return 3;
    case "checkout": return 4;
    default: return 1;
  }
};

const insertNewClientQuestionsBeforeLaterStage = (
  flowItems: CustomProgramApiRecord["flow_items"],
  newQuestions: CustomProgramApiRecord["flow_items"],
) => {
  if (!newQuestions.length) return flowItems;
  const insertionIndex = flowItems.findIndex((item) => flowItemStage(item) > 1);
  const index = insertionIndex === -1 ? flowItems.length : insertionIndex;
  return [...flowItems.slice(0, index), ...newQuestions, ...flowItems.slice(index)];
};

const mapCustomProgramFlowItemsToPatch = (
  program: CustomProgramPatch,
): CustomProgramApiRecord["flow_items"] => {
  const builderQuestions = program.builderQuestions || [];
  const originalFlowItems = (program as Partial<MappedCustomProgram>).__apiFlowItems;

  if (!originalFlowItems) {
    const fallbackFlowItems = program.flowItems || [];
    const existingQuestionItems = fallbackFlowItems.filter(isBuilderQuestionFlowItem);
    const nonQuestionFlowItems = fallbackFlowItems.filter(
      (item) => !isBuilderQuestionFlowItem(item),
    );
    const fallbackQuestions = builderQuestions.length
      ? builderQuestions.map(mapBuilderQuestionToFlowItem)
      : existingQuestionItems;

    return insertNewClientQuestionsBeforeLaterStage(
      nonQuestionFlowItems,
      fallbackQuestions,
    );
  }

  const questionsById = new Map(builderQuestions.map((question) => [question.id, question]));
  const originalQuestionIds = new Set<string>();
  const flowItems: CustomProgramApiRecord["flow_items"] = [];

  for (const originalItem of originalFlowItems) {
    const key = flowItemKey(originalItem);
    if (isBuilderQuestionFlowItem(originalItem)) {
      if (key) originalQuestionIds.add(key);
      const currentQuestion = key ? questionsById.get(key) : undefined;
      if (currentQuestion) {
        flowItems.push(mapBuilderQuestionToFlowItem(currentQuestion));
      } else if (!isExplicitClientFlowItem(originalItem)) {
        flowItems.push(originalItem);
      }
      continue;
    }

    const currentFlowItem = key
      ? (program.flowItems || []).find((item) => flowItemKey(item) === key)
      : undefined;
    flowItems.push(currentFlowItem || originalItem);
  }

  const newClientQuestions = builderQuestions
    .filter((question) => !originalQuestionIds.has(question.id))
    .map(mapBuilderQuestionToFlowItem);
  return insertNewClientQuestionsBeforeLaterStage(flowItems, newClientQuestions);
};

export const mapCustomProgramToPatchPayload = (program: CustomProgramPatch) => ({
  ...(program.name !== undefined ? { name: program.name } : {}),
  ...(program.slug !== undefined ? { slug: normalizeCustomProgramSlug(program.slug) } : {}),
  ...(program.description !== undefined ? { description: program.description } : {}),
  ...(program.status !== undefined ? { status: program.status } : {}),
  ...(program.audience !== undefined ? { audience: program.audience } : {}),
  ...(program.minAge !== undefined ? { min_age: program.minAge } : {}),
  ...(program.maxAge !== undefined ? { max_age: program.maxAge ?? null } : {}),
  ...(program.includedProgramIds !== undefined ? { included_program_ids: program.includedProgramIds } : {}),
  ...(program.sectionIds !== undefined ? { section_ids: program.sectionIds } : {}),
  ...(program.consentIds !== undefined ? { consent_ids: program.consentIds } : {}),
  ...(program.checkoutOptions !== undefined ? { checkout_options: program.checkoutOptions } : {}),
  ...(program.flowItems !== undefined || program.builderQuestions !== undefined
    ? { flow_items: mapCustomProgramFlowItemsToPatch(program) }
    : {}),
  ...(program.visitType !== undefined ? { visit_type: program.visitType ?? null } : {}),
  ...(program.onboardingName !== undefined ? { onboarding_name: program.onboardingName } : {}),
  ...(program.questionCount !== undefined ? { question_count: program.questionCount } : {}),
  ...(program.icon !== undefined ? { icon: program.icon || "" } : {}),
  ...(program.iconBg !== undefined ? { icon_bg: program.iconBg || "" } : {}),
  ...(program.iconColor !== undefined ? { icon_color: program.iconColor || "" } : {}),
  ...(program.tags !== undefined ? { tags: program.tags || [] } : {}),
  ...(program.isMulti !== undefined ? { is_multi: program.isMulti } : {}),
});
