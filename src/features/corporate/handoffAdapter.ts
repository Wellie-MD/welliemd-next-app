import type { HandoffPreparationResult } from "./contracts";
import { corporatePilotConfig } from "./config";
import { corporatePilotFixture } from "./fixtures";

export async function prepareEmployerHandoff(employerId: string): Promise<HandoffPreparationResult> {
  if (!corporatePilotConfig.enabled) return { status: "backend_unavailable" };
  const belongsToOperator = corporatePilotFixture.availableEmployers.some((item) => item.id === employerId);
  if (!belongsToOperator) return { status: "forbidden" };
  return {
    status: "preview_ready",
    launchUrl: `/corporate-access/launch?preview_handoff=${encodeURIComponent(employerId)}`,
  };
}

export function consumePreviewHandoff(employerId: string): HandoffPreparationResult {
  if (!corporatePilotConfig.enabled) return { status: "backend_unavailable" };
  const belongsToOperator = corporatePilotFixture.availableEmployers.some((item) => item.id === employerId);
  if (!belongsToOperator) return { status: "forbidden" };
  window.sessionStorage.setItem("corp-preview-context", "employer");
  window.sessionStorage.setItem("corp-preview-employer", employerId);
  return { status: "preview_ready", launchUrl: "/dashboard/corporate/employer" };
}
