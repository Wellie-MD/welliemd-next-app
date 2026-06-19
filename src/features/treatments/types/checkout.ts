import type { VisibilityRuleGroup } from "./questions";

export interface ProgramCheckoutProduct {
  id: string;
  category: string;
  regimen: string;
  doseLabel: string;
  productId?: string;
  /** Monthly price in USD. When omitted, falls back to the structured price map. */
  price?: number;
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
