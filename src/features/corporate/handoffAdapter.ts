import { useAuthStore } from "@/store/useAuthStore";
import type { HandoffPreparationResult } from "./contracts";
import { corporatePilotConfig } from "./config";
import { createEmployerHandoff, exchangeEmployerHandoff } from "./corporateApi";

export async function prepareEmployerHandoff(employerId: string): Promise<HandoffPreparationResult> {
  if (!corporatePilotConfig.enabled || !employerId) return { status: "invalid_context" };
  try {
    const result = await createEmployerHandoff(employerId);
    return { status: "handoff_ready", launchUrl: result.launch_url, expiresAt: result.expires_at };
  } catch (error: any) {
    if (error?.response?.status === 403) return { status: "forbidden" };
    return { status: "backend_unavailable" };
  }
}

export async function consumeEmployerHandoff(handoffCode: string): Promise<string> {
  const auth = useAuthStore.getState();
  if (!handoffCode) throw new Error("The employer handoff code is missing.");
  if (auth.accessToken) window.sessionStorage.setItem("corp-operator-access-token", auth.accessToken);
  const result = await exchangeEmployerHandoff(handoffCode);
  // Store the exchanged session atomically so the protected corporate route
  // cannot render once with a user but without an authenticated token.
  auth.login(result.access, result.user);
  window.sessionStorage.setItem("corp-employer-context", JSON.stringify(result.context));
  return result.redirect;
}

export function restoreOperatorContext(): boolean {
  const token = window.sessionStorage.getItem("corp-operator-access-token");
  if (!token) return false;
  useAuthStore.getState().setAccessToken(token);
  window.sessionStorage.removeItem("corp-operator-access-token");
  window.sessionStorage.removeItem("corp-employer-context");
  return true;
}
