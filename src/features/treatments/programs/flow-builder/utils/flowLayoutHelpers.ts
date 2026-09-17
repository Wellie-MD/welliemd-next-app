import type { ProgramQuestion, VisibilityRuleGroup } from "../../../types";
import type { ProgramCheckoutProduct } from "../../../types/checkout";
import type { LayoutBox, LayoutType, ProductSource } from "./flowTypes";

export type VisibilityEdgeRule = {
  questionId: string;
  operator?: string;
  value: string;
};

export const NODE_WIDTHS: Record<LayoutType, number> = {
  start: 140,
  auth: 140,
  question: 300,
  section: 140,
  consent: 300,
  checkout: 140,
  product: 200,
  end: 140,
};

export const BASE_HEIGHTS: Record<LayoutType, number> = {
  start: 58,
  auth: 66,
  question: 116,
  section: 66,
  consent: 156,
  checkout: 66,
  product: 74,
  end: 58,
};

export const SPINE_X = 190;
export const SPINE_GAP_Y = 34;
export const ROW_GAP_Y = 34;
export const BRANCH_GAP_X = 92;
export const BRANCH_GAP_Y = 42;
export const PRODUCT_GAP_Y = 10;
export const CHOICE_ROW_HEIGHT = 34;
export const MAX_VISIBLE_CHOICES = 5;
export const OVERFLOW_ROW_HEIGHT = 18;
export const QUESTION_HEADER_OFFSET_Y = 70;
export const TARGET_HANDLE_OFFSET_Y = 36;
export const MAX_BRANCH_DEPTH = 5;
export const TOP_PADDING = 22;
export const PRODUCT_STACK_GAP_X = 230;
export const RETURN_LANE_GAP_X = 52;

export const branchCenterX = (depth: number) =>
  SPINE_X + NODE_WIDTHS.question / 2 + BRANCH_GAP_X + NODE_WIDTHS.question / 2 + (depth - 1) * (NODE_WIDTHS.question + BRANCH_GAP_X);

export const productCenterX = (branchDepth = 2) =>
  SPINE_X +
  NODE_WIDTHS.question / 2 +
  PRODUCT_STACK_GAP_X +
  NODE_WIDTHS.product / 2 +
  (branchDepth - 1) * (NODE_WIDTHS.question + BRANCH_GAP_X);

export const collectVisibilityRules = (group?: VisibilityRuleGroup): VisibilityEdgeRule[] => {
  if (!group) return [];

  const ownRules = (group.rules || []).flatMap((rule) => {
    if (!rule.questionId) return [];
    const values = Array.isArray(rule.value) ? rule.value : [rule.value];
    return values
      .filter((value): value is string => Boolean(value))
      .map((value) => ({
        questionId: rule.questionId,
        operator: rule.operator,
        value,
      }));
  });

  const subgroupRules = (group.subgroups || []).flatMap(collectVisibilityRules);
  return [...ownRules, ...subgroupRules];
};

export const hasVisibilityRules = (question: ProgramQuestion): boolean =>
  Boolean(question.visibilityRule?.questionId || collectVisibilityRules(question.visibilityRuleGroup).length > 0);

export const getParentQuestionId = (question: ProgramQuestion): string | null => {
  if (question.visibilityRule?.questionId) return question.visibilityRule.questionId;
  const rules = collectVisibilityRules(question.visibilityRuleGroup);
  return rules.length > 0 ? rules[0].questionId : null;
};

export const getFirstTriggerValue = (question: ProgramQuestion): string => {
  if (question.visibilityRule?.value) return question.visibilityRule.value;
  const rules = collectVisibilityRules(question.visibilityRuleGroup);
  return rules.find((rule) => Boolean(rule.value))?.value || "";
};

export const safeChoiceHandleValue = (value: string) => encodeURIComponent(value);

export const unsafeChoiceHandleValue = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const choiceHandleId = (value: string) => `choice-${safeChoiceHandleValue(value)}`;

export const choiceOffsetY = (question: ProgramQuestion, value: string): number => {
  const rawIndex = (question.choices || []).findIndex((choice) => choice === value);
  const index = rawIndex < 0 ? 0 : Math.min(rawIndex, MAX_VISIBLE_CHOICES - 1);
  return QUESTION_HEADER_OFFSET_Y + index * CHOICE_ROW_HEIGHT + CHOICE_ROW_HEIGHT / 2;
};

export const triggerHandleId = (question: ProgramQuestion | undefined, value: string): string => {
  if (!question || !value || question.kind === "consent") return "right";
  const index = (question.choices || []).findIndex((choice) => choice === value);
  if (index < 0 || index >= MAX_VISIBLE_CHOICES) return "right";
  return choiceHandleId(value);
};

export const getProductSource = (
  product: ProgramCheckoutProduct,
  questionsById?: Map<string, ProgramQuestion>
): ProductSource | null => {
  const rules = collectVisibilityRules(product.visibilityRules);
  if (!rules.length) return null;

  const searchableText = (rule: VisibilityEdgeRule) => {
    const question = questionsById?.get(rule.questionId);
    return `${rule.questionId} ${question?.text || ""} ${question?.kind || ""}`;
  };
  const eligibleRules = rules.filter((rule) => !/photo|upload|image|file/i.test(searchableText(rule)));
  const preferenceRule = eligibleRules.find((rule) =>
    /current|preference|prefer|medication|medicine|treatment/i.test(searchableText(rule))
  );
  const doseRule = eligibleRules.find((rule) => /dose|recent|previous|last|strength/i.test(searchableText(rule)));
  const meaningfulRule = eligibleRules[0];
  const selectedRule = preferenceRule || doseRule || meaningfulRule || rules[0];
  const reason = preferenceRule
    ? "new_patient_preference"
    : doseRule
      ? "recent_dose"
      : "first_meaningful_rule";

  return selectedRule
    ? {
        questionId: selectedRule.questionId,
        value: selectedRule.value,
        extra: Math.max(0, rules.length - 1),
        reason,
      }
    : null;
};

export const centerToPosition = (centerX: number, y: number, type: LayoutType) => ({
  x: centerX - NODE_WIDTHS[type] / 2,
  y,
});

export function nodeHeight(question: ProgramQuestion): number {
  if (question.kind === "section") return BASE_HEIGHTS.section;
  if (question.kind === "consent") return BASE_HEIGHTS.consent;

  const choiceCount = question.choices?.length ?? 0;
  if (!choiceCount) return BASE_HEIGHTS.question;

  const visibleCount = Math.min(choiceCount, MAX_VISIBLE_CHOICES);
  const overflow = choiceCount > MAX_VISIBLE_CHOICES ? OVERFLOW_ROW_HEIGHT : 0;
  return BASE_HEIGHTS.question + visibleCount * CHOICE_ROW_HEIGHT + overflow;
}

export function boxBottom(box: LayoutBox) {
  return box.y + box.height;
}

export function nextSpineNodeId(spineNodeIds: string[], nodeId: string): string {
  const idx = spineNodeIds.indexOf(nodeId);
  return idx >= 0 && spineNodeIds[idx + 1] ? spineNodeIds[idx + 1] : "checkout";
}

export function rootTriggerId(question: ProgramQuestion, triggerOf: Map<string, string>): string | null {
  let parentId = getParentQuestionId(question);
  let guard = 0;
  while (parentId && triggerOf.has(parentId) && guard < 25) {
    parentId = triggerOf.get(parentId) || null;
    guard += 1;
  }
  return parentId;
}
