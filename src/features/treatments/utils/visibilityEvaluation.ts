import type { VisibilityRule, VisibilityRuleGroup } from "@/features/treatments/types";

/**
 * Patient answers keyed by questionId.
 * single_choice / yes_no / text / number / date → string
 * multiple_choice → string[]
 */
export type PatientAnswers = Record<string, string | string[] | undefined>;

const isEmptyAnswer = (answer: string | string[] | undefined): boolean => {
  if (answer === undefined || answer === null) return true;
  if (Array.isArray(answer)) return answer.length === 0;
  return answer.trim() === "";
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
  const value = rule.value;

  switch (rule.operator) {
    case "equals":
      return Array.isArray(answer)
        ? answer.includes(value)
        : String(answer ?? "") === String(value);
    case "not_equals":
      return Array.isArray(answer)
        ? !answer.includes(value)
        : String(answer ?? "") !== String(value);
    case "contains":
      return Array.isArray(answer)
        ? answer.includes(value)
        : String(answer ?? "").includes(String(value));
    case "not_contains":
      return Array.isArray(answer)
        ? !answer.includes(value)
        : !String(answer ?? "").includes(String(value));
    case "in": {
      const options = splitList(value);
      return Array.isArray(answer)
        ? options.some((option) => answer.includes(option))
        : options.includes(String(answer ?? ""));
    }
    case "not_in": {
      const options = splitList(value);
      return Array.isArray(answer)
        ? !options.some((option) => answer.includes(option))
        : !options.includes(String(answer ?? ""));
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
