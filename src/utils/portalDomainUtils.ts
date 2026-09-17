import type { CustomDomain, CustomDomainPortalType } from "@/api/customDomainsApi";
import type { Client } from "@/hooks/useClients";

type ManagedPortalType = "client" | "patient" | "intake";

export function normalizeHostname(value?: string) {
  const raw = (value || "").trim().toLowerCase();
  if (!raw) return "";
  const withoutProtocol = raw.includes("://") ? raw.split("://")[1] : raw;
  return withoutProtocol.split("/")[0].split(":")[0].replace(/\.+$/, "");
}

function managedSlugFromApiEndpoint(apiEndpoint?: string) {
  const host = normalizeHostname(apiEndpoint);
  const dottedMatch = host.match(/^([a-z0-9-]+)\.api\.welliemd\.com$/i);
  if (dottedMatch?.[1]) return dottedMatch[1];

  const legacyMatch = host.match(/^([a-z0-9-]+)api\.welliemd\.com$/i);
  return legacyMatch?.[1] || "";
}

function isWellieManagedHostname(value?: string) {
  return normalizeHostname(value).endsWith(".welliemd.com");
}

export function managedWellieUrl(
  currentClient: Client | null,
  type: ManagedPortalType,
  existingValue?: string,
) {
  // The backend stores the active managed URL, including legacy naming
  // conventions such as `*-patient.welliemd.com`. Preserve it instead of
  // reconstructing a different URL from api_endpoint.
  const existingHost = normalizeHostname(existingValue);
  if (existingHost && isWellieManagedHostname(existingHost)) {
    return `https://${existingHost}`;
  }

  // Custom portal values are rendered in the Custom Domains section.
  if (existingHost) return "";

  const slug = managedSlugFromApiEndpoint(currentClient?.api_endpoint);
  if (!slug) return "";

  if (type === "client") return `https://${slug}client.welliemd.com`;
  if (type === "patient") return `https://${slug}patientportal.welliemd.com`;
  return `https://${slug}questionnaire.welliemd.com`;
}

export function isCustomPortalDomain(value?: string) {
  const host = normalizeHostname(value);
  if (!host) return false;
  return !isWellieManagedHostname(host);
}

export function configuredCustomDomains(currentClient: Client | null): CustomDomain[] {
  if (!currentClient) return [];

  const candidates: Array<[CustomDomainPortalType, Array<string | undefined>]> = [
    ["client", [currentClient.resolved_admin_panel_domain, currentClient.admin_panel_domain]],
    ["patient", [currentClient.resolved_patient_portal_domain, currentClient.patient_portal_domain]],
    ["intake", [currentClient.resolved_questionnaire_url, currentClient.questionnaire_url]],
  ];

  return candidates
    .map(([type, values]) => [type, values.find((value) => isCustomPortalDomain(value))] as const)
    .filter((entry): entry is readonly [CustomDomainPortalType, string] => Boolean(entry[1]))
    .map(([type, value]) => {
      const host = normalizeHostname(value);
      return {
        id: `client-config-${type}-${host}`,
        client: currentClient.id,
        domain: host,
        portal_type: type,
        status: "verified",
        validation_records: [],
        dns_status: "applied",
        is_locked: true,
        last_error: null,
        created_at: "",
        updated_at: "",
        verified_at: null,
      };
    });
}
