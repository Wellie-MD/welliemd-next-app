const CHECKOUT_SOURCE_KINDS = new Set([
  "checkout",
  "product_selection",
  "program_lab_checkout",
  "shipping_address",
]);

type VisibilitySourceLike = {
  kind?: unknown;
  question_type?: unknown;
  questionType?: unknown;
  type?: unknown;
  field_type?: unknown;
  elementConfig?: unknown;
  configuration?: unknown;
};

const normalizeKind = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");

const isCheckoutKind = (value: unknown): boolean =>
  CHECKOUT_SOURCE_KINDS.has(normalizeKind(value));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasCheckoutMetadata = (value: unknown): boolean => {
  if (!isRecord(value)) return false;

  return (
    isCheckoutKind(value.kind) ||
    isCheckoutKind(value.question_type) ||
    isCheckoutKind(value.questionType) ||
    isCheckoutKind(value.type) ||
    isCheckoutKind(value.field_type) ||
    value.labCheckout === true ||
    value.lab_checkout === true ||
    normalizeKind(value.checkoutMode) === "lab" ||
    normalizeKind(value.checkout_mode) === "lab"
  );
};

/** Returns true when a node cannot be used as a visibility-rule condition source. */
export const isCheckoutVisibilitySource = (source: VisibilitySourceLike): boolean => {
  if (
    isCheckoutKind(source.kind) ||
    isCheckoutKind(source.question_type) ||
    isCheckoutKind(source.questionType) ||
    isCheckoutKind(source.type) ||
    isCheckoutKind(source.field_type)
  ) {
    return true;
  }

  return hasCheckoutMetadata(source.elementConfig) || hasCheckoutMetadata(source.configuration);
};

/** Removes product and lab checkout nodes from visibility-rule source candidates. */
export const filterVisibilitySourceQuestions = <T extends VisibilitySourceLike>(
  questions: readonly T[],
): T[] => questions.filter((question) => !isCheckoutVisibilitySource(question));
