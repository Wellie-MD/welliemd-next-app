import type { VisibilityRule, VisibilityRuleGroup } from "@/features/treatments/types";

/**
 * Patient answers keyed by questionId.
 * single_choice / yes_no / text / number / date → string
 * multiple_choice → string[]
 * numeric comparisons support string values that can be coerced to numbers.
 */
export type PatientAnswers = Record<string, string | string[] | number | undefined>;

const isEmptyAnswer = (answer: string | string[] | number | undefined): boolean => {
  if (answer === undefined || answer === null) return true;
  if (Array.isArray(answer)) return answer.length === 0;
  return String(answer).trim() === "";
};

const splitList = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * Evaluate a single condition against the current patient answers.
 * Mirrors the prototype's `_ftEvalRule` condition semantics.
 */
const evaluateRule = (rule: VisibilityRule, answers: PatientAnswers): boolean => {
  const answer = answers[rule.questionId];

  switch (rule.operator) {
    case "equals":
      return Array.isArray(answer)
        ? answer.includes(rule.value)
        : String(answer ?? "") === String(rule.value);
    case "not_equals":
      return Array.isArray(answer)
        ? !answer.includes(rule.value)
        : String(answer ?? "") !== String(rule.value);
    case "contains":
      return Array.isArray(answer)
        ? answer.includes(rule.value)
        : String(answer ?? "").includes(String(rule.value));
    case "not_contains":
      return Array.isArray(answer)
        ? !answer.includes(rule.value)
        : !String(answer ?? "").includes(String(rule.value));
    case "in": {
      const options = splitList(rule.value);
      return Array.isArray(answer)
        ? options.some((option) => answer.includes(String(option)))
        : options.includes(String(answer ?? ""));
    }
    case "not_in": {
      const options = splitList(rule.value);
      return Array.isArray(answer)
        ? !options.some((option) => answer.includes(String(option)))
        : !options.includes(String(answer ?? ""));
    }
    case "gt": {
      const a = Number(answer);
      const b = Number(rule.value);
      if (isNaN(a) || isNaN(b)) return false;
      return a > b;
    }
    case "gte": {
      const a = Number(answer);
      const b = Number(rule.value);
      if (isNaN(a) || isNaN(b)) return false;
      return a >= b;
    }
    case "lt": {
      const a = Number(answer);
      const b = Number(rule.value);
      if (isNaN(a) || isNaN(b)) return false;
      return a < b;
    }
    case "lte": {
      const a = Number(answer);
      const b = Number(rule.value);
      if (isNaN(a) || isNaN(b)) return false;
      return a <= b;
    }
    case "between": {
      const parts = rule.value.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length !== 2) return false;
      const a = Number(answer);
      const min = Number(parts[0]);
      const max = Number(parts[1]);
      if (isNaN(a) || isNaN(min) || isNaN(max)) return false;
      return a >= min && a <= max;
    }
    default:
      return false;
  }
};

/**
 * Evaluate a visibility rule group (with nested subgroups) against the current
 * patient answers. An empty/undefined group is always visible.
 *
 * Group combination follows the persisted model: mode "nested" → AND,
 * mode "simple" → OR (matching `QuestionVisibilityTab`'s builder mapping).
 */
export const evaluateVisibilityGroup = (
  group: VisibilityRuleGroup | undefined,
  answers: PatientAnswers
): boolean => {
  if (!group) return true;

  const ruleResults = (group.rules ?? [])
    .filter((rule) => rule.questionId && rule.operator)
    .map((rule) => evaluateRule(rule, answers));

  const subgroupResults = (group.subgroups ?? []).map((subgroup) =>
    evaluateVisibilityGroup(subgroup, answers)
  );

  const results = [...ruleResults, ...subgroupResults];
  if (results.length === 0) return true;

  return group.mode === "nested"
    ? results.every(Boolean)
    : results.some(Boolean);
};

/** True when the group actually constrains visibility (has at least one rule). */
export const hasActiveVisibilityRules = (
  group: VisibilityRuleGroup | undefined
): boolean => {
  if (!group) return false;
  const ruleCount = (group.rules ?? []).filter((rule) => rule.questionId).length;
  const subgroupCount = (group.subgroups ?? []).filter((subgroup) =>
    hasActiveVisibilityRules(subgroup)
  ).length;
  return ruleCount + subgroupCount > 0;
};

export { isEmptyAnswer };
