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
  enabled: String(import.meta.env.VITE_CORPORATE_PILOT_ENABLED || "false") === "true",
  declaredMode,
  isKnownMode: allowedModes.includes(declaredMode),
};

export type CorporateClientMode = "operator" | "employer";

export function getCorporateClientMode(): CorporateClientMode | null {
  if (!corporatePilotConfig.enabled || !corporatePilotConfig.isKnownMode) return null;
  if (corporatePilotConfig.declaredMode === "corporate_employer") return "employer";
  if (corporatePilotConfig.declaredMode !== "corporate_operator") return null;
  if (accessTokenClaims().corporate_role === "employer_admin") return "employer";
  return "operator";
}

export function isCorporateClientPreview(): boolean {
  return getCorporateClientMode() !== null;
}

export function clearEmployerPreview(): void {
  window.sessionStorage.removeItem("corp-employer-context");
}
