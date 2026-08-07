import { env } from "@/config/env";

export const isCorporateEmployeePreview =
  env.VITE_CORPORATE_PILOT_ENABLED && env.VITE_PORTAL_MODE === "corporate_employee";

export const isInvalidCorporateConfiguration =
  env.VITE_CORPORATE_PILOT_ENABLED && env.VITE_PORTAL_MODE !== "corporate_employee";
