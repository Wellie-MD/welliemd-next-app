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
  if (window.sessionStorage.getItem("corp-preview-context") === "employer") return "employer";
  return "operator";
}

export function isCorporateClientPreview(): boolean {
  return getCorporateClientMode() !== null;
}

export function clearEmployerPreview(): void {
  window.sessionStorage.removeItem("corp-preview-context");
}
