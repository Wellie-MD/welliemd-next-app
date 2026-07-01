import axiosInstance from "./axiosInstance"

export interface JunctionCatalogSettings {
  id: string
  enabled: boolean
  environment: "sandbox" | "production"
  region: "us" | "eu"
  base_url: string
  team_id: string
  api_key_display: string
  has_api_key: boolean
  last_synced_at?: string | null
  last_sync_status?: string
  last_sync_error?: string
}

export interface JunctionCatalogSettingsPayload {
  enabled: boolean
  environment: "sandbox" | "production"
  region: "us" | "eu"
  base_url?: string
  team_id?: string
  api_key?: string
}

export interface SyncResult {
  success: boolean
  created_count: number
  updated_count: number
  total_seen: number
  labs_seen?: number
  lab_accounts_seen?: number
  last_synced_at: string
  warnings: string[]
}

export interface SyncJobResponse {
  job_id: string
  status: string
  message: string
}

export interface SyncStatusResponse {
  job_id: string
  status: string
  trigger: string
  current_page: number
  total_pages: number | null
  total_seen: number
  created_count: number
  updated_count: number
  inactive_count: number
  started_at: string | null
  finished_at: string | null
  error_message: string
  last_successful_sync_at: string | null
}

export const junctionCatalogSettingsApi = {
  get: async (): Promise<JunctionCatalogSettings> => {
    const { data } = await axiosInstance.get("integrations/admin/junction/catalog-config/")
    return data
  },

  update: async (payload: JunctionCatalogSettingsPayload): Promise<JunctionCatalogSettings> => {
    const { data } = await axiosInstance.patch("integrations/admin/junction/catalog-config/", payload)
    return data
  },

  syncReferenceCatalog: async (): Promise<SyncJobResponse> => {
    const { data } = await axiosInstance.post("admin/labs/catalog/sync/")
    return data
  },

  getReferenceCatalogSyncStatus: async (jobId?: string): Promise<SyncStatusResponse> => {
    const { data } = await axiosInstance.get("admin/labs/catalog/sync/status/", {
      params: { job_id: jobId },
    })
    return data
  },
}
