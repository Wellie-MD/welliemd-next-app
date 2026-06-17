import type { ProgramQuestion } from "../types";

export const mockProgramQuestions: ProgramQuestion[] = [
  {
    id: "q-pregnant",
    order: 1,
    text: "Are you currently pregnant, breastfeeding or planning to become pregnant?",
    kind: "single_choice",
    section: "GLP Intake",
    required: true,
    answerCount: 2,
    flags: ["conditional", "disqualifying"],
  },
  {
    id: "q-highest-weight",
    order: 2,
    text: "What was the highest weight that you have reached?",
    kind: "number",
    section: "GLP Intake",
    required: true,
  },
  {
    id: "q-medical-conditions",
    order: 3,
    text: "Please check all current or past medical conditions",
    kind: "multiple_choice",
    section: "Medical Baseline",
    required: true,
    answerCount: 10,
  },
  {
    id: "q-checkout-glp",
    order: 4,
    text: "Recommended GLP product options",
    kind: "checkout",
    section: "Checkout",
    required: true,
    flags: ["conditional"],
  },
];
