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
 * Resolve a response value by questionId with fallback suffix matching.
 * Mirrors the production flow's `resolveResponseValue` in QuestionnaireForm.jsx.
 */
const resolveResponseValue = (
  questionId: string,
  answers: PatientAnswers
): string | string[] | number | undefined => {
  if (!questionId) return undefined;
  if (Object.prototype.hasOwnProperty.call(answers, questionId)) {
    return answers[questionId];
  }
  const normalized = String(questionId);
  const matchedKey = Object.keys(answers).find(
    (key) => key === normalized || key.endsWith(`-${normalized}`)
  );
  return matchedKey ? answers[matchedKey] : undefined;
};

/**
 * Evaluate a single condition against the current patient answers.
 * Mirrors the production flow's `compareCondition` in QuestionnaireForm.jsx,
 * with additional operator aliases for backward compatibility.
 */
const evaluateRule = (rule: VisibilityRule, answers: PatientAnswers): boolean => {
  const answer = resolveResponseValue(rule.questionId, answers);

  switch (rule.operator) {
    case "equals":
    case "eq":
      return Array.isArray(answer)
        ? answer.includes(rule.value)
        : String(answer ?? "") === String(rule.value);
    case "not_equals":
    case "neq":
      return Array.isArray(answer)
        ? !answer.includes(rule.value)
        : String(answer ?? "") !== String(rule.value);
    case "contains":
      return Array.isArray(answer)
        ? answer.map(String).includes(String(rule.value))
        : String(answer ?? "").includes(String(rule.value));
    case "not_contains":
      return Array.isArray(answer)
        ? !answer.map(String).includes(String(rule.value))
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
    case "gt":
    case "greater_than": {
      const a = Number(answer);
      const b = Number(rule.value);
      if (isNaN(a) || isNaN(b)) return false;
      return a > b;
    }
    case "gte":
    case "greater_than_or_equal": {
      const a = Number(answer);
      const b = Number(rule.value);
      if (isNaN(a) || isNaN(b)) return false;
      return a >= b;
    }
    case "lt":
    case "less_than": {
      const a = Number(answer);
      const b = Number(rule.value);
      if (isNaN(a) || isNaN(b)) return false;
      return a < b;
    }
    case "lte":
    case "less_than_or_equal": {
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
    case "is_empty": {
      if (answer === undefined || answer === null) return true;
      if (Array.isArray(answer)) return answer.length === 0;
      return String(answer).trim() === "";
    }
    case "is_not_empty": {
      if (answer === undefined || answer === null) return false;
      if (Array.isArray(answer)) return answer.length > 0;
      return String(answer).trim() !== "";
    }
    default:
      return false;
  }
};

/**
 * Recursively evaluate a visibility node. Handles all formats used by the
 * production patient flow (QuestionnaireForm.jsx `evaluateProgramVisibility`):
 *
 * 1. `show_if` / `skip_if` wrappers
 * 2. `mode: "simple"|"nested"` groups with `rules`/`subgroups`
 * 3. `type: "group"` nodes with `children` array and `operator`
 * 4. Leaf conditions with `questionId`, `operator`, `value`
 */
const evaluateNode = (
  node: unknown,
  answers: PatientAnswers
): boolean => {
  if (!node || typeof node !== "object") return true;

  const n = node as Record<string, unknown>;

  // Handle show_if / skip_if wrappers (production flow format)
  if (n.show_if) return evaluateNode(n.show_if, answers);
  if (n.skip_if) return !evaluateNode(n.skip_if, answers);

  // Handle mode-based groups (admin VisibilityRuleGroup format)
  if (n.mode && (Array.isArray(n.rules) || Array.isArray(n.subgroups))) {
    const children = [
      ...(Array.isArray(n.rules) ? n.rules : []),
      ...(Array.isArray(n.subgroups) ? n.subgroups : []),
    ];
    if (!children.length) return true;
    const method =
      String(n.operator || (n.mode === "simple" ? "OR" : "AND")).toUpperCase() === "OR"
        ? "some"
        : "every";
    return children[method]((child: unknown) => evaluateNode(child, answers));
  }

  // Handle type:"group" nodes (production flow format)
  if (n.type === "group") {
    const children = Array.isArray(n.children) ? n.children : [];
    if (!children.length) return true;
    const method =
      String(n.operator || "AND").toUpperCase() === "OR" ? "some" : "every";
    return children[method]((child: unknown) => evaluateNode(child, answers));
  }

  // Handle children/rules arrays with operator (production flow format)
  const children = n.children || n.rules;
  if (Array.isArray(children)) {
    const method =
      String(n.operator || n.logic || "AND").toUpperCase() === "OR"
        ? "some"
        : "every";
    return children[method]((child: unknown) => evaluateNode(child, answers));
  }

  // Leaf condition
  const questionId = n.questionId || n.question_id;
  if (!questionId) return true;

  const answer = resolveResponseValue(String(questionId), answers);
  const operator = String(n.operator || n.comparison || "equals");
  const value = String(n.value ?? "");

  // Handle is_empty / is_not_empty at leaf level
  if (operator === "is_empty") {
    if (answer === undefined || answer === null) return true;
    if (Array.isArray(answer)) return answer.length === 0;
    return String(answer).trim() === "";
  }
  if (operator === "is_not_empty") {
    if (answer === undefined || answer === null) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    return String(answer).trim() !== "";
  }

  // For non-empty operators, undefined answer means condition fails
  if (answer === undefined || answer === null) return false;

  return evaluateRule(
    { questionId: String(questionId), operator: operator as VisibilityRule["operator"], value },
    answers
  );
};

/**
 * Evaluate a visibility rule group (with nested subgroups) against the current
 * patient answers. An empty/undefined group is always visible.
 *
 * Supports all formats used by both the admin builder and the production
 * patient flow:
 * - Admin format: `{ mode: "simple"|"nested", rules: [...], subgroups: [...] }`
 * - Production format: `{ show_if: {...} }`, `{ skip_if: {...} }`, `{ type: "group", children: [...] }`
 */
export const evaluateVisibilityGroup = (
  group: VisibilityRuleGroup | undefined,
  answers: PatientAnswers
): boolean => {
  if (!group) return true;
  return evaluateNode(group, answers);
};

/** True when the group actually constrains visibility (has at least one rule). */
export const hasActiveVisibilityRules = (
  group: VisibilityRuleGroup | undefined
): boolean => {
  if (!group) return false;

  // Check for show_if/skip_if wrappers
  const g = group as unknown as Record<string, unknown>;
  if (g.show_if || g.skip_if) return true;

  const ruleCount = (group.rules ?? []).filter((rule) => rule.questionId).length;
  const subgroupCount = (group.subgroups ?? []).filter((subgroup) =>
    hasActiveVisibilityRules(subgroup)
  ).length;
  return ruleCount + subgroupCount > 0;
};

export { isEmptyAnswer };
