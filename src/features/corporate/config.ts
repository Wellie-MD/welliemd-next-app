export type PortalMode =
  | "dtc"
  | "corporate_platform"
  | "corporate_operator"
  | "corporate_employer"
  | "corporate_employee";

const rawMode = String(import.meta.env.VITE_PORTAL_MODE || "dtc").trim();

export const corporatePilotConfig = {
  enabled: String(import.meta.env.VITE_CORPORATE_PILOT_ENABLED || "false") === "true",
  mode: rawMode as PortalMode,
  isKnownMode: [
    "dtc",
    "corporate_platform",
    "corporate_operator",
    "corporate_employer",
    "corporate_employee",
  ].includes(rawMode),
};

export const isCorporatePlatformPreview =
  corporatePilotConfig.enabled &&
  corporatePilotConfig.isKnownMode &&
  corporatePilotConfig.mode === "corporate_platform";
