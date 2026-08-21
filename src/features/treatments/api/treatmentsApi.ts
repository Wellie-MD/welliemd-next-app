import type {
  CommonSectionField,
  ContentLibraryStats,
  ProgramQuestion,
  ProgramStatus,
} from "@/features/treatments/types";
import { customProgramsApi } from "./customProgramsApi";
import { consentsApi, sectionsApi, treatmentTypesApi } from "./libraryApi";
import { programsApi, type ProgramSaveInput } from "./programsApi";
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
    const updated = current
      .filter((item) => item.id !== questionId)
      .map((item, index) => ({ ...item, order: index + 1 }));
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
  getProgramEffectiveContent: programsApi.getEffectiveContent,
};
