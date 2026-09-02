import type {
  VisibilityCondition,
  VisibilityGroup,
} from "../../../components/questionnaires/VisibilityRuleBuilder";
import {
  createDefaultVisibilityGroup,
  normalizeVisibilityQuestionId,
} from "../../../components/questionnaires/visibilityRuleValidation";
import type { VisibilityRule, VisibilityRuleGroup } from "../types";

const isMultiValueOperator = (operator: VisibilityRule["operator"]): boolean =>
  operator === "in" || operator === "not_in";

const isBetweenOperator = (operator: VisibilityRule["operator"]): boolean =>
  operator === "between";

const isEmptyOperator = (operator: string): boolean =>
  operator === "is_empty" || operator === "is_not_empty";

export const PATIENT_PROFILE_SEX_ID = "__patient_profile_sex__";
export const PATIENT_PROFILE_AGE_ID = "__patient_profile_age__";

const normalizeRuleValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (value === null || value === undefined) return [];
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
};

const toBuilderOperator = (operator: string): VisibilityCondition["operator"] => {
  if (operator === "eq") return "equals";
  if (operator === "neq") return "not_equals";
  return operator as VisibilityCondition["operator"];
};

const toCanonicalOperator = (operator: string): VisibilityRule["operator"] => {
  if (operator === "equals") return "eq";
  if (operator === "not_equals") return "neq";
  return operator as VisibilityRule["operator"];
};

/** Domain `VisibilityRuleGroup` → shared `VisibilityRuleBuilder` shape. */
export const toBuilderGroup = (
  group: VisibilityRuleGroup | undefined
): VisibilityGroup => {
  if (!group) return createDefaultVisibilityGroup();

  return {
    type: "group",
    operator: group.mode === "nested" ? "AND" : "OR",
    children: [
      ...(group.rules || []).map<VisibilityCondition>((rule) => ({
        type: "condition",
        question_id:
          rule.source === "patient_profile" && rule.field === "sex"
            ? PATIENT_PROFILE_SEX_ID
            : rule.source === "patient_profile" && rule.field === "age"
            ? PATIENT_PROFILE_AGE_ID
            : normalizeVisibilityQuestionId(rule),
        question_type: rule.question_type,
        operator: toBuilderOperator(rule.operator),
        value: isEmptyOperator(rule.operator)
          ? ""
          : isBetweenOperator(rule.operator) || isMultiValueOperator(rule.operator)
          ? normalizeRuleValues(rule.value)
          : normalizeRuleValues(rule.value).join(","),
      })),
      ...(group.subgroups || []).map(toBuilderGroup),
    ],
  };
};

/** Shared `VisibilityRuleBuilder` shape → domain `VisibilityRuleGroup`. */
export const fromBuilderGroup = (group: VisibilityGroup): VisibilityRuleGroup => {
  const rules: VisibilityRule[] = [];
  const subgroups: VisibilityRuleGroup[] = [];

  group.children.forEach((child) => {
    if (child.type === "group") {
      subgroups.push(fromBuilderGroup(child));
      return;
    }

    const canonicalOp = toCanonicalOperator(child.operator);
    let value: string | undefined;

    if (isEmptyOperator(child.operator)) {
      value = undefined;
    } else if (Array.isArray(child.value)) {
      if (isBetweenOperator(canonicalOp) && child.value.length === 2) {
        const [a, b] = child.value.map(Number);
        value = isNaN(a) || isNaN(b)
          ? child.value.join(",")
          : a <= b
            ? `${a},${b}`
            : `${b},${a}`;
      } else {
        value = child.value.join(",");
      }
    } else {
      value = String(child.value || "");
    }

    const isPatientProfileSex = child.question_id === PATIENT_PROFILE_SEX_ID;
    const isPatientProfileAge = child.question_id === PATIENT_PROFILE_AGE_ID;
    rules.push({
      questionId: child.question_id,
      ...(child.question_type ? { question_type: child.question_type } : {}),
      operator: canonicalOp,
      ...(value !== undefined ? { value } : {}),
      source: isPatientProfileSex || isPatientProfileAge ? ("patient_profile" as const) : ("answer" as const),
      ...(isPatientProfileSex || isPatientProfileAge
        ? {
            field: isPatientProfileSex ? "sex" : "age",
          }
        : {}),
    });
  });

  return {
    mode: group.operator === "AND" ? "nested" : "simple",
    rules,
    subgroups,
  };
};
