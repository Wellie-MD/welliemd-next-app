// src/hooks/useClients.ts
import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import adminApi from "@/api/adminApi";

export interface Client {
  id: string;
  name: string;
  api_endpoint: string;
  admin_panel_domain?: string;
  patient_portal_domain?: string;
  questionnaire_url?: string;
  user?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
}

function ensureTrailingSlash(url?: string) {
  if (!url) return "";
  return url.endsWith("/") ? url : url + "/";
}

// Normalize URL for comparison (remove trailing slashes, convert to lowercase, remove protocol)
function normalizeUrlForComparison(url?: string): string {
  if (!url) return "";
  try {
    // Remove protocol if present
    let normalized = url.replace(/^https?:\/\//i, "");
    // Remove trailing slashes
    normalized = normalized.replace(/\/+$/, "");
    // Convert to lowercase for case-insensitive comparison
    normalized = normalized.toLowerCase();
    return normalized;
  } catch {
    return url.toLowerCase().replace(/\/+$/, "");
  }
}

type ClientApiRecord = {
  id: string;
  name: string;
  api_endpoint?: string;
  admin_panel_domain?: string;
  patient_portal_domain?: string;
  questionnaire_url?: string;
  user?: Client["user"];
};

function toClientRecord(value: unknown): ClientApiRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (!record.id) return null;

  return {
    id: String(record.id),
    name: typeof record.name === "string" ? record.name : "",
    api_endpoint: typeof record.api_endpoint === "string" ? record.api_endpoint : undefined,
    admin_panel_domain: typeof record.admin_panel_domain === "string" ? record.admin_panel_domain : undefined,
    patient_portal_domain: typeof record.patient_portal_domain === "string" ? record.patient_portal_domain : undefined,
    questionnaire_url: typeof record.questionnaire_url === "string" ? record.questionnaire_url : undefined,
    user: record.user && typeof record.user === "object" ? (record.user as Client["user"]) : undefined,
  };
}

function toClientList(data: unknown): ClientApiRecord[] {
  if (Array.isArray(data)) {
    return data.map(toClientRecord).filter((client): client is ClientApiRecord => Boolean(client));
  }
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.results)) {
      return record.results.map(toClientRecord).filter((client): client is ClientApiRecord => Boolean(client));
    }
    const client = toClientRecord(data);
    return client ? [client] : [];
  }
  return [];
}

function hasStatus(error: unknown, statuses: number[]) {
  const axiosError = error as AxiosError;
  const status = axiosError.response?.status;
  return typeof status === "number" && statuses.includes(status);
}

export function useClients(search: string = "") {
  const [clients, setClients] = useState<Client[]>([]);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      
      // Attempt to load from /clients/current/ first for tenant deployments
      let list: ClientApiRecord[] = [];
      try {
        const { data } = await adminApi.get<unknown>("/clients/current/");
        list = toClientList(data);
      } catch (err: unknown) {
        // Fallback to /clients/ if current doesn't work (e.g. some dev envs)
        if (hasStatus(err, [403, 404])) {
             const { data } = await adminApi.get<unknown>("/clients/", {
               params: search ? { search } : undefined,
             });
             list = toClientList(data);
        } else {
            throw err;
        }
      }

      const normalized: Client[] = list.map((c) => ({
        id: c.id,
        name: c.name,
        api_endpoint: ensureTrailingSlash(c.api_endpoint),
        admin_panel_domain: c.admin_panel_domain,
        patient_portal_domain: c.patient_portal_domain,
        questionnaire_url: c.questionnaire_url, // keep as-is (don't force "")
        user: c.user,
      }));

      setClients(normalized);

      // Enhanced client matching with better logging and fallbacks
      const origin = window.location.origin;
      const normalizedOrigin = normalizeUrlForComparison(origin);
      
      console.log("[useClients] Client Matching Debug:", {
        windowOrigin: origin,
        normalizedOrigin,
        totalClients: normalized.length,
        clientsList: normalized.map(c => ({
          id: c.id,
          name: c.name,
          admin_panel_domain: c.admin_panel_domain,
          questionnaire_url: c.questionnaire_url,
          normalizedDomain: normalizeUrlForComparison(c.admin_panel_domain),
        })),
      });

      // Try exact match first (case-insensitive, ignoring trailing slashes)
      let matched = normalized.find((c) => {
        const candidate = normalizeUrlForComparison(c.admin_panel_domain);
        const isMatch = candidate === normalizedOrigin;
        if (isMatch) {
          console.log("[useClients] ✅ Exact match found:", {
            clientName: c.name,
            clientId: c.id,
            adminDomain: c.admin_panel_domain,
            normalizedCandidate: candidate,
            normalizedOrigin,
          });
        }
        return isMatch;
      });

      // Fallback: Try matching without protocol
      if (!matched) {
        console.log("[useClients] No exact match, trying fallback matching...");
        matched = normalized.find((c) => {
          if (!c.admin_panel_domain) return false;
          const candidate = normalizeUrlForComparison(c.admin_panel_domain);
          // Try matching just the hostname part
          const originHostname = normalizeUrlForComparison(origin.split('://')[1] || origin);
          const candidateHostname = normalizeUrlForComparison(c.admin_panel_domain.split('://')[1] || c.admin_panel_domain);
          const isMatch = candidateHostname === originHostname || candidate === originHostname;
          if (isMatch) {
            console.log("[useClients] ✅ Fallback match found:", {
              clientName: c.name,
              clientId: c.id,
              adminDomain: c.admin_panel_domain,
              candidateHostname,
              originHostname,
            });
          }
          return isMatch;
        });
      }

      // Last resort: Use first client if only one exists
      if (!matched && normalized.length === 1) {
        console.log("[useClients] ⚠️ No match found, using first (and only) client as fallback");
        matched = normalized[0];
      }

      if (matched) {
        console.log("[useClients] ✅ Final matched client:", {
          id: matched.id,
          name: matched.name,
          admin_panel_domain: matched.admin_panel_domain,
          questionnaire_url: matched.questionnaire_url,
          hasQuestionnaireUrl: !!matched.questionnaire_url,
        });
      } else {
        console.warn("[useClients] ❌ No client matched! This may cause issues with affiliate links.", {
          origin,
          normalizedOrigin,
          availableClients: normalized.map(c => ({
            name: c.name,
            admin_panel_domain: c.admin_panel_domain,
          })),
        });
      }

      setCurrentClient(matched || null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  return { clients, currentClient, loading, error, reload: load };
}
