import type { ContentLibraryStats } from "../types";
import { mockConsents } from "./consents.mock";
import { mockSections } from "./sections.mock";
import { mockPrograms } from "./programs.mock";
import { mockCustomPrograms } from "./customPrograms.mock";

export const mockContentLibraryStats: ContentLibraryStats = {
  consentForms: mockConsents.length,
  commonSections: mockSections.length,
  programs: mockPrograms.length,
  customPrograms: mockCustomPrograms.length,
};
