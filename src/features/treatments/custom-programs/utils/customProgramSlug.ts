import type { CustomProgram } from "@/features/treatments/types";
import { normalizeTreatmentSlug } from "@/features/treatments/common/utils/slug";

export const normalizeCustomProgramSlug = normalizeTreatmentSlug;

export const getCustomProgramEffectiveSlug = (program: CustomProgram) => {
  const override = normalizeCustomProgramSlug(program.slugOverride ?? "");
  return override || program.slug;
};
