import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { treatmentsApi } from "../api/treatmentsApi";
import type { CustomProgram, Program, ProgramQuestion, CommonSection, ConsentForm, TreatmentType } from "../types";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programQuestions(programId) });
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
