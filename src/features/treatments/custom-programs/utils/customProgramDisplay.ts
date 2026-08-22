import type { CustomProgram, Program } from "@/features/treatments/types";

const uniqueNonEmptyValues = (values: Array<string | undefined>) =>
  Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));

const referencePattern = /^(?:[0-9a-f]{8}-[0-9a-f-]{27,}|(?:program|treatment)[-_][a-z0-9-]+)$/i;

const isDisplayableTitle = (value?: string) => {
  const title = value?.trim();
  return Boolean(title && !referencePattern.test(title));
};
interface ProgramReference {
  id?: string;
  title?: string;
}

const getProgramReferences = (customProgram: CustomProgram): ProgramReference[] => [
  ...(customProgram.builderTreatmentOptions ?? []).map((item) => ({
    id: item.sourceId,
    title: item.title,
  })),
  ...customProgram.flowItems
    .filter((item) => item.kind === "program")
    .map((item) => ({ id: item.sourceId, title: item.title })),
  ...customProgram.includedProgramIds.map((id) => ({ id })),
];

/**
 * Returns human-readable Program names without changing the source IDs used
 * by runtime routing or assignment.
 */
export const resolveCustomProgramNames = (customProgram: CustomProgram, programs: Program[] = []) => {
  const programsById = new Map(programs.map((program) => [String(program.id), program]));
  const resolvedNames: string[] = [];
  const seenProgramIds = new Set<string>();

  for (const reference of getProgramReferences(customProgram)) {
    const id = reference.id?.trim();
    const program = id ? programsById.get(id) : undefined;

    if (program) {
      if (!seenProgramIds.has(program.id)) {
        seenProgramIds.add(program.id);
        resolvedNames.push(program.name);
      }
      continue;
    }

    if (id && seenProgramIds.has(id)) continue;
    if (isDisplayableTitle(reference.title)) {
      const title = reference.title!.trim();
      if (!resolvedNames.includes(title)) resolvedNames.push(title);
      if (id) seenProgramIds.add(id);
    }
  }

  return uniqueNonEmptyValues(resolvedNames);
};
