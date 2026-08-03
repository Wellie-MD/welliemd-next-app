import type { ProgramCheckoutProduct, ProgramProductRole } from "@/features/treatments/types";

export const PROGRAM_PRODUCT_ROLE = {
  primaryChoice: "primary_choice",
  requiredCompanion: "required_companion",
  optionalAddon: "optional_addon",
  clinicianOnly: "clinician_only",
  informational: "informational",
} as const satisfies Record<string, ProgramProductRole>;

// Mirrors the backend's is_req computation (program_checkout_configuration.py):
// a checkout question is only "required" if the patient must choose one of its
// primary-choice products — Optional/Informational/Clinician-only roles never force a selection.
export const isCheckoutQuestionRequired = (products: ProgramCheckoutProduct[] = []) =>
  products.some(
    (product) =>
      product.productRole === PROGRAM_PRODUCT_ROLE.primaryChoice ||
      product.productRole === PROGRAM_PRODUCT_ROLE.requiredCompanion
  );
