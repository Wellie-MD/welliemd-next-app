// src/hooks/useClients.ts
import { useEffect, useState } from "react";
import adminApi from "@/api/adminApi";

export interface Client {
  id: string;
  name: string;
  api_endpoint: string;
  admin_panel_domain?: string;
  questionnaire_url?: string;
  patient_portal_domain?: string;
  domain?: string;
  subdomain?: string;
  user?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
}

function ensureTrailingSlash(url?: string) {
  if (!url) return "";
  return url.endsWith("/") ? url : `${url}/`;
}

function normalizeUrlForComparison(url?: string): string {
  if (!url) return "";
  try {
    let normalized = url.replace(/^https?:\/\//i, "");
    normalized = normalized.replace(/\/+$/, "");
    return normalized.toLowerCase();
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
      setError(null);

      let meClientFromDb: Client | null = null;
      try {
        const { data: meClient } = await adminApi.get("/clients/me/");
        if (meClient?.id) {
          meClientFromDb = {
            id: meClient.id,
            name: meClient.name,
            api_endpoint: ensureTrailingSlash(meClient.api_endpoint),
            admin_panel_domain: meClient.admin_panel_domain,
            questionnaire_url: meClient.questionnaire_url,
            patient_portal_domain: meClient.patient_portal_domain,
            domain: meClient.domain,
            subdomain: meClient.subdomain,
            user: meClient.user,
          };
        }
      } catch {
        meClientFromDb = null;
      }

      let list: any[] = [];
      try {
        const { data } = await adminApi.get("/clients/current/");
        list = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
            ? data
            : data?.id
              ? [data]
              : [];
      } catch (err: any) {
        if (err?.response?.status === 403 || err?.response?.status === 404) {
          const { data } = await adminApi.get("/clients/", {
            params: search ? { search } : undefined,
          });
          list = Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data)
              ? data
              : [];
        } else {
          throw err;
        }
      }

      const normalized: Client[] = list.map((c: any) => ({
        id: c.id,
        name: c.name,
        api_endpoint: ensureTrailingSlash(c.api_endpoint),
        admin_panel_domain: c.admin_panel_domain,
        questionnaire_url: c.questionnaire_url,
        patient_portal_domain: c.patient_portal_domain,
        domain: c.domain,
        subdomain: c.subdomain,
        user: c.user,
      }));

      setClients(normalized);

      if (meClientFromDb) {
        const enriched = normalized.find((c) => c.id === meClientFromDb?.id);
        setCurrentClient(enriched || meClientFromDb);
        return;
      }

      const origin = window.location.origin;
      const normalizedOrigin = normalizeUrlForComparison(origin);

      let matched = normalized.find((c) => {
        const candidate = normalizeUrlForComparison(c.admin_panel_domain);
        return candidate === normalizedOrigin;
      });

      if (!matched) {
        const originHostname = normalizeUrlForComparison(origin.split("://")[1] || origin);
        matched = normalized.find((c) => {
          if (!c.admin_panel_domain) return false;
          const candidate = normalizeUrlForComparison(c.admin_panel_domain);
          const candidateHostname = normalizeUrlForComparison(
            c.admin_panel_domain.split("://")[1] || c.admin_panel_domain
          );
          return candidateHostname === originHostname || candidate === originHostname;
        });
      }

      if (!matched && normalized.length === 1) {
        matched = normalized[0];
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
