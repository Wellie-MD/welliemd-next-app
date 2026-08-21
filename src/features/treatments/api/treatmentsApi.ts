import type {
  CommonSectionField,
  ContentLibraryStats,
  ProgramQuestion,
  ProgramStatus,
  VisibilityRuleGroup,
} from "@/features/treatments/types";
import { customProgramsApi } from "./customProgramsApi";
import { consentsApi, sectionsApi, treatmentTypesApi } from "./libraryApi";
import { programsApi, type ProgramSaveInput } from "./programsApi";

const pruneVisibilityGroupReference = (
  group: VisibilityRuleGroup | undefined,
  removedQuestionId: string,
): VisibilityRuleGroup | undefined => {
  if (!group) return group;
  const rules = group.rules.filter((rule) => rule.questionId !== removedQuestionId);
  const subgroups = (group.subgroups || [])
    .map((subgroup) => pruneVisibilityGroupReference(subgroup, removedQuestionId))
    .filter((subgroup): subgroup is VisibilityRuleGroup => Boolean(subgroup?.rules.length));
  if (!rules.length && !subgroups.length) return undefined;
  return { ...group, rules, subgroups };
};

/**
 * Deleting a question can orphan sibling visibility rules that pointed at it.
 * A stale reference makes every future save of this Program's questions fail
 * (the backend rejects the whole payload), so it must be cleared here, at
 * the one place a question actually disappears from the list.
 */
const clearVisibilityReferencesTo = (
  questions: ProgramQuestion[],
  removedQuestionId: string,
): ProgramQuestion[] =>
  questions.map((question) => {
    const visibilityRule = question.visibilityRule?.questionId === removedQuestionId
      ? undefined
      : question.visibilityRule;
    const visibilityRuleGroup = pruneVisibilityGroupReference(question.visibilityRuleGroup, removedQuestionId);
    if (visibilityRule === question.visibilityRule && visibilityRuleGroup === question.visibilityRuleGroup) {
      return question;
    }
    return { ...question, visibilityRule, visibilityRuleGroup };
  });

export const treatmentsApi = {
  listStats: async (): Promise<ContentLibraryStats> => {
    const [consents, sections, customPrograms, programs] = await Promise.all([
      consentsApi.list(),
      sectionsApi.list(),
      customProgramsApi.list(),
      programsApi.list(),
    ]);
    return {
      consentForms: consents.length,
      commonSections: sections.length,
      programs: programs.length,
      customPrograms: customPrograms.length,
    };
  },

  listTreatmentTypes: treatmentTypesApi.list,
  saveTreatmentType: treatmentTypesApi.save,
  deleteTreatmentType: treatmentTypesApi.delete,

  listPrograms: programsApi.list,
  getProgram: programsApi.get,
  saveProgram: async (program: ProgramSaveInput) =>
    programsApi.save(program, await treatmentTypesApi.list()),
  saveProgramLabRequirements: programsApi.saveLabRequirements,
  updateProgramSlug: programsApi.updateSlug,
  updateProgramStatus: (id: string, status: ProgramStatus) => programsApi.updateStatus(id, status),
  archiveProgram: programsApi.archive,
  restoreProgram: programsApi.restore,
  duplicateProgram: programsApi.duplicate,
  listProgramQuestions: programsApi.listQuestions,
  saveProgramQuestions: programsApi.saveQuestions,

  saveProgramQuestion: async (programId: string, question: ProgramQuestion): Promise<ProgramQuestion> => {
    const current = await programsApi.listQuestions(programId);
    const index = current.findIndex((item) => item.id === question.id);
    const next = { ...question, order: question.order || (index >= 0 ? current[index].order : current.length + 1) };
    const updated = [...current];
    if (index >= 0) updated[index] = next;
    else updated.push(next);
    const saved = await programsApi.saveQuestions(programId, updated);
    return saved.find((item) => item.id === next.id) || next;
  },

  deleteProgramQuestion: async (programId: string, questionId: string): Promise<void> => {
    const current = await programsApi.listQuestions(programId);
    const updated = clearVisibilityReferencesTo(
      current.filter((item) => item.id !== questionId),
      questionId,
    ).map((item, index) => ({ ...item, order: index + 1 }));
    await programsApi.saveQuestions(programId, updated);
  },

  reorderProgramQuestions: async (programId: string, questionIds: string[]): Promise<void> => {
    const current = await programsApi.listQuestions(programId);
    const byId = new Map(current.map((item) => [item.id, item]));
    const reordered = questionIds.map((id, index) => {
      const question = byId.get(id);
      if (!question) throw new Error(`Program question ${id} was not found`);
      return { ...question, order: index + 1 };
    });
    await programsApi.saveQuestions(programId, reordered);
  },

  listSections: sectionsApi.list,
  saveSection: sectionsApi.save,
  deleteSection: sectionsApi.delete,
  listSectionFields: sectionsApi.listFields,
  saveSectionFields: sectionsApi.saveFields,
  reorderSectionFields: sectionsApi.reorderFields,

  saveSectionField: async (sectionId: string, field: CommonSectionField): Promise<CommonSectionField> => {
    const current = await sectionsApi.listFields(sectionId);
    const index = current.findIndex((item) => item.id === field.id);
    const updated = [...current];
    if (index >= 0) updated[index] = field;
    else updated.push(field);
    const saved = await sectionsApi.saveFields(sectionId, updated);
    return saved.find((item) => item.id === field.id)
      || saved.find((item) => item.order === field.order && item.label === field.label)
      || field;
  },

  deleteSectionField: async (sectionId: string, fieldId: string): Promise<void> => {
    const current = await sectionsApi.listFields(sectionId);
    const updated = current
      .filter((item) => item.id !== fieldId)
      .map((item, index) => ({ ...item, order: index + 1 }));
    await sectionsApi.saveFields(sectionId, updated);
  },

  listConsents: consentsApi.list,
  saveConsent: consentsApi.save,
  archiveConsent: consentsApi.archive,
  restoreConsent: consentsApi.restore,
  deleteConsent: consentsApi.delete,

  listCustomPrograms: customProgramsApi.list,
  getCustomProgram: customProgramsApi.get,
  validateCustomProgram: customProgramsApi.validate,
  saveCustomProgram: customProgramsApi.save,
  publishCustomProgram: customProgramsApi.publish,
  deleteCustomProgram: customProgramsApi.delete,
};
