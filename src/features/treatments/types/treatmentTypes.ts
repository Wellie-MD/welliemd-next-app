export interface TreatmentType {
  id: string;
  key: string;
  name: string;
  intakeVisitType: string;
  followupVisitType?: string;
  description: string;
  programCount: number;
  productCount: number;
  sectionCount: number;
  consentCount: number;
  isActive: boolean;
}
