export const VISIBILITY_CONDITION_OPERATORS = [
  "equals",
  "not_equals",
  "in",
  "not_in",
  "contains",
  "not_contains",
  "gt",
  "gte",
  "lt",
  "lte",
  "between",
  "is_empty",
  "is_not_empty",
] as const;

export type VisibilityConditionOperator = (typeof VISIBILITY_CONDITION_OPERATORS)[number];

const EMPTY_OPERATORS: VisibilityConditionOperator[] = ["is_empty", "is_not_empty"];
const EQUALITY_OPERATORS: VisibilityConditionOperator[] = ["equals", "not_equals"];
const NUMERIC_OPERATORS: VisibilityConditionOperator[] = [
  ...EQUALITY_OPERATORS,
  "gt",
  "gte",
  "lt",
  "lte",
  "between",
  ...EMPTY_OPERATORS,
];
const SINGLE_CHOICE_OPERATORS: VisibilityConditionOperator[] = [
  ...EQUALITY_OPERATORS,
  "in",
  "not_in",
  ...EMPTY_OPERATORS,
];
const MULTIPLE_CHOICE_OPERATORS: VisibilityConditionOperator[] = [
  "contains",
  "not_contains",
  ...EMPTY_OPERATORS,
];
const TEXT_OPERATORS: VisibilityConditionOperator[] = [
  ...EQUALITY_OPERATORS,
  "contains",
  "not_contains",
  ...EMPTY_OPERATORS,
];

/**
 * The authoring policy deliberately only offers comparisons that the runtime
 * can evaluate with the source's answer shape. Unknown/legacy kinds retain
 * the conservative equality-and-emptiness fallback.
 */
const TYPE_ALLOWED_OPERATORS: Record<string, VisibilityConditionOperator[]> = {
  single_choice: SINGLE_CHOICE_OPERATORS,
  single: SINGLE_CHOICE_OPERATORS,
  yes_no: SINGLE_CHOICE_OPERATORS,
  sex: SINGLE_CHOICE_OPERATORS,
  state_routing: SINGLE_CHOICE_OPERATORS,
  medication_dose: SINGLE_CHOICE_OPERATORS,
  medication_dose_selector: SINGLE_CHOICE_OPERATORS,
  labs: SINGLE_CHOICE_OPERATORS,
  labs_preference: SINGLE_CHOICE_OPERATORS,
  multiple_choice: MULTIPLE_CHOICE_OPERATORS,
  multiple: MULTIPLE_CHOICE_OPERATORS,
  self_reported_meds: MULTIPLE_CHOICE_OPERATORS,
  allergies: MULTIPLE_CHOICE_OPERATORS,
  medical_conditions: MULTIPLE_CHOICE_OPERATORS,
  number: NUMERIC_OPERATORS,
  bmi: NUMERIC_OPERATORS,
  height_weight: NUMERIC_OPERATORS,
  text: TEXT_OPERATORS,
  textarea: TEXT_OPERATORS,
  email: TEXT_OPERATORS,
  phone: TEXT_OPERATORS,
  zip: TEXT_OPERATORS,
  date: [...EQUALITY_OPERATORS, ...EMPTY_OPERATORS],
};

export const getAllowedVisibilityOperators = (kind?: string): VisibilityConditionOperator[] =>
  TYPE_ALLOWED_OPERATORS[String(kind || "").trim().toLowerCase()] || [
    ...EQUALITY_OPERATORS,
    ...EMPTY_OPERATORS,
  ];

export const isNumericVisibilityOperator = (operator: VisibilityConditionOperator): boolean =>
  ["gt", "gte", "lt", "lte", "between"].includes(operator);
