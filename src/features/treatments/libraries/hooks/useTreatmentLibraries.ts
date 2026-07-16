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

export const treatmentQueryKeys = {
  all: ["treatments"] as const,
  stats: () => [...treatmentQueryKeys.all, "stats"] as const,
  treatmentTypes: () => [...treatmentQueryKeys.all, "treatment-types"] as const,
  programs: () => [...treatmentQueryKeys.all, "programs"] as const,
  programQuestions: (programId: string) =>
    [...treatmentQueryKeys.programs(), programId, "questions"] as const,
  customPrograms: () => [...treatmentQueryKeys.all, "custom-programs"] as const,
  customProgram: (id: string) => [...treatmentQueryKeys.customPrograms(), id] as const,
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
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs() });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.stats() });
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
    },
  });
};

export const useDeleteProgramQuestion = (programId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => treatmentsApi.deleteProgramQuestion(programId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programQuestions(programId) });
    },
  });
};

export const useReorderProgramQuestions = (programId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionIds: string[]) => treatmentsApi.reorderProgramQuestions(programId, questionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programQuestions(programId) });
    },
  });
};

export const useSaveProgramQuestions = (programId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questions: ProgramQuestion[]) => treatmentsApi.saveProgramQuestions(programId, questions),
    onSuccess: (questions) => {
      queryClient.setQueryData(treatmentQueryKeys.programQuestions(programId), questions);
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programQuestions(programId) });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs() });
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
