import type { TreatmentLibraryScope } from "./shared";

export interface ConsentForm {
  id: string;
  name: string;
  scope: TreatmentLibraryScope;
  visitTypeKeys: string[];
  updatedAt: string;
}
