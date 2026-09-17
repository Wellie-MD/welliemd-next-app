function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePrimitive(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return "";
}

export function normalizeChoiceDisplay(choice: unknown): string {
  const primitive = normalizePrimitive(choice);
  if (primitive) return primitive;

  if (Array.isArray(choice)) {
    return choice
      .map((item) => normalizeChoiceDisplay(item))
      .filter(Boolean)
      .join(", ");
  }

  if (isRecord(choice)) {
    const preferredKeys = [
      "label",
      "name",
      "title",
      "text",
      "value",
      "product_name",
      "display_name",
      "medicine_name",
      "option",
      "id",
      "product_id",
      "beluga_medicine_id",
    ];

    for (const key of preferredKeys) {
      const value = choice[key];
      const normalized = normalizePrimitive(value);
      if (normalized.trim().length > 0) return normalized;
    }

    const primitiveValues = Object.values(choice)
      .map((value) => normalizePrimitive(value))
      .filter((value) => value.trim().length > 0);

    if (primitiveValues.length > 0) {
      return primitiveValues.join(" | ");
    }

    return JSON.stringify(choice);
  }

  return String(choice);
}

export function normalizeChoiceToken(choice: unknown): string {
  return normalizeChoiceDisplay(choice).trim().toLowerCase();
}

/**
 * Resolve a persisted/legacy answer value to the current choice label.
 *
 * Visibility rules historically stored short semantic values (for example
 * `Semaglutide`) while the question choices later gained explanatory text
 * (`Semaglutide (Ozempic, Wegovy, Rybelsus)`). Radix Select only considers an
 * item selected when its value is an exact match, so keep the current label
 * when there is one unambiguous prefix match. Ambiguous prefixes (such as
 * `Semaglutide` when several dose choices start with it) remain unchanged.
 */
export function resolveChoiceValue(
  choices: Array<unknown> | undefined,
  target: unknown,
): string {
  const targetDisplay = normalizeChoiceDisplay(target).trim();
  if (!targetDisplay || !choices?.length) return targetDisplay;

  const options = choices
    .map((choice) => normalizeChoiceDisplay(choice).trim())
    .filter(Boolean);
  const targetToken = normalizeChoiceToken(targetDisplay);
  const exact = options.find((option) => normalizeChoiceToken(option) === targetToken);
  if (exact) return exact;

  const compactTarget = targetToken.replace(/[^a-z0-9]/g, "");
  if (!compactTarget) return targetDisplay;

  const prefixMatches = options.filter((option) => {
    const compactOption = normalizeChoiceToken(option).replace(/[^a-z0-9]/g, "");
    return compactOption.startsWith(compactTarget);
  });

  return prefixMatches.length === 1 ? prefixMatches[0] : targetDisplay;
}

function extractTokens(choice: unknown): Set<string> {
  const tokens = new Set<string>();
  const displayToken = normalizeChoiceToken(choice);
  if (displayToken) tokens.add(displayToken);

  if (Array.isArray(choice)) {
    choice.forEach((item) => {
      const token = normalizeChoiceToken(item);
      if (token) tokens.add(token);
    });
  } else if (isRecord(choice)) {
    Object.values(choice).forEach((value) => {
      const token = normalizeChoiceToken(value);
      if (token) tokens.add(token);
    });
  }

  return tokens;
}

export function findMatchingChoiceIndex(
  choices: Array<unknown> | undefined,
  target: unknown
): number {
  if (!choices || choices.length === 0) return -1;

  const strictIndex = choices.indexOf(target);
  if (strictIndex !== -1) return strictIndex;

  const targetTokens = extractTokens(target);
  if (targetTokens.size === 0) return -1;

  for (let i = 0; i < choices.length; i += 1) {
    const choiceTokens = extractTokens(choices[i]);
    for (const token of choiceTokens) {
      if (targetTokens.has(token)) return i;
    }
  }

  return -1;
}
