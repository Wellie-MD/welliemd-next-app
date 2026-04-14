// src/features/visits/services/visit.service.ts
import { apiClient } from "@/shared/api/client";

export interface Visit {
  id: string;
  patient: string;
  patient_name: string;
  visit_type: string;
  status: string;
  master_id: string;
  consents_signed: boolean;
  beluga_visit_id: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientVisitsResponse {
  patient_id: string;
  visits: Visit[];
}

export interface ResumeQuestionnaireResponse {
  success: boolean;
  questionnaire_url?: string;
  session_id?: string;
  session_status?: string;
  session_type?: string;
  error?: string;
  can_restart?: boolean;
  expired?: boolean;
}

export const VisitService = {
  async getPatientVisits(): Promise<Visit[]> {
    const res = await apiClient.get<PatientVisitsResponse>(
      "/medical/patients/visits/"
    );
    return res.data.visits.filter((v) => v.master_id); // only visits with master_id
  },

  async resumeQuestionnaire(visitId: string): Promise<ResumeQuestionnaireResponse> {
    try {
      const res = await apiClient.post<ResumeQuestionnaireResponse>(
        `/questionnaires/visits/${visitId}/resume/`
      );
      return res.data;
    } catch (err: any) {
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        error: err.message || "Failed to resume questionnaire",
        can_restart: true,
      };
    }
  },
};
