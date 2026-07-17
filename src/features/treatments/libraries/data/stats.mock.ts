import type { ContentLibraryStats } from "@/features/treatments/types";
import { mockConsents } from "./consents.mock";
import { mockSections } from "./sections.mock";
import { mockPrograms } from "@/features/treatments/programs/data/programs.mock";
import { mockCustomPrograms } from "@/features/treatments/custom-programs/data/customPrograms.mock";

export const mockContentLibraryStats: ContentLibraryStats = {
  consentForms: mockConsents.length,
  commonSections: mockSections.length,
  programs: mockPrograms.length,
  customPrograms: mockCustomPrograms.length,
};
