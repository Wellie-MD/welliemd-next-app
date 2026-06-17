import type { Program, ProgramCheckoutProduct, ProgramQuestion, VisibilityRule } from "../types";

export const createMockId = (prefix: string): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 11)}`;

export const currentDateStamp = (): string => new Date().toISOString().split("T")[0];

export const programFactory = (overrides: Partial<Program> = {}): Program => ({
  id: createMockId("program"),
  name: "New Program",
  stage: "intake",
  treatmentTypeKey: "compounded-glp",
  visitType: "weightloss",
  questionCount: 0,
  checkoutQuestionCount: 0,
  status: "draft",
  updatedAt: currentDateStamp(),
  slug: "new-program",
  authConfig: {
    email: true,
    phone: false,
    identity: false,
    account: true,
  },
  checkoutQuestions: [],
  consentIds: [],
  ...overrides,
});

export const questionFactory = (overrides: Partial<ProgramQuestion> = {}): ProgramQuestion => ({
  id: createMockId("q"),
  order: 1,
  text: "New Question",
  kind: "single_choice",
  section: "General",
  required: true,
  ...overrides,
});

export const checkoutProductFactory = (
  overrides: Omit<ProgramCheckoutProduct, "id"> & Partial<Pick<ProgramCheckoutProduct, "id">>
): ProgramCheckoutProduct => ({
  id: overrides.id ?? createMockId("pcp"),
  category: overrides.category,
  regimen: overrides.regimen,
  doseLabel: overrides.doseLabel,
  productId: overrides.productId,
});

export const visibilityRuleFactory = (
  overrides: Omit<VisibilityRule, "id"> & Partial<Pick<VisibilityRule, "id">>
): VisibilityRule => ({
  id: overrides.id ?? createMockId("vr"),
  questionId: overrides.questionId,
  operator: overrides.operator,
  value: overrides.value,
});
