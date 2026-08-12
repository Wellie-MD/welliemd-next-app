import { apiClient } from "@/shared/api/client";
import { tokenManager } from "@/features/auth/services/token-manager";
import type { EmployeeCorporateContext } from "./contracts";

const CORPORATE_CONTEXT_TIMEOUT_MS = 30_000;

type AssignedProgramCache = {
  subject: string;
  context: EmployeeCorporateContext;
};

type AssignedProgramRequest = {
  subject: string | null;
  promise: Promise<EmployeeCorporateContext>;
};

let assignedProgramCache: AssignedProgramCache | null = null;
let assignedProgramRequest: AssignedProgramRequest | null = null;

function getAuthSubject(): string | null {
  const token = tokenManager.getAccessToken();
  if (!token) return null;

  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return null;
    const base64Payload = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const normalizedPayload = base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalizedPayload));
    const subject = payload.user_id || payload.sub;
    return subject ? String(subject) : null;
  } catch {
    return null;
  }
}

export function getCachedAssignedProgram(): EmployeeCorporateContext | null {
  const subject = getAuthSubject();
  return subject && assignedProgramCache?.subject === subject
    ? assignedProgramCache.context
    : null;
}

export async function fetchAssignedProgram(
  options: { force?: boolean } = {},
): Promise<EmployeeCorporateContext> {
  const subject = getAuthSubject();

  if (!options.force && subject && assignedProgramCache?.subject === subject) {
    return assignedProgramCache.context;
  }

  // React development remounts can run the page effect twice. Reuse the same
  // request so a route transition never creates competing context loads.
  if (assignedProgramRequest?.subject === subject) {
    return assignedProgramRequest.promise;
  }

  const request = apiClient
    .get<EmployeeCorporateContext>("/corporate/employee/program/", {
      timeout: CORPORATE_CONTEXT_TIMEOUT_MS,
    })
    .then(({ data }) => {
      const responseSubject = getAuthSubject();
      if (responseSubject && responseSubject === subject) {
        assignedProgramCache = { subject: responseSubject, context: data };
      }
      return data;
    })
    .finally(() => {
      if (assignedProgramRequest?.promise === request) {
        assignedProgramRequest = null;
      }
    });

  assignedProgramRequest = { subject, promise: request };
  return request;
}

export async function setPilotGate(enrollmentId: string, targetGate: 0 | 1): Promise<{ current_gate: 0 | 1 | 2 }> {
  const { data } = await apiClient.post<{ current_gate: 0 | 1 | 2 }>("/corporate/employee/program/advance/", { enrollment_id: enrollmentId, target_gate: targetGate });
  return data;
}

export async function createQuestionnaireLaunch(enrollmentId: string): Promise<{ launch_url: string; expires_at: string }> {
  const { data } = await apiClient.post<{ launch_url: string; expires_at: string }>("/corporate/employee/program/questionnaire-launch/", { enrollment_id: enrollmentId });
  return data;
}
