import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ArrowDown, ArrowUp, Search, Watch } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { junctionIntegrationApi } from "@/api/junctionIntegration"
import {
  AUTH_LABEL,
  WEAR_PRIORITY,
  type WearableProvider,
  type WearAuth,
} from "./wearableCatalog"

const AUTH_CLASS: Record<string, string> = {
  oauth: "bg-blue-50 text-blue-700 border-blue-200",
  sdk: "bg-purple-50 text-purple-700 border-purple-200",
  email: "bg-teal-50 text-teal-700 border-teal-200",
}

const CATEGORY_CLASS: Record<string, string> = {
  "smart ring": "bg-violet-50 text-violet-700 border-violet-200",
  wearable: "bg-purple-50 text-purple-700 border-purple-200",
  cgm: "bg-emerald-50 text-emerald-700 border-emerald-200",
  app: "bg-blue-50 text-blue-700 border-blue-200",
  "smart scale": "bg-orange-50 text-orange-700 border-orange-200",
  "on-device": "bg-slate-100 text-slate-700 border-slate-200",
  sleep: "bg-cyan-50 text-cyan-700 border-cyan-200",
  nutrition: "bg-amber-50 text-amber-700 border-amber-200",
  "blood pressure": "bg-rose-50 text-rose-700 border-rose-200",
  ecg: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
}

function getCategoryTone(category: string) {
  return CATEGORY_CLASS[category.toLowerCase()] ?? "bg-slate-100 text-slate-700 border-slate-200"
}

function getCategoryFromSlugAndResources(slug: string, resources: string[]): string {
  const s = slug.toLowerCase()
  if (s.includes("libre") || s.includes("dexcom") || s.includes("accu")) return "CGM"
  if (s.includes("scale") || s.includes("renpho") || s.includes("withings")) return "Smart scale"
  if (s.includes("sleep")) return "Sleep"
  if (s.includes("omron") || s.includes("beurer")) return "Blood pressure"
  if (s.includes("kardia")) return "ECG"
  if (s.includes("apple") || s.includes("healthconnect") || s.includes("samsung")) return "On-device"
  if (s.includes("strava") || s.includes("wahoo") || s.includes("peloton") || s.includes("zwift") || s.includes("fit")) return "App"
  return "Wearable"
}

type FilterKey = "all" | "wearables" | "cgm" | "apps"

interface Props {
  clientId?: string
  initialEnabled?: boolean
  labAccountsCard: ReactNode
}

export function JunctionWearablesSection({ clientId, initialEnabled = false, labAccountsCard }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterKey>("all")
  const [providers, setProviders] = useState<WearableProvider[]>([])
  const [priority, setPriority] = useState<string[]>(() => [...WEAR_PRIORITY])
  const [loadingProviders, setLoadingProviders] = useState(true)

  useEffect(() => {
    let active = true
    async function fetchProviders() {
      try {
        const response = await junctionIntegrationApi.listWearableProviders(clientId)
        if (response.success && active && response.sources?.length > 0) {
          const mapped: WearableProvider[] = response.sources.map((src: any) => {
            const raw = src.raw_snapshot || {}
            return {
              id: src.slug,
              name: src.name,
              cat: getCategoryFromSlugAndResources(src.slug, raw.supported_resources || []),
              auth: (raw.auth_type || "oauth") as WearAuth,
              pull: src.client_pull_window_days ?? 90,
              enabled: src.client_enabled ?? true,
              domain: `${src.slug}.com`,
              logoFile: src.logo_url || `${src.slug}.png`,
            }
          })
          setProviders(mapped)
          
          setPriority((current) => {
            const fetchedIds = mapped.map(p => p.id)
            const remaining = current.filter(id => !fetchedIds.includes(id))
            return [...fetchedIds, ...remaining]
          })
        }
      } catch (err) {
        console.error("Failed to load wearable providers from db:", err)
      } finally {
        if (active) setLoadingProviders(false)
      }
    }
    void fetchProviders()
    return () => {
      active = false
    }
  }, [])

  const providerMap = useMemo(() => {
    const map = new Map<string, WearableProvider>()
    providers.forEach((provider) => map.set(provider.id, provider))
    return map
  }, [providers])

  const visibleProviders = useMemo(() => {
    const term = search.trim().toLowerCase()
    return providers.filter((provider) => {
      if (filter === "wearables") {
        const cat = provider.cat.toLowerCase()
        if (!["wearable", "smart ring", "smart scale", "on-device", "sleep"].includes(cat)) {
          return false
        }
      }
      if (filter === "cgm" && provider.cat.toLowerCase() !== "cgm") return false
      if (filter === "apps" && provider.cat.toLowerCase() !== "app") return false
      if (!term) return true
      return (
        provider.name.toLowerCase().includes(term) ||
        provider.cat.toLowerCase().includes(term) ||
        AUTH_LABEL[provider.auth].toLowerCase().includes(term)
      )
    })
  }, [filter, providers, search])

  const visiblePriority = useMemo(
    () => priority.filter((id) => providerMap.get(id)?.enabled),
    [priority, providerMap]
  )

  const saveProviderConfigs = async (nextProviders: WearableProvider[]) => {
    const configs: Record<string, { enabled: boolean; pull_window_days: number }> = {}
    nextProviders.forEach((p) => {
      configs[p.id] = {
        enabled: p.enabled,
        pull_window_days: p.pull,
      }
    })
    try {
      await junctionIntegrationApi.updateWearablesSettings({
        provider_configs: configs,
      }, clientId)
    } catch (err) {
      console.error("Failed to save provider configs:", err)
      toast.error("Failed to save wearable provider configuration.")
    }
  }

  const handleToggleEnabled = async (checked: boolean) => {
    setEnabled(checked)
    try {
      await junctionIntegrationApi.updateWearablesSettings({
        enabled: checked,
      }, clientId)
      toast.success(checked ? "Wearable sync enabled." : "Wearable sync disabled.")
    } catch (err) {
      console.error("Failed to update wearables settings:", err)
      toast.error("Failed to update wearables setting.")
      setEnabled(!checked)
    }
  }

  const toggleProvider = (id: string, checked: boolean) => {
    setProviders((current) => {
      const next = current.map((provider) =>
        provider.id === id ? { ...provider, enabled: checked } : provider
      )
      void saveProviderConfigs(next)
      return next
    })
  }

  const changePullWindow = (id: string, value: string) => {
    const parsed = Number(value)
    const nextVal = Number.isFinite(parsed) ? Math.max(1, Math.min(365, parsed)) : 90
    setProviders((current) => {
      const next = current.map((provider) =>
        provider.id === id ? { ...provider, pull: nextVal } : provider
      )
      void saveProviderConfigs(next)
      return next
    })
  }

  const movePriority = (id: string, direction: -1 | 1) => {
    setPriority((current) => {
      const index = current.indexOf(id)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current
      const next = [...current]
      ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {labAccountsCard}

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Watch className="w-4 h-4 text-sky-500" />
              Patient Wearable Sync
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Let patients link smart bands, scales, and trackers directly.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
              <div>
                <div className="font-medium text-sm">Enable wearable sync</div>
                <div className="text-xs text-muted-foreground">
                  Enable patient wearable tracking for this tenant
                </div>
              </div>
              <Switch checked={enabled} onCheckedChange={handleToggleEnabled} />
            </div>

            <div className="rounded-xl border bg-muted/20 px-4 py-3">
              <div className="text-xs font-semibold text-foreground">Device integration rule</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Biometric telemetry feeds directly into active provider views. Individual source
                metrics remain read-only until the wearable backend is implemented.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.82fr)] gap-6 items-start">
        <Card className="rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Provider Catalog</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Configure telemetry nodes, check status connections, and historic sync data
                  limits. Changes here are dynamically saved to the database.
                </p>
              </div>
              <Badge variant="outline" className="self-start">
                Max backfill limit: 365 days
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                  placeholder="Filter by provider name..."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {(["all", "wearables", "cgm", "apps"] as FilterKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      filter === key
                        ? "border-sky-200 bg-sky-50 text-sky-700"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {key === "all"
                      ? "All"
                      : key === "wearables"
                      ? "Wearables"
                      : key === "cgm"
                      ? "CGM"
                      : "Apps"}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <table className="w-full">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Provider</th>
                    <th className="px-3 py-3 text-left">Category</th>
                    <th className="px-3 py-3 text-left">Auth Type</th>
                    <th className="px-3 py-3 text-left">Historical Pull Window</th>
                    <th className="px-4 py-3 text-right">Offered State</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingProviders && providers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Loading wearable providers from database...
                      </td>
                    </tr>
                  ) : visibleProviders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No providers found.
                      </td>
                    </tr>
                  ) : (
                    visibleProviders.map((provider) => (
                      <tr key={provider.id} className="border-t">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md border bg-slate-50 text-[10px] font-bold text-slate-500">
                              {provider.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-sm">{provider.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "inline-block rounded-full border px-2 py-0.5 text-[10.5px] font-medium",
                              getCategoryTone(provider.cat)
                            )}
                          >
                            {provider.cat}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "inline-block rounded-full border px-2 py-0.5 text-[10.5px] font-medium",
                              AUTH_CLASS[provider.auth]
                            )}
                          >
                            {AUTH_LABEL[provider.auth]}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {provider.auth === "email" ? (
                            <span className="text-xs italic text-muted-foreground">provider-set</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                max={365}
                                value={provider.pull}
                                onChange={(event) =>
                                  changePullWindow(provider.id, event.target.value)
                                }
                                className="h-8 w-20 font-mono text-xs"
                              />
                              <span className="text-xs text-muted-foreground">days</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end">
                            <Switch
                              checked={enabled && provider.enabled}
                              onCheckedChange={(checked) => toggleProvider(provider.id, checked)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

             <div className="flex items-center justify-between text-xs text-muted-foreground">
               <span>Showing {visibleProviders.length} of {providers.length} platforms</span>
               <span>Changes auto-saved to database</span>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Data Prioritization</CardTitle>
            <p className="text-xs text-muted-foreground">
              If patients map overlapping hardware, the top-most active entry in this queue wins
              over other metric outputs. This ordering is local preview state only right now.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {visiblePriority.map((id, index) => {
              const provider = providerMap.get(id)
              if (!provider) return null

              return (
                <div
                  key={id}
                  className="flex items-center gap-3 rounded-xl border bg-card px-3 py-3"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md border bg-muted text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{provider.name}</div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {provider.cat}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => movePriority(id, -1)}
                      disabled={index === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                      aria-label={`Move ${provider.name} up`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePriority(id, 1)}
                      disabled={index === visiblePriority.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                      aria-label={`Move ${provider.name} down`}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}

            <div className="pt-2 text-[11px] text-muted-foreground">
              Use the up and down controls to organize execution ranking.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default JunctionWearablesSection
