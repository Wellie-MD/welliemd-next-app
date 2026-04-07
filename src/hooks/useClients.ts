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
  return url.endsWith("/") ? url : url + "/";
}

export function useClients(search: string = "") {
  const [clients, setClients] = useState<Client[]>([]);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      // 1) Source of truth: authenticated user's bound client record from DB.
      try {
        const { data: meClient } = await adminApi.get("/clients/me/");
        if (meClient?.id) {
          setCurrentClient({
            id: meClient.id,
            name: meClient.name,
            api_endpoint: ensureTrailingSlash(meClient.api_endpoint),
            admin_panel_domain: meClient.admin_panel_domain,
            questionnaire_url: meClient.questionnaire_url,
            patient_portal_domain: meClient.patient_portal_domain,
            domain: meClient.domain,
            subdomain: meClient.subdomain,
          });
        } else {
          setCurrentClient(null);
        }
      } catch {
        setCurrentClient(null);
      }

      // 2) Best-effort list load (some tenant runtimes may restrict /clients/ list).
      try {
        const { data } = await adminApi.get("/clients/", {
          params: search ? { search } : undefined,
        });
        const list = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];
        setClients(
          list.map((c: any) => ({
            id: c.id,
            name: c.name,
            api_endpoint: ensureTrailingSlash(c.api_endpoint),
            admin_panel_domain: c.admin_panel_domain,
            questionnaire_url: c.questionnaire_url,
            patient_portal_domain: c.patient_portal_domain,
            domain: c.domain,
            subdomain: c.subdomain,
            user: c.user,
          }))
        );
      } catch {
        setClients([]);
      }
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
