import type { CommonSection } from "../types";
import { MOCK_IDS } from "./mockIds";

export const mockSections: CommonSection[] = [
  {
    id: MOCK_IDS.SECTION_MEDICAL_BASELINE,
    name: "Medical Baseline",
    scope: "global",
    visitTypeKeys: [],
    fieldCount: 3,
    updatedAt: "2026-05-10",
  },
  {
    id: MOCK_IDS.SECTION_BODY_STATS,
    name: "Body Stats",
    scope: "shared",
    visitTypeKeys: ["glp_weight_loss"],
    fieldCount: 1,
    updatedAt: "2026-05-22",
  },
];
