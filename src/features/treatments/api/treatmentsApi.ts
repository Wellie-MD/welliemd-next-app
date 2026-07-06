import type {
  CustomProgram,
  CustomProgramBuilderQuestionInput,
  Program,
  ProgramQuestion,
  ProgramStatus,
  QuestionKind,
} from "@/features/treatments/types";
import { mockCustomPrograms } from "@/features/treatments/custom-programs/data/customPrograms.mock";
import { mockProgramQuestions } from "@/features/treatments/programs/data/programQuestions.mock";
import { mockPrograms } from "@/features/treatments/programs/data/programs.mock";
import { createMockId } from "@/features/treatments/common/data/factories";
import { normalizeTreatmentSlug } from "@/features/treatments/common/utils/slug";
import { normalizeCustomProgramSlug } from "@/features/treatments/custom-programs/utils/customProgramSlug";

const KEYS = {
  PROGRAMS: "welliemd_client_programs",
  CUSTOM_PROGRAMS: "welliemd_client_custom_programs",
  PROGRAM_QUESTIONS: "welliemd_client_program_questions",
};

const SEED_VERSION_KEY = "welliemd_client_data_version_v2";

const checkAndSeedMockData = () => {
  const seeded = localStorage.getItem(SEED_VERSION_KEY);
  if (!seeded) {
    localStorage.removeItem(KEYS.CUSTOM_PROGRAMS);
    localStorage.removeItem(KEYS.PROGRAMS);
    localStorage.removeItem(KEYS.PROGRAM_QUESTIONS);

    localStorage.setItem(KEYS.CUSTOM_PROGRAMS, JSON.stringify(mockCustomPrograms));
    localStorage.setItem(KEYS.PROGRAMS, JSON.stringify(mockPrograms));

    const initialQuestions: Record<string, ProgramQuestion[]> = {
      "program-glp-intake": mockProgramQuestions,
      "program-compounded-glp-intake": mockProgramQuestions,
      "program-branded-glp-intake": mockProgramQuestions,
      "program-glp-microdose": mockProgramQuestions,
      "program-trt-intake": mockProgramQuestions.slice(0, 3),
    };
    localStorage.setItem(KEYS.PROGRAM_QUESTIONS, JSON.stringify(initialQuestions));

    localStorage.setItem(SEED_VERSION_KEY, "true");
  }
};

if (typeof window !== "undefined") {
  checkAndSeedMockData();
}

const getStored = <T>(key: string, defaults: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(data);
};

const setStored = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getPrograms = () => getStored(KEYS.PROGRAMS, mockPrograms);

const getTodayIsoDate = () => new Date().toISOString().split("T")[0];

const questionTypeLabels: Partial<Record<QuestionKind, string>> = {
  single_choice: "Single Choice",
  multiple_choice: "Multiple Choice",
  yes_no: "Yes / No",
  text: "Text",
  textarea: "Textarea",
  number: "Number",
  date: "Date",
};

const getQuestionTypeLabel = (kind: QuestionKind) => questionTypeLabels[kind] ?? kind;

const getBuilderQuestionOptionCount = (input: CustomProgramBuilderQuestionInput) => {
  if (input.answerOptions.length > 0) return input.answerOptions.length;
  if (input.questionType === "yes_no") return 2;
  return undefined;
};

const formatBuilderQuestionSubtitle = (input: CustomProgramBuilderQuestionInput) => {
  const label = getQuestionTypeLabel(input.questionType);
  const optionCount = getBuilderQuestionOptionCount(input);
  if (!optionCount) return label;
  return `${label} - ${optionCount} ${optionCount === 1 ? "option" : "options"}`;
};

const mergeCustomProgramDefaults = (storedProgram: CustomProgram, defaultProgram: CustomProgram): CustomProgram => ({
  ...storedProgram,
  builderQuestions: storedProgram.builderQuestions ?? defaultProgram.builderQuestions ?? [],
  builderTreatmentOptions: storedProgram.builderTreatmentOptions ?? defaultProgram.builderTreatmentOptions ?? [],
  builderConsents: storedProgram.builderConsents ?? defaultProgram.builderConsents ?? [],
});

const getCustomPrograms = () => {
  const stored = getStored<CustomProgram[]>(KEYS.CUSTOM_PROGRAMS, mockCustomPrograms);
  let changed = false;

  const merged = stored.map((program) => {
    const defaultProgram = mockCustomPrograms.find((item) => item.id === program.id);
    if (!defaultProgram) return program;

    const nextProgram = mergeCustomProgramDefaults(program, defaultProgram);
    if (
      nextProgram.builderQuestions !== program.builderQuestions ||
      nextProgram.builderTreatmentOptions !== program.builderTreatmentOptions ||
      nextProgram.builderConsents !== program.builderConsents
    ) {
      changed = true;
    }
    return nextProgram;
  });

  mockCustomPrograms.forEach((defaultProgram) => {
    if (!merged.some((program) => program.id === defaultProgram.id)) {
      merged.push(defaultProgram);
      changed = true;
    }
  });

  if (changed) {
    setStored(KEYS.CUSTOM_PROGRAMS, merged);
  }

  return merged;
};

const setCustomPrograms = (programs: CustomProgram[]) => {
  setStored(KEYS.CUSTOM_PROGRAMS, programs);
};

const getProgramQuestions = (programId: string) => {
  const allQuestions = getStored<Record<string, ProgramQuestion[]>>(KEYS.PROGRAM_QUESTIONS, {
    "program-glp-intake": mockProgramQuestions,
    "program-compounded-glp-intake": mockProgramQuestions,
    "program-branded-glp-intake": mockProgramQuestions,
    "program-glp-microdose": mockProgramQuestions,
    "program-trt-intake": mockProgramQuestions.slice(0, 3),
  });
  return allQuestions[programId] || [];
};

const resolveMock = async <T>(value: T): Promise<T> => Promise.resolve(value);

export const treatmentsApi = {
  listPrograms: (): Promise<Program[]> => resolveMock(getPrograms()),

  getProgram: (id: string): Promise<Program | undefined> =>
    resolveMock(getPrograms().find((program) => program.id === id)),

  listProgramQuestions: (programId: string): Promise<ProgramQuestion[]> =>
    resolveMock(getProgramQuestions(programId)),

  listCustomPrograms: (): Promise<CustomProgram[]> => resolveMock(getCustomPrograms()),

  getCustomProgram: (id: string): Promise<CustomProgram | undefined> =>
    resolveMock(getCustomPrograms().find((program) => program.id === id)),

  addCustomProgramBuilderQuestion: (
    customProgramId: string,
    input: CustomProgramBuilderQuestionInput
  ): Promise<CustomProgram | undefined> => {
    const programs = getCustomPrograms();
    const nextPrograms = programs.map((program) => {
      if (program.id !== customProgramId) return program;
      const optionCount = getBuilderQuestionOptionCount(input);
      return {
        ...program,
        builderQuestions: [
          ...(program.builderQuestions ?? []),
          {
            id: createMockId("custom-q"),
            kind: "question" as const,
            title: input.questionText,
            subtitle: formatBuilderQuestionSubtitle(input),
            source: "client" as const,
            locked: false,
            required: input.required,
            questionKind: input.questionType,
            choiceCount: optionCount,
            answerOptions: input.answerOptions,
          },
        ],
      };
    });
    setCustomPrograms(nextPrograms);
    return resolveMock(nextPrograms.find((program) => program.id === customProgramId));
  },

  deleteCustomProgramBuilderQuestion: (
    customProgramId: string,
    questionId: string
  ): Promise<CustomProgram | undefined> => {
    const programs = getCustomPrograms();
    const nextPrograms = programs.map((program) => {
      if (program.id !== customProgramId) return program;
      return {
        ...program,
        builderQuestions: (program.builderQuestions ?? []).filter((question) => {
          if (question.id !== questionId) return true;
          return question.source !== "client" || question.locked;
        }),
      };
    });
    setCustomPrograms(nextPrograms);
    return resolveMock(nextPrograms.find((program) => program.id === customProgramId));
  },

  updateCustomProgramBuilderQuestion: (
    customProgramId: string,
    questionId: string,
    input: CustomProgramBuilderQuestionInput
  ): Promise<CustomProgram | undefined> => {
    const programs = getCustomPrograms();
    const nextPrograms = programs.map((program) => {
      if (program.id !== customProgramId) return program;
      const optionCount = getBuilderQuestionOptionCount(input);
      return {
        ...program,
        builderQuestions: (program.builderQuestions ?? []).map((question) => {
          if (question.id !== questionId || question.source !== "client" || question.locked) return question;
          return {
            ...question,
            title: input.questionText,
            subtitle: formatBuilderQuestionSubtitle(input),
            required: input.required,
            questionKind: input.questionType,
            choiceCount: optionCount,
            answerOptions: input.answerOptions,
          };
        }),
      };
    });
    setCustomPrograms(nextPrograms);
    return resolveMock(nextPrograms.find((program) => program.id === customProgramId));
  },

  updateCustomProgramSlugOverride: (
    customProgramId: string,
    slugOverride: string
  ): Promise<CustomProgram | undefined> => {
    const normalizedSlug = normalizeCustomProgramSlug(slugOverride);
    const programs = getCustomPrograms();
    const nextPrograms = programs.map((program) => {
      if (program.id !== customProgramId) return program;
      return {
        ...program,
        slugOverride: normalizedSlug || null,
      };
    });
    setCustomPrograms(nextPrograms);
    return resolveMock(nextPrograms.find((program) => program.id === customProgramId));
  },

  updateProgramSlug: (programId: string, slug: string): Promise<Program | undefined> => {
    const normalizedSlug = normalizeTreatmentSlug(slug);
    const programs = getPrograms();
    const nextPrograms = programs.map((program) => {
      if (program.id !== programId) return program;
      return {
        ...program,
        slug: normalizedSlug || program.slug,
        updatedAt: new Date().toISOString().split("T")[0],
      };
    });
    setStored(KEYS.PROGRAMS, nextPrograms);
    return resolveMock(nextPrograms.find((program) => program.id === programId));
  },

  updateProgramStatus: (programId: string, status: ProgramStatus): Promise<Program | undefined> => {
    const programs = getPrograms();
    const nextPrograms = programs.map((program) => {
      if (program.id !== programId) return program;
      return {
        ...program,
        status,
        updatedAt: getTodayIsoDate(),
      };
    });
    setStored(KEYS.PROGRAMS, nextPrograms);
    return resolveMock(nextPrograms.find((program) => program.id === programId));
  },

  updateProgramGroupStatus: (treatmentTypeKey: string, status: ProgramStatus): Promise<Program[]> => {
    const programs = getPrograms();
    const nextPrograms = programs.map((program) => {
      if (program.treatmentTypeKey !== treatmentTypeKey) return program;
      return {
        ...program,
        status,
        updatedAt: getTodayIsoDate(),
      };
    });
    setStored(KEYS.PROGRAMS, nextPrograms);
    return resolveMock(nextPrograms.filter((program) => program.treatmentTypeKey === treatmentTypeKey));
  },

  saveProgramQuestions: (programId: string, questions: ProgramQuestion[]): Promise<ProgramQuestion[]> => {
    const all = getStored<Record<string, ProgramQuestion[]>>(KEYS.PROGRAM_QUESTIONS, {});
    all[programId] = questions.map((q, idx) => ({ ...q, order: idx + 1 }));
    setStored(KEYS.PROGRAM_QUESTIONS, all);
    return resolveMock(questions);
  },

  saveProgramQuestion: (programId: string, question: ProgramQuestion): Promise<ProgramQuestion> => {
    const all = getStored<Record<string, ProgramQuestion[]>>(KEYS.PROGRAM_QUESTIONS, {});
    const list = all[programId] || [];
    const index = list.findIndex((q) => q.id === question.id);
    if (index >= 0) {
      list[index] = question;
    } else {
      list.push({ ...question, id: question.id || createMockId("q") });
    }
    all[programId] = list.map((q, idx) => ({ ...q, order: idx + 1 }));
    setStored(KEYS.PROGRAM_QUESTIONS, all);
    return resolveMock(question);
  },

  deleteProgramQuestion: (programId: string, questionId: string): Promise<void> => {
    const all = getStored<Record<string, ProgramQuestion[]>>(KEYS.PROGRAM_QUESTIONS, {});
    const list = (all[programId] || []).filter((q) => q.id !== questionId);
    all[programId] = list.map((q, idx) => ({ ...q, order: idx + 1 }));
    setStored(KEYS.PROGRAM_QUESTIONS, all);
    return resolveMock(undefined);
  },

  reorderProgramQuestions: (programId: string, questionIds: string[]): Promise<void> => {
    const all = getStored<Record<string, ProgramQuestion[]>>(KEYS.PROGRAM_QUESTIONS, {});
    const list = all[programId] || [];
    const reordered = questionIds.map((id, index) => {
      const found = list.find((q) => q.id === id);
      if (!found) throw new Error(`Question ${id} not found`);
      return { ...found, order: index + 1 };
    });
    all[programId] = reordered;
    setStored(KEYS.PROGRAM_QUESTIONS, all);
    return resolveMock(undefined);
  },
};
