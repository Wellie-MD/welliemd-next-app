export const CLIENT_TREATMENT_ROUTES = {
  programs: "/dashboard/treatments/programs",
  programQuestions: (programId: string) =>
    `/dashboard/treatments/programs/${programId}/questions`,
  customProgramBuilder: (customProgramId: string) =>
    `/dashboard/treatments/custom-programs/${customProgramId}/builder`,
} as const;
