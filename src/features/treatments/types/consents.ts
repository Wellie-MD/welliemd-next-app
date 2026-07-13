import type { TreatmentLibraryScope } from "./shared";

export interface ConsentOption {
  id: string;
  text: string;
  /** When true, selecting this option disqualifies the patient. */
  disqualifies: boolean;
}

export interface ConsentForm {
  id: string;
  name: string;
  scope: TreatmentLibraryScope;
  isArchived: boolean;
  /** Visit types this consent is shown for (treatment-scoped only; empty = all). */
  visitTypeKeys: string[];
  /** Rich-text (HTML) body of the consent document. */
  text?: string;
  /** Acknowledgement options presented to the patient. */
  options?: ConsentOption[];
  updatedAt: string;
}
