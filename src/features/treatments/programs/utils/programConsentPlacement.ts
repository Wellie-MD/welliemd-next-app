import type { ConsentForm } from "@/features/treatments/types";

type ConsentPlacement = Pick<ConsentForm, "id" | "name" | "scope" | "visitTypeKeys"> &
  Partial<Pick<ConsentForm, "isArchived">>;

const normalizeVisitType = (value: unknown) =>
  String(value || "").trim().toLocaleLowerCase();

export const countExplicitProgramConsents = (consentIds: string[] = []) =>
  new Set(consentIds.filter(Boolean)).size;

export const compatibleProgramConsents = <T extends ConsentPlacement>(
  consents: T[],
  visitType: string,
) => {
  const normalizedVisitType = normalizeVisitType(visitType);
  return consents.filter((consent) => {
    if (consent.isArchived) return false;
    if (consent.scope === "global") return true;
    return consent.scope === "visit_type" && (consent.visitTypeKeys || []).some(
      (key) => normalizeVisitType(key) === normalizedVisitType,
    );
  });
};

export const programConsentScopeLabel = (consent: ConsentPlacement) => {
  if (consent.scope === "global") return "Universal";
  const keys = (consent.visitTypeKeys || []).filter(Boolean);
  return keys.length > 0 ? `Visit Type: ${keys.join(", ")}` : "Visit Type: Unmapped";
};
