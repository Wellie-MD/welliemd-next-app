import type {
  CommonSectionField,
  ProgramQuestion,
} from "@/features/treatments/types";

type SectionChoice = string | number | boolean | Record<string, unknown>;

const CHOICE_VALUE_KEYS = ["value", "code", "option_id", "id"] as const;
const CHOICE_LABEL_KEYS = ["label", "text", "name"] as const;

const choiceValue = (choice: SectionChoice): unknown => {
  if (typeof choice !== "object" || choice === null) return choice;
  for (const key of CHOICE_VALUE_KEYS) {
    const value = choice[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const choiceLabel = (choice: SectionChoice): string => {
  if (typeof choice !== "object" || choice === null) return String(choice);
  for (const key of CHOICE_LABEL_KEYS) {
    const value = choice[key];
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }
  const canonical = choiceValue(choice);
  return canonical === undefined ? "" : String(canonical);
};

const choiceAliases = (choice: SectionChoice): string[] => {
  if (typeof choice !== "object" || choice === null) return [String(choice)];
  return [...CHOICE_VALUE_KEYS, ...CHOICE_LABEL_KEYS]
    .map((key) => choice[key])
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map(String);
};

const sectionChoices = (configuration: Record<string, unknown>): SectionChoice[] =>
  Array.isArray(configuration.choices)
    ? configuration.choices.filter((choice): choice is SectionChoice =>
        ["string", "number", "boolean", "object"].includes(typeof choice)
        && choice !== null)
    : [];

export const sectionEditorChoices = (
  configuration: Record<string, unknown>,
): string[] => sectionChoices(configuration).map(choiceLabel);

export const sectionEditorDqChoices = (
  configuration: Record<string, unknown>,
): string[] => {
  const choices = sectionChoices(configuration);
  const disqualifiers = Array.isArray(configuration.dqChoices)
    ? configuration.dqChoices
    : [];
  return disqualifiers.map((candidate) => {
    const candidateText = String(candidate);
    const match = choices.find((choice) =>
      choiceAliases(choice).includes(candidateText));
    return match ? choiceLabel(match) : candidateText;
  });
};

const preserveChoiceObjects = (
  editorChoices: string[],
  configuration: Record<string, unknown>,
): SectionChoice[] => {
  const originalChoices = sectionChoices(configuration);
  const originalByEditorIndex = new Map<number, number>();
  const usedOriginalIndexes = new Set<number>();

  editorChoices.forEach((editorChoice, editorIndex) => {
    const originalIndex = originalChoices.findIndex(
      (choice, index) =>
        !usedOriginalIndexes.has(index)
        && choiceLabel(choice) === editorChoice,
    );
    if (originalIndex >= 0) {
      originalByEditorIndex.set(editorIndex, originalIndex);
      usedOriginalIndexes.add(originalIndex);
    }
  });

  const unmatchedEditorIndexes = editorChoices
    .map((_choice, index) => index)
    .filter((index) => !originalByEditorIndex.has(index));
  const unmatchedOriginalIndexes = originalChoices
    .map((_choice, index) => index)
    .filter((index) => !usedOriginalIndexes.has(index));

  // With the same unmatched cardinality, the editor changed labels rather
  // than adding/removing choices. Pair the unmatched identities in their
  // stable order so their canonical value/code/option_id/id survives.
  if (unmatchedEditorIndexes.length === unmatchedOriginalIndexes.length) {
    unmatchedEditorIndexes.forEach((editorIndex, index) => {
      originalByEditorIndex.set(editorIndex, unmatchedOriginalIndexes[index]);
    });
  }

  return editorChoices.map((editorChoice, editorIndex) => {
    const originalIndex = originalByEditorIndex.get(editorIndex);
    if (originalIndex === undefined) return editorChoice;
    const original = originalChoices[originalIndex];
    if (typeof original !== "object" || original === null) return editorChoice;
    const labelKey = CHOICE_LABEL_KEYS.find(
      (key) => original[key] !== undefined,
    ) || "label";
    return {
      ...original,
      [labelKey]: editorChoice,
    };
  });
};

/**
 * Merge opaque Section field configuration with the current editor state.
 *
 * elementConfig is the last server snapshot and can contain keys the editor
 * does not own. Preserve those keys, but make every editor-controlled value
 * authoritative so edits and explicit clears cannot be overwritten by stale
 * configuration during a bulk field save.
 */
export const buildSectionFieldConfiguration = (
  question: ProgramQuestion,
): Record<string, unknown> => {
  const elementConfig = question.elementConfig || {};
  return {
    ...elementConfig,
    choices: preserveChoiceObjects(question.choices || [], elementConfig),
    dqChoices: question.dqChoices || [],
    consentText: question.consentText,
    checkoutProductIds: question.checkoutProductIds || [],
    checkoutProducts: question.checkoutProducts || [],
    visibilityRuleGroup: question.visibilityRuleGroup || {},
    includeInQa: question.includeInQa,
    hiddenFromPatient: question.hiddenFromPatient,
    prefillFromPrevious: question.prefillFromPrevious,
  };
};

export const applyPersistedSectionField = (
  question: ProgramQuestion,
  persisted: CommonSectionField,
): ProgramQuestion => ({
  ...question,
  id: persisted.id || question.id,
  elementConfig: persisted.configuration || question.elementConfig,
});
