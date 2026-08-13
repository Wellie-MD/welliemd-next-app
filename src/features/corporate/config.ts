export type PortalMode =
  | "dtc"
  | "corporate_platform"
  | "corporate_operator"
  | "corporate_employer"
  | "corporate_employee";

const allowedModes: PortalMode[] = [
  "dtc",
  "corporate_platform",
  "corporate_operator",
  "corporate_employer",
  "corporate_employee",
];

const declaredMode = String(import.meta.env.VITE_PORTAL_MODE || "dtc").trim() as PortalMode;

function accessTokenClaims(): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem("auth-storage");
    const token = raw ? JSON.parse(raw)?.state?.accessToken : null;
    if (typeof token !== "string") return {};
    const payload = token.split(".")[1];
    if (!payload) return {};
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

export const corporatePilotConfig = {
  // Corporate surfaces are opt-in so a staging-v2 deployment can keep the
  // existing DTC shell and routes unchanged after this branch is merged.
  enabled: String(import.meta.env.VITE_CORPORATE_PILOT_ENABLED || "false").toLowerCase() === "true",
  declaredMode,
  isKnownMode: allowedModes.includes(declaredMode),
};

export type CorporateClientMode = "operator" | "employer";

export function getCorporateClientMode(): CorporateClientMode | null {
  if (!corporatePilotConfig.enabled) return null;
  const role = accessTokenClaims().corporate_role;
  if (role === "employer_admin") return "employer";
  if (role === "operator_admin") return "operator";
  return null;
}

export function isCorporateClientPreview(): boolean {
  return getCorporateClientMode() !== null;
}

export function clearEmployerPreview(): void {
  window.sessionStorage.removeItem("corp-employer-context");
  window.sessionStorage.removeItem("corp-operator-access-token");
}

/** Remove transient cross-portal state when a session ends or is replaced. */
export function clearCorporateSession(): void {
  if (typeof window === "undefined") return;
  clearEmployerPreview();
}
