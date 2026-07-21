export const CLIENT_TREATMENT_ROUTES = {
  programs: "/dashboard/treatments/programs",
  products: "/dashboard/products",
  labs: "/dashboard/products/labs",
  orderDetails: (orderId: string) => `/dashboard/orders/details/${orderId}`,
  programQuestions: (programId: string) =>
    `/dashboard/treatments/programs/${programId}/questions`,
  customProgramBuilder: (customProgramId: string) =>
    `/dashboard/treatments/custom-programs/${customProgramId}/builder`,
} as const;
