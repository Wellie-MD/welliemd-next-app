import type {
  VisibilityCondition,
  VisibilityGroup,
} from "./VisibilityRuleBuilder";

export type VisibilityValidationField = "group" | "question" | "value";

export interface VisibilityValidationIssue {
  path: number[];
  field: VisibilityValidationField;
  message: string;
}

export const createDefaultVisibilityGroup = (): VisibilityGroup => ({
  type: "group",
  operator: "AND",
  children: [],
});

/**
 * Visibility rules have existed in both API (snake_case) and domain
 * (camelCase) shapes. Keep the authoring UI tolerant of either shape and of
 * incomplete historical records. An empty id is intentional: the builder can
 * render it and its normal validation message lets the user repair the rule.
 */
export const normalizeVisibilityQuestionId = (condition: unknown): string => {
  if (!condition || typeof condition !== "object") return "";
  const record = condition as Record<string, unknown>;
  const snakeCaseId = record.question_id;
  const raw = typeof snakeCaseId === "string" && snakeCaseId.trim()
    ? snakeCaseId
    : record.questionId;
  return typeof raw === "string" ? raw : raw == null ? "" : String(raw);
};

const NUMERIC_OPERATORS = new Set(["gt", "gte", "lt", "lte"]);

const isBlank = (value: unknown): boolean =>
  value === null || value === undefined || String(value).trim() === "";

const validateCondition = (
  condition: VisibilityCondition,
  path: number[],
): VisibilityValidationIssue[] => {
  const issues: VisibilityValidationIssue[] = [];

  if (!condition.question_id?.trim()) {
    issues.push({
      path,
      field: "question",
      message: "Select the question that controls this condition.",
    });
  }

  if (condition.operator === "is_empty" || condition.operator === "is_not_empty") {
    return issues;
  }

  if (condition.operator === "between") {
    const values = Array.isArray(condition.value) ? condition.value : [];
    if (values.length !== 2 || values.some(isBlank)) {
      issues.push({
        path,
        field: "value",
        message: "Enter both the minimum and maximum values.",
      });
    } else if (values.some((value) => !Number.isFinite(Number(value)))) {
      issues.push({
        path,
        field: "value",
        message: "Enter valid numeric minimum and maximum values.",
      });
    }
    return issues;
  }

  const values = Array.isArray(condition.value)
    ? condition.value.filter((value) => !isBlank(value))
    : isBlank(condition.value)
      ? []
      : [condition.value];

  if (values.length === 0) {
    issues.push({
      path,
      field: "value",
      message: condition.operator === "in" || condition.operator === "not_in"
        ? "Enter at least one trigger value."
        : "Enter the value that triggers this condition.",
    });
  } else if (
    NUMERIC_OPERATORS.has(condition.operator)
    && !Number.isFinite(Number(values[0]))
  ) {
    issues.push({
      path,
      field: "value",
      message: "Enter a valid numeric trigger value.",
    });
  }

  return issues;
};

const validateGroup = (
  group: VisibilityGroup,
  path: number[],
  isRoot: boolean,
): VisibilityValidationIssue[] => {
  if (group.children.length === 0) {
    return isRoot
      ? []
      : [{
          path,
          field: "group",
          message: "Add a condition to this group or remove the empty group.",
        }];
  }

  return group.children.flatMap((child, index) => {
    const childPath = [...path, index];
    return child.type === "group"
      ? validateGroup(child, childPath, false)
      : validateCondition(child, childPath);
  });
};

/**
 * Validates the authoring shape before it is converted into an API payload.
 * An empty root means visibility is not configured and is intentionally valid.
 */
export const validateVisibilityGroup = (
  group: VisibilityGroup,
): VisibilityValidationIssue[] => validateGroup(group, [], true);

export const visibilityPathLabel = (path: number[]): string =>
  path.map((index) => index + 1).join(".");

export const visibilityIssueId = (issue: VisibilityValidationIssue): string =>
  `visibility-${issue.path.join("-") || "root"}-${issue.field}-error`;
