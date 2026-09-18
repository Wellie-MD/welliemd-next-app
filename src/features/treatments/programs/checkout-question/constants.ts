import type { ProgramCheckoutProduct, ProgramProductRole } from "@/features/treatments/types";

export const PROGRAM_PRODUCT_ROLE = {
  primaryChoice: "primary_choice",
  requiredCompanion: "required_companion",
  optionalAddon: "optional_addon",
  clinicianOnly: "clinician_only",
  informational: "informational",
} as const satisfies Record<string, ProgramProductRole>;

// A checkout question is required when its contract requires at least one
// selection, even if every individual option is an optional add-on. Product
// roles remain useful for legacy single-select questions, where a primary
// choice/required companion is the only requiredness signal.
export const isCheckoutQuestionRequired = (
  products: ProgramCheckoutProduct[] = [],
  minSelections?: number | null,
) =>
  Number(minSelections ?? 0) > 0 || products.some(
    (product) =>
      product.productRole === PROGRAM_PRODUCT_ROLE.primaryChoice ||
      product.productRole === PROGRAM_PRODUCT_ROLE.requiredCompanion
  );

export const productRoleForFlexibleSelection = (
  role: ProgramProductRole,
): ProgramProductRole => (
  role === PROGRAM_PRODUCT_ROLE.primaryChoice
    ? PROGRAM_PRODUCT_ROLE.optionalAddon
    : role
);
