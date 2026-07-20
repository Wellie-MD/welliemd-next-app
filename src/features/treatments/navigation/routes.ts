export const ADMIN_TREATMENT_ROUTES = {
  programs: "/dashboard/treatments/programs",
  programQuestions: (programId: string) =>
    `/dashboard/treatments/programs/${programId}/questions`,
  programQuestionsFlow: (programId: string) =>
    `/dashboard/treatments/programs/${programId}/questions?view=flow`,
  customProgramBuilder: (customProgramId: string) =>
    `/dashboard/treatments/custom-programs/${customProgramId}/builder`,
} as const;
