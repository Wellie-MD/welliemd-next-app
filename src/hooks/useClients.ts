// src/hooks/useClients.ts
import { useEffect, useState } from "react";
import api from "@/api/axiosInstance";

export interface Client {
  id: string;               // UUID (string in your schema)
  name: string;
  api_endpoint: string;     // e.g. https://welliemdclient.welliemd.com/api/v1/
  admin_panel_domain?: string;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const { data } = await api.get("/clients/", {
        params: search ? { search } : undefined,
      });

      // /clients/ is paginated in your schema
      const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      const normalized: Client[] = list.map((c: any) => ({
        id: c.id,
        name: c.name,
        api_endpoint: ensureTrailingSlash(c.api_endpoint),
        admin_panel_domain: c.admin_panel_domain,
        user: c.user,
      }));
      setClients(normalized);
    } catch (e: any) {
      setError(e?.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search]);

  return { clients, loading, error, reload: load };
}
