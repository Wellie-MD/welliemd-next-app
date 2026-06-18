import type { VisibilityRuleGroup } from "./questions";

export interface ProgramCheckoutProduct {
  id: string;
  category: string;
  regimen: string;
  doseLabel: string;
  productId?: string;
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
