import type { ProgramQuestion, CommonSectionField } from "@/features/treatments/types";
import type { QuestionFlowItem, QuestionFlowAdapter } from "../types";
import { treatmentsApi } from "@/features/treatments/api/treatmentsApi";

export async function programQuestionFlowAdapter(programId: string, title: string): Promise<QuestionFlowAdapter> {
  const questions = await treatmentsApi.listProgramQuestions(programId);
  
  const items: QuestionFlowItem[] = questions.map((q) => ({
    id: q.id,
    order: q.order,
    text: q.text,
    kind: q.kind,
    required: q.required,
    metadata: {
      section: q.section,
      choices: q.choices,
    },
  }));

  return {
    entityType: "program",
    entityId: programId,
    title,
    subtitle: "Internal program questions sequence",
    items,
    saveItems: async (newItems: QuestionFlowItem[]) => {
      // Create new list of ProgramQuestion
      const updatedQuestions: ProgramQuestion[] = newItems.map((item) => {
        const existing = questions.find((q) => q.id === item.id);
        return {
          ...existing, // preserve other fields like choices, flags
          id: item.id,
          order: item.order,
          text: item.text,
          kind: item.kind,
          required: item.required,
          section: (item.metadata?.section as string) || "Default", // fallback if new
        } as ProgramQuestion;
      });
      await treatmentsApi.saveProgramQuestions(programId, updatedQuestions);
    },
  };
}

export async function sectionQuestionFlowAdapter(sectionId: string, title: string): Promise<QuestionFlowAdapter> {
  const fields = await treatmentsApi.listSectionFields(sectionId);
  
  const items: QuestionFlowItem[] = fields.map((f) => ({
    id: f.id,
    order: f.order,
    text: f.label,
    kind: f.kind,
    required: f.required,
    metadata: {
      mappedField: f.mappedField,
    },
  }));

  return {
    entityType: "section",
    entityId: sectionId,
    title,
    subtitle: "Internal section fields sequence",
    items,
    saveItems: async (newItems: QuestionFlowItem[]) => {
      const updatedFields: CommonSectionField[] = newItems.map((item) => {
        const existing = fields.find((f) => f.id === item.id);
        return {
          ...existing,
          id: item.id,
          sectionId,
          order: item.order,
          label: item.text,
          kind: item.kind,
          required: item.required,
        } as CommonSectionField;
      });
      await treatmentsApi.saveSectionFields(sectionId, updatedFields);
    },
  };
}
