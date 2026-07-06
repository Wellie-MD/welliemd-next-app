import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { treatmentsApi } from "@/features/treatments/api/treatmentsApi";
import type {
  CustomProgram,
  CustomProgramBuilderQuestionInput,
  Program,
  ProgramQuestion,
  ProgramStatus,
} from "@/features/treatments/types";

export const treatmentQueryKeys = {
  all: ["treatments"] as const,
  customPrograms: () => [...treatmentQueryKeys.all, "custom-programs"] as const,
  customProgram: (id: string) => [...treatmentQueryKeys.customPrograms(), id] as const,
  programs: () => [...treatmentQueryKeys.all, "programs"] as const,
  programQuestions: (programId: string) =>
    [...treatmentQueryKeys.programs(), programId, "questions"] as const,
};

export const useSections = () =>
  useQuery({
    queryKey: [...treatmentQueryKeys.all, "sections"],
    queryFn: () => Promise.resolve([]),
  });

export const useConsents = () =>
  useQuery({
    queryKey: [...treatmentQueryKeys.all, "consents"],
    queryFn: () => Promise.resolve([]),
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

export const useAddCustomProgramBuilderQuestion = (customProgramId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomProgramBuilderQuestionInput) =>
      treatmentsApi.addCustomProgramBuilderQuestion(customProgramId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.customProgram(customProgramId) });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.customPrograms() });
    },
  });
};

export const useDeleteCustomProgramBuilderQuestion = (customProgramId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) =>
      treatmentsApi.deleteCustomProgramBuilderQuestion(customProgramId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.customProgram(customProgramId) });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.customPrograms() });
    },
  });
};

export const useUpdateCustomProgramBuilderQuestion = (customProgramId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, input }: { questionId: string; input: CustomProgramBuilderQuestionInput }) =>
      treatmentsApi.updateCustomProgramBuilderQuestion(customProgramId, questionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.customProgram(customProgramId) });
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.customPrograms() });
    },
  });
};

export const useUpdateCustomProgramSlugOverride = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customProgramId, slugOverride }: { customProgramId: string; slugOverride: string }) =>
      treatmentsApi.updateCustomProgramSlugOverride(customProgramId, slugOverride),
    onSuccess: (program) => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.customPrograms() });
      if (program) {
        queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.customProgram(program.id) });
      }
    },
  });
};

export const usePrograms = () =>
  useQuery({
    queryKey: treatmentQueryKeys.programs(),
    queryFn: treatmentsApi.listPrograms,
  });

export const useUpdateProgramSlug = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, slug }: { programId: string; slug: string }) =>
      treatmentsApi.updateProgramSlug(programId, slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs() });
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
      const previousPrograms = queryClient.getQueryData<Program[]>(treatmentQueryKeys.programs());

      queryClient.setQueryData<Program[]>(treatmentQueryKeys.programs(), (current) =>
        current?.map((program) =>
          program.id === programId
            ? {
                ...program,
                status,
                updatedAt: new Date().toISOString().split("T")[0],
              }
            : program
        )
      );

      return { previousPrograms };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPrograms) {
        queryClient.setQueryData(treatmentQueryKeys.programs(), context.previousPrograms);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs() });
    },
  });
};

export const useUpdateProgramGroupStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ treatmentTypeKey, status }: { treatmentTypeKey: string; status: ProgramStatus }) =>
      treatmentsApi.updateProgramGroupStatus(treatmentTypeKey, status),
    onMutate: async ({ treatmentTypeKey, status }) => {
      await queryClient.cancelQueries({ queryKey: treatmentQueryKeys.programs() });
      const previousPrograms = queryClient.getQueryData<Program[]>(treatmentQueryKeys.programs());

      queryClient.setQueryData<Program[]>(treatmentQueryKeys.programs(), (current) =>
        current?.map((program) =>
          program.treatmentTypeKey === treatmentTypeKey
            ? {
                ...program,
                status,
                updatedAt: new Date().toISOString().split("T")[0],
              }
            : program
        )
      );

      return { previousPrograms };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPrograms) {
        queryClient.setQueryData(treatmentQueryKeys.programs(), context.previousPrograms);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: treatmentQueryKeys.programs() });
    },
  });
};

export const useProgramQuestions = (programId: string) =>
  useQuery({
    queryKey: treatmentQueryKeys.programQuestions(programId),
    queryFn: () => treatmentsApi.listProgramQuestions(programId),
  });

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
