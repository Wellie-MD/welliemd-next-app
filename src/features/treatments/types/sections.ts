import type { QuestionKind } from "./questions";
import type { TreatmentLibraryScope } from "./shared";

export interface CommonSection {
  id: string;
  name: string;
  scope: TreatmentLibraryScope;
  visitTypeKeys: string[];
  fieldCount: number;
  updatedAt: string;
}

export interface CommonSectionField {
  id: string;
  sectionId: string;
  order: number;
  label: string;
  kind: QuestionKind;
  required: boolean;
  mappedField?: string;
  configuration?: Record<string, unknown>;
}
