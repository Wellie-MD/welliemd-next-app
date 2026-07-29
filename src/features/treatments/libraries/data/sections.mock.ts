import type { CommonSection } from "@/features/treatments/types";
import { MOCK_IDS } from "@/features/treatments/common/data/mockIds";

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
    scope: "visit_type",
    visitTypeKeys: ["Weight", "GLP", "Microdose"],
    fieldCount: 1,
    updatedAt: "2026-05-22",
  },
];
