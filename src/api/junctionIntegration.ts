import axiosInstance from "./axiosInstance"
import { JUNCTION_ENDPOINTS } from "./endpoints"

export type JunctionEnvironment = "sandbox" | "production"

export interface JunctionStatusAxes {
  integration_status:
    | "not_provisioned"
    | "team_created"
    | "keys_missing"
    | "tenant_sync_failed"
    | "connected"
  labs_status: "lab_accounts_missing" | "ambiguous_lab_account" | "ready"
  checkout_ready: boolean
  blocking_reason: string
}

export interface JunctionApiKeyBlock {
  exists: boolean
  key_id?: string
  masked?: string
  created_at?: string | null
}

export interface JunctionWebhookBlock {
  exists: boolean
  webhook_id?: string
  url?: string
  disabled?: boolean
  state?: string
  filter_types?: string[]
  secret_configured?: boolean
  last_synced_at?: string | null
  last_verified_at?: string | null
  last_error?: string
}

export interface JunctionLabAccountItem {
  lab_account_id: string
  lab: string
  account_name: string
  status: string
  delegated_flow: string
  allowed_billing: Record<string, unknown>
  environment: string
  linked: boolean
  is_orderable?: boolean
  orderable?: boolean
  last_verified_at?: string | null
}

export interface JunctionSenseQueryStatus {
  id: string
  domain: string
  slug: string
  is_custom: boolean
  display_name: string
  junction_query_id: string
  query_definition: Record<string, unknown>
  sync_status: "pending" | "synced" | "failed"
  access_granted: boolean
  last_synced_at?: string | null
  last_computed_at?: string | null
  last_error?: string
  custom_inputs?: string
  custom_output?: string
  min_gap_seconds?: number
}

export interface JunctionSenseEnvBlock {
  ready: boolean
  queries: JunctionSenseQueryStatus[]
}

export interface JunctionWearableProviderSource {
  slug: string
  name: string
  raw_snapshot?: Record<string, unknown> | null
  client_pull_window_days?: number | null
  client_enabled?: boolean | null
  logo_url?: string | null
}

export interface JunctionWearablesSettingsPayload {
  enabled?: boolean
  provider_configs?: Record<string, unknown>
}

export interface JunctionIntegrationDetail {
  client_id: string
  team_id: string
  integration_team_id: string
  region?: "us" | "eu"
  active_environment?: JunctionEnvironment
  enabled?: boolean
  physician_ordering_mode?: "junction_network" | "own_physician" | ""
  last_provisioned_at?: string | null
  last_synced_at?: string | null
  last_sync_status?: string
  last_sync_error?: string
  status: JunctionStatusAxes
  api_keys: { sandbox: JunctionApiKeyBlock; production: JunctionApiKeyBlock }
  webhooks: { sandbox: JunctionWebhookBlock; production: JunctionWebhookBlock }
  lab_accounts: {
    mode?: string
    linked_count: number
    total_count: number
    ambiguous_providers?: string[]
    items: JunctionLabAccountItem[]
  }
  wearables: {
    enabled: boolean
    status: string
    settings?: Record<string, unknown>
    sense?: { sandbox: JunctionSenseEnvBlock; production: JunctionSenseEnvBlock }
  }
  rotation?: { rotated: boolean; reason?: string; error?: string }
  detail?: string
}

export interface JunctionLabAccountsList {
  environment: JunctionEnvironment
  items: JunctionLabAccountItem[]
}

const base = JUNCTION_ENDPOINTS.base

export const junctionIntegrationApi = {
  get: async (clientId: string): Promise<JunctionIntegrationDetail> => {
    const { data } = await axiosInstance.get(`${base(clientId)}/`)
    return data
  },

  provision: async (
    clientId: string,
    ensureProduction = false,
    physicianOrderingMode: "junction_network" | "own_physician" = "junction_network"
  ): Promise<JunctionIntegrationDetail> => {
    const { data } = await axiosInstance.post(JUNCTION_ENDPOINTS.provision(clientId), {
      ensure_production: ensureProduction,
      physician_ordering_mode: physicianOrderingMode,
    })
    return data
  },

  syncTenant: async (
    clientId: string,
    physicianOrderingMode: "junction_network" | "own_physician"
  ): Promise<JunctionIntegrationDetail> => {
    const { data } = await axiosInstance.post(JUNCTION_ENDPOINTS.syncTenant(clientId), {
      physician_ordering_mode: physicianOrderingMode,
    })
    return data
  },

  ensureKey: async (
    clientId: string,
    environment: JunctionEnvironment
  ): Promise<JunctionIntegrationDetail> => {
    const { data } = await axiosInstance.post(
      JUNCTION_ENDPOINTS.ensureKey(clientId, environment),
      {}
    )
    return data
  },

  rotateKey: async (
    clientId: string,
    environment: JunctionEnvironment
  ): Promise<JunctionIntegrationDetail> => {
    const { data } = await axiosInstance.post(
      JUNCTION_ENDPOINTS.rotateKey(clientId, environment),
      {}
    )
    return data
  },

  ensureWebhook: async (
    clientId: string,
    environment: JunctionEnvironment
  ): Promise<JunctionIntegrationDetail> => {
    const { data } = await axiosInstance.post(
      JUNCTION_ENDPOINTS.ensureWebhook(clientId, environment),
      {}
    )
    return data
  },

  ensureSense: async (
    clientId: string,
    environment: JunctionEnvironment
  ): Promise<{ wearables: JunctionIntegrationDetail["wearables"] }> => {
    const { data } = await axiosInstance.post(JUNCTION_ENDPOINTS.ensureSense(clientId, environment), {})
    return data
  },

  setSenseAccessGranted: async (
    clientId: string,
    environment: JunctionEnvironment,
    accessGranted: boolean
  ): Promise<{ wearables: JunctionIntegrationDetail["wearables"] }> => {
    const { data } = await axiosInstance.post(
      JUNCTION_ENDPOINTS.senseAccess(clientId, environment),
      { access_granted: accessGranted }
    )
    return data
  },

  createSenseQuery: async (
    clientId: string,
    environment: JunctionEnvironment,
    payload: { name: string; slug: string; query: Record<string, unknown>; custom_inputs?: string; custom_output?: string; min_gap_seconds?: number }
  ): Promise<{ wearables: JunctionIntegrationDetail["wearables"] }> => {
    const { data } = await axiosInstance.post(
      JUNCTION_ENDPOINTS.senseQueries(clientId, environment),
      payload
    )
    return data
  },

  updateSenseQuery: async (
    clientId: string,
    environment: JunctionEnvironment,
    queryId: string,
    payload: { name?: string; query?: Record<string, unknown>; custom_inputs?: string; custom_output?: string; min_gap_seconds?: number }
  ): Promise<{ wearables: JunctionIntegrationDetail["wearables"] }> => {
    const { data } = await axiosInstance.patch(
      JUNCTION_ENDPOINTS.senseQuery(clientId, environment, queryId),
      payload
    )
    return data
  },

  deleteSenseQuery: async (
    clientId: string,
    environment: JunctionEnvironment,
    queryId: string
  ): Promise<{ wearables: JunctionIntegrationDetail["wearables"] }> => {
    const { data } = await axiosInstance.delete(
      JUNCTION_ENDPOINTS.senseQuery(clientId, environment, queryId)
    )
    return data
  },

  prepareEnvironment: async (
    clientId: string,
    environment: JunctionEnvironment
  ): Promise<JunctionIntegrationDetail> => {
    const { data } = await axiosInstance.post(
      JUNCTION_ENDPOINTS.prepareEnvironment(clientId, environment),
      {}
    )
    return data
  },

  switchEnvironment: async (
    clientId: string,
    environment: JunctionEnvironment
  ): Promise<JunctionIntegrationDetail> => {
    const { data } = await axiosInstance.post(
      JUNCTION_ENDPOINTS.switchEnvironment(clientId, environment),
      {}
    )
    return data
  },

  listLabAccounts: async (
    clientId: string,
    environment?: JunctionEnvironment
  ): Promise<JunctionLabAccountsList> => {
    const { data } = await axiosInstance.get(JUNCTION_ENDPOINTS.labAccounts(clientId), {
      params: environment ? { environment } : undefined,
    })
    return data
  },

  linkLabAccount: async (
    clientId: string,
    labAccountId: string,
    environment: JunctionEnvironment
  ): Promise<JunctionIntegrationDetail> => {
    const { data } = await axiosInstance.post(
      JUNCTION_ENDPOINTS.linkLabAccount(clientId, labAccountId),
      { environment }
    )
    return data
  },

  unlinkLabAccount: async (
    clientId: string,
    labAccountId: string,
    environment: JunctionEnvironment
  ): Promise<JunctionIntegrationDetail> => {
    const { data } = await axiosInstance.post(
      JUNCTION_ENDPOINTS.unlinkLabAccount(clientId, labAccountId),
      { environment }
    )
    return data
  },

  listWearableProviders: async (clientId?: string): Promise<{ success: boolean; sources: JunctionWearableProviderSource[] }> => {
    const { data } = await axiosInstance.get(JUNCTION_ENDPOINTS.wearablesProviders, {
      params: clientId ? { client_id: clientId } : undefined,
    })
    return data
  },

  updateWearablesSettings: async (
    settings: JunctionWearablesSettingsPayload,
    clientId?: string
  ): Promise<{ success: boolean; junction_settings: Record<string, unknown> }> => {
    const payload = clientId ? { ...settings, client_id: clientId } : settings
    const { data } = await axiosInstance.patch(JUNCTION_ENDPOINTS.wearablesSettings, payload)
    return data
  },
}
