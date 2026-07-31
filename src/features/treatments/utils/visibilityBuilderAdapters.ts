import {
  createDefaultVisibilityGroup,
  DERIVED_BMI_ID,
  type VisibilityCondition,
  type VisibilityGroup,
} from "@/components/questionnaires/VisibilityRuleBuilder";
import type { VisibilityRule, VisibilityRuleGroup } from "@/features/treatments/types";

const isMultiValueOperator = (operator: VisibilityRule["operator"]): boolean =>
  operator === "in" || operator === "not_in";

const isBetweenOperator = (operator: VisibilityRule["operator"]): boolean =>
  operator === "between";

export const PATIENT_PROFILE_SEX_ID = "__patient_profile_sex__";
export const PATIENT_PROFILE_AGE_ID = "__patient_profile_age__";

const normalizeRuleValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (value === null || value === undefined) return [];
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
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
            : rule.questionId,
        question_type: rule.question_type,
        operator: rule.operator,
        value: isBetweenOperator(rule.operator) || isMultiValueOperator(rule.operator)
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

    let value: string;
    if (Array.isArray(child.value)) {
      if (isBetweenOperator(child.operator) && child.value.length === 2) {
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
      question_type: child.question_type,
      operator: child.operator,
      value,
      ...(isPatientProfileSex || isPatientProfileAge
        ? {
            source: "patient_profile" as const,
            field: isPatientProfileSex ? "sex" : "age",
            questionId: child.question_id,
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
