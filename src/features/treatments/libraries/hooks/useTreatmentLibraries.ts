import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { treatmentConfigurationApi as treatmentsApi } from "@/features/treatments/api/configurationApi";
import type {
  CommonSection,
  CommonSectionField,
  ConsentForm,
  CustomProgram,
  Program,
  ProgramQuestion,
  ProgramStatus,
  TreatmentType,
} from "@/features/treatments/types";
import { isPersistedUuid } from "@/features/treatments/api/mappers";

export const treatmentQueryKeys = {
  all: ["treatments"] as const,
  stats: () => [...treatmentQueryKeys.all, "stats"] as const,
  treatmentTypes: () => [...treatmentQueryKeys.all, "treatment-types"] as const,
  programs: () => [...treatmentQueryKeys.all, "programs"] as const,
  programQuestions: (programId: string) =>
    [...treatmentQueryKeys.programs(), programId, "questions"] as const,
  customPrograms: () => [...treatmentQueryKeys.all, "custom-programs"] as const,
  customProgram: (id: string) => [...treatmentQueryKeys.customPrograms(), id] as const,
  customProgramValidation: (id: string) => [...treatmentQueryKeys.customProgram(id), "validation"] as const,
  sections: () => [...treatmentQueryKeys.all, "sections"] as const,
  sectionFields: (sectionId: string) => [...treatmentQueryKeys.sections(), sectionId, "fields"] as const,
  consents: () => [...treatmentQueryKeys.all, "consents"] as const,
};

export const useContentLibraryStats = () =>
  useQuery({
    queryKey: treatmentQueryKeys.stats(),
    queryFn: treatmentsApi.listStats,
  });

export const useTreatmentTypes = () =>
  useQuery({
    queryKey: treatmentQueryKeys.treatmentTypes(),
    queryFn: treatmentsApi.listTreatmentTypes,
  });

export const usePrograms = () =>
  useQuery({
    queryKey: treatmentQueryKeys.programs(),
    queryFn: treatmentsApi.listPrograms,
  });

export const useProgramQuestions = (programId: string) =>
  useQuery({
    queryKey: treatmentQueryKeys.programQuestions(programId),
    queryFn: () => treatmentsApi.listProgramQuestions(programId),
    enabled: isPersistedUuid(programId),
  });

export const useCustomPrograms = () =>
  useQuery({
    queryKey: treatmentQueryKeys.customPrograms(),
    queryFn: treatmentsApi.listCustomPrograms,
  });

export const useCustomProgram = (id: string) =>
  useQuery({
    queryKey: treatmentQueryKeys.customProgram(id),
    queryFn: () => treatmentsApi.getCustomProgram(id),
    enabled: isPersistedUuid(id),
  });

export const useCustomProgramValidation = (id: string) =>
  useQuery({
    queryKey: treatmentQueryKeys.customProgramValidation(id),
    queryFn: () => treatmentsApi.validateCustomProgram(id),
    enabled: isPersistedUuid(id),
    staleTime: 0,
  });

export const useSections = () =>
  useQuery({
    queryKey: treatmentQueryKeys.sections(),
    queryFn: treatmentsApi.listSections,
  });

export const useSectionFields = (sectionId: string) =>
  useQuery({
    queryKey: treatmentQueryKeys.sectionFields(sectionId),
    queryFn: () => treatmentsApi.listSectionFields(sectionId),
  });

export const useConsents = () =>
  useQuery({
    queryKey: treatmentQueryKeys.consents(),
    queryFn: treatmentsApi.listConsents,
  });

// Mutations
export const useSaveCustomProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (program: CustomProgram) => treatmentsApi.saveCustomProgram(program),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.customPrograms() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.customProgram(data.id) });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.customProgramValidation(data.id) });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
    },
  });
};

export const usePublishCustomProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => treatmentsApi.publishCustomProgram(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.customPrograms() }),
        queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.customProgram(id) }),
        queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.customProgramValidation(id) }),
        queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() }),
      ]);
    },
  });
};

export const useDeleteCustomProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => treatmentsApi.deleteCustomProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.customPrograms() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
    },
  });
};

export const useSaveProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (program: Program) => treatmentsApi.saveProgram(program),
    onSuccess: async (updatedProgram) => {
      queryClient.setQueryData<Program[]>(treatmentQueryKeys.programs(), (current) =>
        (current || []).map((program) => {
          if (program.id !== updatedProgram.id) {
            return program;
          }

          return {
            ...updatedProgram,
            screeningQuestions: updatedProgram.screeningQuestions ?? program.screeningQuestions,
            checkoutQuestions: updatedProgram.checkoutQuestions ?? program.checkoutQuestions,
          };
        })
      );
      await queryClient.refetchQueries({ queryKey: treatmentQueryKeys.programs(), exact: true });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
    },
  });
};

export const useSaveProgramLabRequirements = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programId,
      requirements,
    }: {
      programId: string;
      requirements: Program["labRequirements"];
    }) => treatmentsApi.saveProgramLabRequirements(programId, requirements || []),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs() }),
        queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() }),
      ]);
    },
  });
};

export const useUpdateProgramSlug = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, slug }: { programId: string; slug: string }) =>
      treatmentsApi.updateProgramSlug(programId, slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
    },
  });
};

export const useUpdateProgramStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, status }: { programId: string; status: ProgramStatus }) =>
      treatmentsApi.updateProgramStatus(programId, status),
    onMutate: async ({ programId, status }) => {
      await queryClient.cancelQueries({ queryKey: treatmentQueryKeys.programs() });
      const previous = queryClient.getQueryData<Program[]>(treatmentQueryKeys.programs());

      queryClient.setQueryData<Program[]>(treatmentQueryKeys.programs(), (current) =>
        current?.map((p) =>
          p.id === programId ? { ...p, status, updatedAt: new Date().toISOString().split("T")[0] } : p
        )
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(treatmentQueryKeys.programs(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
    },
  });
};

export const useArchiveProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => treatmentsApi.archiveProgram(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programQuestions(data.id) });
    },
  });
};

export const useRestoreProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => treatmentsApi.restoreProgram(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programQuestions(data.id) });
    },
  });
};

export const useDuplicateProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => treatmentsApi.duplicateProgram(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programQuestions(data.id) });
    },
  });
};

export const useSaveProgramQuestion = (programId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (question: ProgramQuestion) => treatmentsApi.saveProgramQuestion(programId, question),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programQuestions(programId) });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs(), exact: true });
    },
  });
};

export const useDeleteProgramQuestion = (programId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => treatmentsApi.deleteProgramQuestion(programId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programQuestions(programId) });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs(), exact: true });
    },
  });
};

export const useReorderProgramQuestions = (programId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionIds: string[]) => treatmentsApi.reorderProgramQuestions(programId, questionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programQuestions(programId) });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs(), exact: true });
    },
  });
};

export const useSaveProgramQuestions = (programId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questions: ProgramQuestion[]) => treatmentsApi.saveProgramQuestions(programId, questions),
    onSuccess: async (questions) => {
      queryClient.setQueryData(treatmentQueryKeys.programQuestions(programId), questions);
      queryClient.setQueryData<Program[]>(treatmentQueryKeys.programs(), (current) =>
        (current || []).map((program) =>
          program.id === programId
            ? {
                ...program,
                screeningQuestions: questions,
                questionCount: questions.length,
              }
            : program
        )
      );
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programQuestions(programId) });
      await queryClient.refetchQueries({ queryKey: treatmentQueryKeys.programs(), exact: true });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
    },
  });
};

export const useSaveSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (section: CommonSection) => treatmentsApi.saveSection(section),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.sections() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
    },
  });
};

export const useDeleteSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => treatmentsApi.deleteSection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.sections() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
    },
  });
};

export const useSaveSectionField = (sectionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (field: CommonSectionField) => treatmentsApi.saveSectionField(sectionId, field),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.sectionFields(sectionId) });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.sections() });
    },
  });
};

export const useDeleteSectionField = (sectionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fieldId: string) => treatmentsApi.deleteSectionField(sectionId, fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.sectionFields(sectionId) });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.sections() });
    },
  });
};

export const useReorderSectionFields = (sectionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fieldIds: string[]) => treatmentsApi.reorderSectionFields(sectionId, fieldIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.sectionFields(sectionId) });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.sections() });
    },
  });
};

export const useSaveConsent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (consent: ConsentForm) => treatmentsApi.saveConsent(consent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.consents() });
      // Attached consent questions project their current library content.
      // Refresh program queries after a rename or content/options edit so the
      // program table and preview do not retain the old snapshot.
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
    },
  });
};

export const useDeleteConsent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => treatmentsApi.deleteConsent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.consents() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
    },
  });
};

export const useArchiveConsent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => treatmentsApi.archiveConsent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.consents() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
    },
  });
};

export const useRestoreConsent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => treatmentsApi.restoreConsent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.consents() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
    },
  });
};

export const useSaveTreatmentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (type: TreatmentType) => treatmentsApi.saveTreatmentType(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.treatmentTypes() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
    },
  });
};

export const useDeleteTreatmentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => treatmentsApi.deleteTreatmentType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.treatmentTypes() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
    },
  });
};
