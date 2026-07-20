import type { VisibilityRuleGroup } from "./questions";

export type ProgramProductRole =
  | "primary_choice"
  | "required_companion"
  | "optional_addon"
  | "clinician_only"
  | "informational";

export interface ProgramCheckoutProduct {
  id: string;
  /** Backend product category identifier; label is retained for display/backward compatibility. */
  categoryId?: number;
  category: string;
  /** Backend titration/regimen category identifier; label is retained for display/backward compatibility. */
  regimenId?: number;
  regimen: string;
  /** Backend dose mapping identifier; label is retained for display/backward compatibility. */
  doseMappingId?: number;
  doseLabel: string;
  productId?: string;
  /** Monthly price in USD. When omitted, falls back to the structured price map. */
  price?: number;
  productRole: ProgramProductRole;
  choiceGroup?: string;
  /**
   * Per-product conditional visibility. When omitted or empty, the product is
   * always shown (subject to the parent checkout question's own visibility).
   * This lets a single checkout step surface different products based on the
   * patient's earlier answers (e.g. medication preference).
   */
  visibilityRules?: VisibilityRuleGroup;
}

export interface ProgramCheckoutQuestion {
  id: string;
  text: string;
  products: ProgramCheckoutProduct[];
  visibilityRules: VisibilityRuleGroup;
}

export interface CheckoutProductOption {
  id: string;
  productId: string;
  treatmentTypeKey: string;
  category: string;
  regimen: string;
  dose: string;
  productName: string;
  price: number;
  visibilitySummary: string;
}
