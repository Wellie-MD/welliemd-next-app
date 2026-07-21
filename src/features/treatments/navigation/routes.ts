export const ADMIN_TREATMENT_ROUTES = {
  programs: "/dashboard/treatments/programs",
  sections: "/dashboard/treatments/sections",
  consents: "/dashboard/treatments/consents",
  products: "/dashboard/products",
  labs: "/dashboard/products/labs",
  treatmentType: (treatmentTypeKey: string) =>
    `/dashboard/treatments/treatment-types/${treatmentTypeKey}`,
  programQuestions: (programId: string) =>
    `/dashboard/treatments/programs/${programId}/questions`,
  programQuestionsFlow: (programId: string) =>
    `/dashboard/treatments/programs/${programId}/questions?view=flow`,
  customProgramBuilder: (customProgramId: string) =>
    `/dashboard/treatments/custom-programs/${customProgramId}/builder`,
} as const;
