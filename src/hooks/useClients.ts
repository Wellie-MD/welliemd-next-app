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

      // 🔎 Debugging
      const origin = window.location.origin.replace(/\/+$/, "");
      console.log("🔎 Current origin:", origin);

      const matched = normalized.find((c) => {
        const candidate = c.admin_panel_domain?.replace(/\/+$/, "");
        console.log("👉 Checking client:", c.name, "| Admin domain:", candidate);
        return candidate === origin;
      });

      console.log("✅ Matched client:", matched);
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
