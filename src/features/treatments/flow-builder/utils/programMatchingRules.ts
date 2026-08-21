/**
 * Canonical Program matching rule grammar for the Custom Program builder.
 *
 * Ownership is `CustomProgramProgram.matching_rule` — one rule per Program
 * inclusion, not per Program. The prototype calls this behaviour
 * `eligibility visibilityRules`; that naming and its array-of-groups storage
 * are reference-only. Production persists a single rule node using the same
 * grammar the backend `RuleEvaluator` validates and evaluates:
 *
 *   group     = { combinator: "and" | "or", rules: Node[] }
 *   condition = { field, operator, value?, value2? }
 *
 * An empty rule means the Program is always offered.
 */

import type {
  ProgramMatchingCondition,
  ProgramMatchingConfig,
  ProgramMatchingGroup,
  ProgramMatchingNode,
  ProgramMatchingOperator,
} from "@/features/treatments/types";

export type MatchingFieldKind = "single" | "multiple" | "number" | "date" | "text";

export interface MatchingSourceField {
  id: string;
  label: string;
  kind: MatchingFieldKind;
  /** Grouping shown in the picker: Custom Program questions, a Section, or profile. */
  group: string;
  choices?: string[];
}

export interface OperatorOption {
  value: ProgramMatchingOperator;
  label: string;
}

/** Path into the rule tree. `[]` is the root group. */
export type RulePath = number[];

const VALUE_OPERATORS = new Set<ProgramMatchingOperator>([
  "eq", "neq", "contains", "not_contains", "in", "not_in",
  "gt", "gte", "lt", "lte", "between",
]);

const NUMERIC_OPERATORS: ProgramMatchingOperator[] = [
  "eq", "neq", "gt", "gte", "lt", "lte", "between", "is_empty", "is_not_empty",
];

const CHOICE_OPERATORS: ProgramMatchingOperator[] = [
  "eq", "neq", "in", "not_in", "is_empty", "is_not_empty",
];

const MULTI_CHOICE_OPERATORS: ProgramMatchingOperator[] = [
  "contains", "not_contains", "in", "not_in", "is_empty", "is_not_empty",
];

const TEXT_OPERATORS: ProgramMatchingOperator[] = [
  "eq", "neq", "contains", "not_contains", "is_empty", "is_not_empty",
];

const DATE_OPERATORS: ProgramMatchingOperator[] = [
  "eq", "neq", "gt", "gte", "lt", "lte", "between", "is_empty", "is_not_empty",
];

const OPERATOR_LABELS: Record<ProgramMatchingOperator, string> = {
  eq: "Equals",
  neq: "Does not equal",
  gt: "Greater than",
  gte: "Greater than or equal",
  lt: "Less than",
  lte: "Less than or equal",
  between: "In between",
  contains: "Contains",
  not_contains: "Does not contain",
  in: "In list",
  not_in: "Not in list",
  exists: "Has an answer",
  is_empty: "Is empty",
  is_not_empty: "Is not empty",
};

/** Operators valid for a field type. An unknown field falls back to text. */
export function operatorsForKind(kind: MatchingFieldKind | undefined): OperatorOption[] {
  const operators =
    kind === "number" ? NUMERIC_OPERATORS
    : kind === "single" ? CHOICE_OPERATORS
    : kind === "multiple" ? MULTI_CHOICE_OPERATORS
    : kind === "date" ? DATE_OPERATORS
    : TEXT_OPERATORS;
  return operators.map((value) => ({ value, label: OPERATOR_LABELS[value] }));
}

export function operatorNeedsValue(operator: ProgramMatchingOperator): boolean {
  return VALUE_OPERATORS.has(operator);
}

export function operatorNeedsSecondValue(operator: ProgramMatchingOperator): boolean {
  return operator === "between";
}

export function isGroup(node: ProgramMatchingNode | undefined): node is ProgramMatchingGroup {
  return !!node && Array.isArray((node as ProgramMatchingGroup).rules);
}

export function isCondition(
  node: ProgramMatchingNode | undefined,
): node is ProgramMatchingCondition {
  return !!node && !isGroup(node) && typeof (node as ProgramMatchingCondition).field === "string";
}

export const emptyGroup = (combinator: "and" | "or" = "and"): ProgramMatchingGroup => ({
  combinator,
  rules: [],
});

export const newCondition = (field = ""): ProgramMatchingCondition => ({
  field,
  operator: "eq",
  value: "",
});

/**
 * Coerce any stored shape into a root group.
 *
 * Accepts an empty rule, a bare condition (older rows persisted a single
 * `{field, operator, value}`), and a group.
 */
export function normalizeRule(rule: unknown): ProgramMatchingGroup {
  if (!rule || typeof rule !== "object") return emptyGroup();
  const candidate = rule as ProgramMatchingNode;
  if (isGroup(candidate)) {
    return {
      combinator: candidate.combinator === "or" ? "or" : "and",
      rules: (candidate.rules || []).map(normalizeNode).filter(Boolean) as ProgramMatchingNode[],
    };
  }
  if (isCondition(candidate)) {
    return { combinator: "and", rules: [candidate] };
  }
  return emptyGroup();
}

function normalizeNode(node: ProgramMatchingNode): ProgramMatchingNode | null {
  if (isGroup(node)) {
    return {
      combinator: node.combinator === "or" ? "or" : "and",
      rules: (node.rules || []).map(normalizeNode).filter(Boolean) as ProgramMatchingNode[],
    };
  }
  return isCondition(node) ? node : null;
}

/** Serialise back to persistence. An empty tree persists as `{}` — always offered. */
export function serializeRule(group: ProgramMatchingGroup): ProgramMatchingGroup | Record<string, never> {
  const pruned = pruneEmptyGroups(group);
  if (!pruned || pruned.rules.length === 0) return {};
  return pruned;
}

function pruneEmptyGroups(group: ProgramMatchingGroup): ProgramMatchingGroup | null {
  const rules = group.rules
    .map((node) => (isGroup(node) ? pruneEmptyGroups(node) : node))
    .filter((node): node is ProgramMatchingNode => node !== null);
  return { combinator: group.combinator, rules };
}

/** Total conditions anywhere in the tree — what `Conditional · N rules` counts. */
export function countConditions(node: ProgramMatchingNode | undefined): number {
  if (!node) return 0;
  if (isGroup(node)) return node.rules.reduce((total, child) => total + countConditions(child), 0);
  return 1;
}

export function getNodeAtPath(
  root: ProgramMatchingGroup,
  path: RulePath,
): ProgramMatchingNode | undefined {
  let current: ProgramMatchingNode = root;
  for (const index of path) {
    if (!isGroup(current)) return undefined;
    current = current.rules[index];
    if (!current) return undefined;
  }
  return current;
}

function mapNodeAtPath(
  root: ProgramMatchingGroup,
  path: RulePath,
  update: (node: ProgramMatchingNode) => ProgramMatchingNode | null,
): ProgramMatchingGroup {
  if (path.length === 0) {
    const next = update(root);
    return isGroup(next) ? next : emptyGroup();
  }
  const [index, ...rest] = path;
  const rules = [...root.rules];
  const target = rules[index];
  if (!target) return root;
  if (rest.length === 0) {
    const next = update(target);
    if (next === null) rules.splice(index, 1);
    else rules[index] = next;
  } else {
    if (!isGroup(target)) return root;
    rules[index] = mapNodeAtPath(target, rest, update);
  }
  return { ...root, rules };
}

export function updateNode(
  root: ProgramMatchingGroup,
  path: RulePath,
  patch: Partial<ProgramMatchingCondition> & Partial<ProgramMatchingGroup>,
): ProgramMatchingGroup {
  return mapNodeAtPath(root, path, (node) => ({ ...node, ...patch } as ProgramMatchingNode));
}

export function removeNode(root: ProgramMatchingGroup, path: RulePath): ProgramMatchingGroup {
  if (path.length === 0) return emptyGroup();
  return mapNodeAtPath(root, path, () => null);
}

export function addCondition(
  root: ProgramMatchingGroup,
  path: RulePath,
  field = "",
): ProgramMatchingGroup {
  return mapNodeAtPath(root, path, (node) =>
    isGroup(node) ? { ...node, rules: [...node.rules, newCondition(field)] } : node,
  );
}

/** Add a nested group. Mirrors the prototype: a subgroup flips the parent's operator. */
export function addSubgroup(root: ProgramMatchingGroup, path: RulePath): ProgramMatchingGroup {
  return mapNodeAtPath(root, path, (node) => {
    if (!isGroup(node)) return node;
    const combinator = node.combinator === "and" ? "or" : "and";
    return { ...node, rules: [...node.rules, { combinator, rules: [newCondition()] }] };
  });
}

export interface MatchingIssue {
  path: RulePath;
  field: "field" | "operator" | "value";
  message: string;
}

/**
 * Validate every condition against the inputs available before Stage 2.
 *
 * A field that is not in `available` is either deleted or belongs to a later
 * Program, both of which publication rejects.
 */
export function validateRule(
  group: ProgramMatchingGroup,
  available: MatchingSourceField[],
): MatchingIssue[] {
  const byId = new Map(available.map((item) => [item.id, item]));
  const issues: MatchingIssue[] = [];

  const walk = (node: ProgramMatchingNode, path: RulePath) => {
    if (isGroup(node)) {
      node.rules.forEach((child, index) => walk(child, [...path, index]));
      return;
    }
    if (!node.field) {
      issues.push({ path, field: "field", message: "Select a matching input." });
      return;
    }
    const source = byId.get(node.field);
    if (!source) {
      issues.push({
        path,
        field: "field",
        message: "This input is not available before treatment options are offered.",
      });
      return;
    }
    const allowed = operatorsForKind(source.kind).map((item) => item.value);
    if (!node.operator) {
      issues.push({ path, field: "operator", message: "Select an operator." });
    } else if (!allowed.includes(node.operator)) {
      issues.push({
        path,
        field: "operator",
        message: `"${OPERATOR_LABELS[node.operator]}" cannot be used with a ${source.kind} field.`,
      });
    }
    if (node.operator && operatorNeedsValue(node.operator)) {
      if (isBlank(node.value)) {
        issues.push({ path, field: "value", message: "Enter an expected answer." });
      } else if (operatorNeedsSecondValue(node.operator) && isBlank(node.value2)) {
        issues.push({ path, field: "value", message: "Enter both ends of the range." });
      }
    }
  };

  walk(group, []);
  return issues;
}

function isBlank(value: ProgramMatchingCondition["value"]): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export type MatchingStatus = "always" | "conditional" | "withheld";

/**
 * The Stage 2 row status.
 *
 * Three states, per the reconciliation record: an empty rule means always
 * offered, a rule means conditional, and `enabled: false` means the inclusion
 * is kept but withheld. Disabling is never conflated with an empty rule.
 */
export function matchingStatus(config: ProgramMatchingConfig | undefined): MatchingStatus {
  if (config && config.enabled === false) return "withheld";
  const count = countConditions(normalizeRule(config?.rule));
  return count > 0 ? "conditional" : "always";
}

export function matchingStatusLabel(config: ProgramMatchingConfig | undefined): string {
  const status = matchingStatus(config);
  if (status === "withheld") return "Not offered";
  if (status === "always") return "Always offered";
  const count = countConditions(normalizeRule(config?.rule));
  return `Conditional · ${count} ${count === 1 ? "rule" : "rules"}`;
}

/** Plain-language summary of a rule tree, used in the row and editor preview. */
export function describeRule(
  group: ProgramMatchingGroup,
  available: MatchingSourceField[],
): string {
  const byId = new Map(available.map((item) => [item.id, item]));
  const render = (node: ProgramMatchingNode): string => {
    if (isGroup(node)) {
      if (node.rules.length === 0) return "";
      const joiner = node.combinator === "and" ? " AND " : " OR ";
      const parts = node.rules.map(render).filter(Boolean);
      if (parts.length === 0) return "";
      return parts.length === 1 ? parts[0] : `(${parts.join(joiner)})`;
    }
    const label = byId.get(node.field)?.label || node.field || "—";
    const operator = OPERATOR_LABELS[node.operator] || node.operator;
    if (!operatorNeedsValue(node.operator)) return `${label} ${operator.toLowerCase()}`;
    if (operatorNeedsSecondValue(node.operator)) {
      return `${label} between ${node.value ?? "—"} and ${node.value2 ?? "—"}`;
    }
    return `${label} ${operator.toLowerCase()} ${node.value ?? "—"}`;
  };
  const summary = render(group);
  return summary || "Always offered";
}

export interface MatchingSourceInputs {
  /** Ordered Custom Program flow items (Stage 1 questions and Section placements). */
  flowItems: Array<{
    id: string;
    kind: string;
    sourceId?: string;
    title?: string;
    questionKind?: string;
    choices?: string[];
    answerOptions?: string[];
  }>;
  /** Common Sections referenced by the flow, keyed by section id. */
  sections: Array<{ id: string; name: string }>;
  /** Fields per section id. */
  sectionFields: Record<string, Array<{ id: string; sourceFieldId?: string; label: string; kind: string }>>;
}

const KIND_MAP: Record<string, MatchingFieldKind> = {
  single_choice: "single",
  multiple_choice: "multiple",
  select: "single",
  multi_select: "multiple",
  checkbox: "multiple",
  radio: "single",
  number: "number",
  bmi: "number",
  date: "date",
  text: "text",
  textarea: "text",
  state_routing: "single",
};

function toKind(value: string | undefined): MatchingFieldKind {
  return KIND_MAP[String(value || "").toLowerCase()] || "text";
}

/**
 * Every input legally available to a Stage 2 matching rule.
 *
 * Deliberately excludes Program clinical questions: a Program cannot match on
 * an answer that only exists once that Program is already running, and
 * publication rejects such a reference. Grouped for the picker as the plan
 * requires — Custom Program questions, shared Section fields, and approved
 * profile/location fields.
 */
export function buildMatchingSources(inputs: MatchingSourceInputs): MatchingSourceField[] {
  const sources: MatchingSourceField[] = [];

  for (const item of inputs.flowItems || []) {
    if (item.kind !== "routing_question") continue;
    sources.push({
      id: item.sourceId || item.id,
      label: item.title || item.sourceId || item.id,
      kind: toKind(item.questionKind),
      group: "Custom Program questions",
      choices: item.choices || item.answerOptions || [],
    });
  }

  const sectionsById = new Map((inputs.sections || []).map((section) => [section.id, section]));
  for (const item of inputs.flowItems || []) {
    if (item.kind !== "section" && item.kind !== "section_field") continue;
    const section = sectionsById.get(String(item.sourceId));
    if (!section) continue;
    for (const field of inputs.sectionFields[section.id] || []) {
      const id = field.sourceFieldId || field.id;
      if (sources.some((existing) => existing.id === id)) continue;
      sources.push({
        id,
        label: field.label,
        kind: toKind(field.kind),
        group: section.name,
      });
    }
  }

  sources.push(
    { id: "age", label: "Age", kind: "number", group: "Patient profile" },
    { id: "bmi", label: "BMI (calculated)", kind: "number", group: "Patient profile" },
    { id: "sex", label: "Sex at birth", kind: "single", group: "Patient profile", choices: ["Male", "Female", "Intersex"] },
    { id: "gender", label: "Gender", kind: "single", group: "Patient profile", choices: ["Male", "Female", "Other"] },
    { id: "service_state", label: "State of residence", kind: "text", group: "Location" },
  );

  return sources;
}
