import type { ProgramProductRole } from "@/features/treatments/types";

export const PROGRAM_PRODUCT_ROLE = {
  primaryChoice: "primary_choice",
  requiredCompanion: "required_companion",
  optionalAddon: "optional_addon",
  clinicianOnly: "clinician_only",
  informational: "informational",
} as const satisfies Record<string, ProgramProductRole>;

export const PROGRAM_PRODUCT_ROLE_OPTIONS: ReadonlyArray<{
  value: ProgramProductRole;
  label: string;
  description: string;
}> = [
  {
    value: PROGRAM_PRODUCT_ROLE.primaryChoice,
    label: "Choose one",
    description: "Patient selects one clinically valid option in this group.",
  },
  {
    value: PROGRAM_PRODUCT_ROLE.requiredCompanion,
    label: "Required",
    description: "Automatically included with the selected primary Product.",
  },
  {
    value: PROGRAM_PRODUCT_ROLE.optionalAddon,
    label: "Optional",
    description: "Patient may add or remove this item before processing.",
  },
  {
    value: PROGRAM_PRODUCT_ROLE.clinicianOnly,
    label: "Clinician only",
    description: "Available only after a clinician decision.",
  },
  {
    value: PROGRAM_PRODUCT_ROLE.informational,
    label: "Informational",
    description: "Displayed for education and never added to an Order.",
  },
];
