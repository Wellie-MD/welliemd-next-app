// src/hooks/useClients.ts
import { useEffect, useState } from "react";
import adminApi from "@/api/adminApi";

export interface Client {
  id: string;
  name: string;
  api_endpoint: string;
  admin_panel_domain?: string;
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

export function useClients(search: string = "") {
  const [clients, setClients] = useState<Client[]>([]);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const { data } = await adminApi.get("/clients/", {
        params: search ? { search } : undefined,
      });

      const list = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data)
        ? data
        : [];

      const normalized: Client[] = list.map((c: any) => ({
        id: c.id,
        name: c.name,
        api_endpoint: ensureTrailingSlash(c.api_endpoint),
        admin_panel_domain: c.admin_panel_domain,
        questionnaire_url: c.questionnaire_url, // ✅ keep as-is (don't force "")
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
    } catch (e: any) {
      setError(e?.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search]);

  return { clients, currentClient, loading, error, reload: load };
}
