import axiosInstance from "./axiosInstance"

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

export interface JunctionIntegrationDetail {
  client_id: string
  team_id: string
  integration_team_id: string
  region?: "us" | "eu"
  active_environment?: JunctionEnvironment
  enabled?: boolean
  last_provisioned_at?: string | null
  last_synced_at?: string | null
  last_sync_status?: string
  last_sync_error?: string
  status: JunctionStatusAxes
  api_keys: { sandbox: JunctionApiKeyBlock; production: JunctionApiKeyBlock }
  lab_accounts: {
    linked_count: number
    total_count: number
    ambiguous_providers?: string[]
    items: JunctionLabAccountItem[]
  }
  wearables: { enabled: boolean; status: string; settings?: Record<string, unknown> }
  rotation?: { rotated: boolean; reason?: string; error?: string }
  detail?: string
}

export interface JunctionLabAccountsList {
  environment: JunctionEnvironment
  items: JunctionLabAccountItem[]
}

const base = (clientId: string) => `clients/${clientId}/integrations/junction`

export const junctionIntegrationApi = {
  get: async (clientId: string): Promise<JunctionIntegrationDetail> => {
    const { data } = await axiosInstance.get(`${base(clientId)}/`)
    return data
  },

  provision: async (
    clientId: string,
    ensureProduction = false
  ): Promise<JunctionIntegrationDetail> => {
    const { data } = await axiosInstance.post(`${base(clientId)}/provision/`, {
      ensure_production: ensureProduction,
    })
    return data
  },

  syncTenant: async (clientId: string): Promise<JunctionIntegrationDetail> => {
    const { data } = await axiosInstance.post(`${base(clientId)}/sync-tenant/`, {})
    return data
  },

  ensureKey: async (
    clientId: string,
    environment: JunctionEnvironment
  ): Promise<JunctionIntegrationDetail> => {
    const { data } = await axiosInstance.post(
      `${base(clientId)}/api-keys/${environment}/ensure/`,
      {}
    )
    return data
  },

  rotateKey: async (
    clientId: string,
    environment: JunctionEnvironment
  ): Promise<JunctionIntegrationDetail> => {
    const { data } = await axiosInstance.post(
      `${base(clientId)}/api-keys/${environment}/rotate/`,
      {}
    )
    return data
  },

  listLabAccounts: async (
    clientId: string,
    environment?: JunctionEnvironment
  ): Promise<JunctionLabAccountsList> => {
    const { data } = await axiosInstance.get(`${base(clientId)}/lab-accounts/`, {
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
      `${base(clientId)}/lab-accounts/${labAccountId}/link/`,
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
      `${base(clientId)}/lab-accounts/${labAccountId}/unlink/`,
      { environment }
    )
    return data
  },
}
