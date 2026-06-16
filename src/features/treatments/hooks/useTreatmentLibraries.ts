import { useQuery } from "@tanstack/react-query";
import { treatmentsApi } from "../api/treatmentsApi";

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
