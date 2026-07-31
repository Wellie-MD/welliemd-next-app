import type { ProgramCheckoutProduct, ProgramProductRole } from "@/features/treatments/types";

export const PROGRAM_PRODUCT_ROLE = {
  primaryChoice: "primary_choice",
  requiredCompanion: "required_companion",
  optionalAddon: "optional_addon",
  clinicianOnly: "clinician_only",
  informational: "informational",
} as const satisfies Record<string, ProgramProductRole>;

// LEGACY FALLBACK ONLY. "Required" is now authored on the checkout question
// itself (ProgramCheckoutQuestion.is_required) rather than inferred from the
// roles present, which made an all-optional question impossible to express.
// This remains solely to interpret releases saved before that field existed.
export const isCheckoutQuestionRequired = (products: ProgramCheckoutProduct[] = []) =>
  products.some(
    (product) =>
      product.productRole === PROGRAM_PRODUCT_ROLE.primaryChoice ||
      product.productRole === PROGRAM_PRODUCT_ROLE.requiredCompanion
  );
