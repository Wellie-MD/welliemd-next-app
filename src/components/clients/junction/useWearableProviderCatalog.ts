import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react"
import { toast } from "sonner"

import { junctionIntegrationApi, type JunctionWearableProviderSource } from "@/api/junctionIntegration"
import type { WearableProvider, WearAuth } from "./wearableCatalog"

function providerCategory(slug: string): string {
  const value = slug.toLowerCase()
  if (value.includes("libre") || value.includes("dexcom") || value.includes("accu")) return "CGM"
  if (value.includes("scale") || value.includes("renpho") || value.includes("withings")) return "Smart scale"
  if (value.includes("sleep")) return "Sleep"
  if (value.includes("omron") || value.includes("beurer")) return "Blood pressure"
  if (value.includes("kardia")) return "ECG"
  if (value.includes("apple") || value.includes("healthconnect") || value.includes("samsung")) return "On-device"
  if (["strava", "wahoo", "peloton", "zwift", "fit"].some((name) => value.includes(name))) return "App"
  return "Wearable"
}

function mapProvider(source: JunctionWearableProviderSource): WearableProvider {
  const raw = source.raw_snapshot ?? {}
  const authType = typeof raw.auth_type === "string" ? raw.auth_type : "oauth"
  return {
    id: source.slug,
    name: source.name,
    cat: providerCategory(source.slug),
    auth: authType as WearAuth,
    pull: source.client_pull_window_days ?? 90,
    enabled: source.client_enabled ?? false,
    domain: `${source.slug}.com`,
    logoFile: source.logo_url || `${source.slug}.png`,
  }
}

interface CatalogOptions {
  clientId?: string
  domains: string[]
  setPriority: Dispatch<SetStateAction<Record<string, string[]>>>
}

export function useWearableProviderCatalog({ clientId, domains, setPriority }: CatalogOptions) {
  const [providers, setProviders] = useState<WearableProvider[]>([])
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [refreshVersion, setRefreshVersion] = useState(0)

  const refreshProviders = useCallback(() => {
    setRefreshVersion((current) => current + 1)
  }, [])

  useEffect(() => {
    let active = true
    async function fetchProviders() {
      setLoadingProviders(true)
      try {
        const response = await junctionIntegrationApi.listWearableProviders(
          clientId,
          refreshVersion > 0
        )
        if (!active || !response.success) return
        const mapped = response.sources.map(mapProvider)
        setProviders(mapped)
        setPriority((current) => {
          const fetchedIds = mapped.map((provider) => provider.id)
          const next = { ...current }
          domains.forEach((domain) => {
            const existing = current[domain] ?? []
            const kept = existing.filter((id) => fetchedIds.includes(id))
            next[domain] = [...kept, ...fetchedIds.filter((id) => !existing.includes(id))]
          })
          return next
        })
      } catch {
        toast.error("Failed to load wearable providers from the control plane.")
      } finally {
        if (active) setLoadingProviders(false)
      }
    }
    void fetchProviders()
    return () => {
      active = false
    }
  }, [clientId, domains, refreshVersion, setPriority])

  return { providers, setProviders, loadingProviders, refreshProviders }
}
