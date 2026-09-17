// src/hooks/useClients.ts
import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import adminApi from "@/api/adminApi";

export interface Client {
  id: string;
  platform_client_id?: string;
  name: string;
  api_endpoint: string;
  admin_panel_domain?: string;
  resolved_admin_panel_domain?: string;
  patient_portal_domain?: string;
  resolved_patient_portal_domain?: string;
  questionnaire_url?: string;
  resolved_questionnaire_url?: string;
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

type ClientApiRecord = {
  id: string;
  platform_client_id?: string;
  name: string;
  api_endpoint?: string;
  admin_panel_domain?: string;
  resolved_admin_panel_domain?: string;
  patient_portal_domain?: string;
  resolved_patient_portal_domain?: string;
  questionnaire_url?: string;
  resolved_questionnaire_url?: string;
  domain?: string;
  subdomain?: string;
  user?: Client["user"];
};

function toClientRecord(value: unknown): ClientApiRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (!record.id) return null;

  return {
    id: String(record.id),
    platform_client_id: typeof record.platform_client_id === "string" ? record.platform_client_id : undefined,
    name: typeof record.name === "string" ? record.name : "",
    api_endpoint: typeof record.api_endpoint === "string" ? record.api_endpoint : undefined,
    admin_panel_domain: typeof record.admin_panel_domain === "string" ? record.admin_panel_domain : undefined,
    resolved_admin_panel_domain: typeof record.resolved_admin_panel_domain === "string" ? record.resolved_admin_panel_domain : undefined,
    patient_portal_domain: typeof record.patient_portal_domain === "string" ? record.patient_portal_domain : undefined,
    resolved_patient_portal_domain: typeof record.resolved_patient_portal_domain === "string" ? record.resolved_patient_portal_domain : undefined,
    questionnaire_url: typeof record.questionnaire_url === "string" ? record.questionnaire_url : undefined,
    resolved_questionnaire_url: typeof record.resolved_questionnaire_url === "string" ? record.resolved_questionnaire_url : undefined,
    domain: typeof record.domain === "string" ? record.domain : undefined,
    subdomain: typeof record.subdomain === "string" ? record.subdomain : undefined,
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
      setError(null);

      let meClientFromDb: Client | null = null;
      try {
        const { data } = await adminApi.get<unknown>("/clients/me/");
        const meClient = toClientRecord(data);
        if (meClient) {
          meClientFromDb = {
            id: meClient.id,
            platform_client_id: meClient.platform_client_id,
            name: meClient.name,
            api_endpoint: ensureTrailingSlash(meClient.api_endpoint),
            admin_panel_domain: meClient.admin_panel_domain,
            resolved_admin_panel_domain: meClient.resolved_admin_panel_domain,
            questionnaire_url: meClient.questionnaire_url,
            resolved_questionnaire_url: meClient.resolved_questionnaire_url,
            patient_portal_domain: meClient.patient_portal_domain,
            resolved_patient_portal_domain: meClient.resolved_patient_portal_domain,
            domain: meClient.domain,
            subdomain: meClient.subdomain,
            user: meClient.user,
          };
        }
      } catch {
        meClientFromDb = null;
      }

      let list: ClientApiRecord[] = [];
      try {
        const { data } = await adminApi.get<unknown>("/clients/current/");
        list = toClientList(data);
      } catch (err: unknown) {
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
        platform_client_id: c.platform_client_id,
        name: c.name,
        api_endpoint: ensureTrailingSlash(c.api_endpoint),
        admin_panel_domain: c.admin_panel_domain,
        resolved_admin_panel_domain: c.resolved_admin_panel_domain,
        questionnaire_url: c.questionnaire_url,
        resolved_questionnaire_url: c.resolved_questionnaire_url,
        patient_portal_domain: c.patient_portal_domain,
        resolved_patient_portal_domain: c.resolved_patient_portal_domain,
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
