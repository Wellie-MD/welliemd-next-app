import { useEffect, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, KeyRound, RefreshCw, ShieldCheck, TestTube2 } from "lucide-react"
import {
  junctionCatalogSettingsApi,
  type JunctionCatalogSettings,
  type SyncStatusResponse,
} from "@/api/junctionCatalogSettings"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"

interface JunctionLabsProps {
  embedded?: boolean
}

function toProgress(status: SyncStatusResponse) {
  return {
    current_page: status.current_page,
    total_pages: status.total_pages,
    total_seen: status.total_seen,
    created_count: status.created_count,
    updated_count: status.updated_count,
    status: status.status,
  }
}

export default function JunctionLabs({ embedded = false }: JunctionLabsProps) {
  const [enabled, setEnabled] = useState(true)
  const [environment, setEnvironment] = useState("sandbox-us")
  const [apiKey, setApiKey] = useState("")
  const [teamId, setTeamId] = useState("")
  const [savedKeyDisplay, setSavedKeyDisplay] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [lastSyncStatus, setLastSyncStatus] = useState<string | null>(null)
  const [lastSyncError, setLastSyncError] = useState<string | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  // Polling state
  const [progress, setProgress] = useState<{
    current_page: number
    total_pages: number | null
    total_seen: number
    created_count: number
    updated_count: number
    status: string
  } | null>(null)

  const apiBase = useMemo(() => {
    if (environment === "production-us") return "https://api.us.junction.com"
    if (environment === "production-eu") return "https://api.eu.junction.com"
    if (environment === "sandbox-eu") return "https://api.sandbox.eu.junction.com"
    return "https://api.sandbox.us.junction.com"
  }, [environment])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data: JunctionCatalogSettings = await junctionCatalogSettingsApi.get()
        setEnabled(data.enabled)
        setEnvironment(`${data.environment}-${data.region}`)
        setTeamId(data.team_id || "")
        setSavedKeyDisplay(data.api_key_display || "")
        setLastSyncedAt(data.last_synced_at ?? null)
        setLastSyncStatus(data.last_sync_status ?? null)
        setLastSyncError(data.last_sync_error ?? null)
        const latestJob = await junctionCatalogSettingsApi.getReferenceCatalogSyncStatus()
        if (["queued", "running"].includes(latestJob.status)) {
          setActiveJobId(latestJob.job_id)
          setSyncing(true)
          setProgress(toProgress(latestJob))
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string } } }
        toast({
          title: "Unable to load Junction settings",
          description: err?.response?.data?.detail || "Check admin permissions and backend availability.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  useEffect(() => {
    if (!activeJobId) return
    let active = true

    const poll = async () => {
      try {
        const statusRes = await junctionCatalogSettingsApi.getReferenceCatalogSyncStatus(activeJobId)
        if (!active) return
        setProgress(toProgress(statusRes))

        if (statusRes.status === "success") {
          setActiveJobId(null)
          setSyncing(false)
          setProgress(null)
          setLastSyncedAt(statusRes.last_successful_sync_at)
          setLastSyncStatus("success")
          setLastSyncError(null)
          toast({
            title: "Reference catalog synced",
            description: `Created ${statusRes.created_count}, updated ${statusRes.updated_count}, total ${statusRes.total_seen} items.`,
          })
        } else if (statusRes.status === "failed") {
          setActiveJobId(null)
          setSyncing(false)
          setProgress(null)
          setLastSyncStatus("failed")
          setLastSyncError(statusRes.error_message)
          toast({
            title: "Sync failed",
            description: statusRes.error_message || "Reference catalog sync failed.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error polling reference catalog sync status:", error)
      }
    }

    void poll()
    const pollInterval = window.setInterval(poll, 3000)
    return () => {
      active = false
      window.clearInterval(pollInterval)
    }
  }, [activeJobId])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const [env, region] = environment.split("-") as ["sandbox" | "production", "us" | "eu"]
      const payload = {
        enabled,
        environment: env,
        region,
        base_url: apiBase,
        team_id: teamId,
        ...(apiKey.trim() ? { api_key: apiKey.trim() } : {}),
      }
      const saved = await junctionCatalogSettingsApi.update(payload)
      setApiKey("")
      setSavedKeyDisplay(saved.api_key_display || "")
      toast({
        title: "Junction catalog settings saved",
        description: "The catalog API key is stored server-side and only the masked value is shown.",
      })
    } catch (error: unknown) {
      const err = error as { response?: { data?: { api_key?: string; detail?: string } } }
      toast({
        title: "Save failed",
        description:
          err?.response?.data?.api_key ||
          err?.response?.data?.detail ||
          "Unable to save Junction catalog settings.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const syncCatalog = async () => {
    setSyncing(true)
    setProgress({
      current_page: 0,
      total_pages: null,
      total_seen: 0,
      created_count: 0,
      updated_count: 0,
      status: "queued",
    })

    try {
      const response = await junctionCatalogSettingsApi.syncReferenceCatalog()
      setActiveJobId(response.job_id)
    } catch (error: unknown) {
      setSyncing(false)
      setProgress(null)
      const err = error as { response?: { data?: { detail?: string; error?: string } } }
      const message = err?.response?.data?.detail || err?.response?.data?.error || "Reference catalog sync initiation failed."
      setLastSyncStatus("failed")
      setLastSyncError(message)
      toast({
        title: "Sync failed",
        description: message,
        variant: "destructive",
      })
    }
  }

  const canSync = !loading && !saving && !syncing && savedKeyDisplay !== "" && enabled

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {!embedded && (
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Junction Labs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the control-plane Junction key used only for reference-catalog sync and admin panel curation.
          </p>
        </div>
      )}

      <Alert className="border-blue-200 bg-blue-50 text-blue-950">
        <ShieldCheck className="h-4 w-4 text-blue-700" />
        <AlertDescription className="text-sm leading-6">
          This is a dedicated WellieMD admin/catalog Team API key. It is used to fetch the Junction reference
          catalog for admin panel curation. It must not be used to place patient orders or create client-specific
          lab tests.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-[#12517A]" />
                  Reference Catalog API Key
                </CardTitle>
                <CardDescription>
                  Store a dedicated Junction Team API key for reference-catalog lookup and sync.
                </CardDescription>
              </div>
              <Badge variant={enabled ? "default" : "secondary"}>
                {enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between rounded-md border bg-muted/20 p-3">
              <div>
                <div className="text-sm font-medium text-foreground">Use Junction reference catalog sync</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Enables syncing the control-plane reference catalog used by admin panel creation.
                </div>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="junction-catalog-environment">Environment</Label>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger id="junction-catalog-environment">
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox-us">Sandbox US</SelectItem>
                    <SelectItem value="production-us">Production US</SelectItem>
                    <SelectItem value="sandbox-eu">Sandbox EU</SelectItem>
                    <SelectItem value="production-eu">Production EU</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="junction-catalog-region">API base</Label>
                <Input
                  id="junction-catalog-region"
                  value={apiBase}
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="junction-catalog-team">Catalog Team ID</Label>
              <Input
                id="junction-catalog-team"
                placeholder="Optional Junction Team ID for admin reference catalog"
                value={teamId}
                onChange={event => setTeamId(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="junction-catalog-key">Catalog Team API key</Label>
              <Input
                id="junction-catalog-key"
                type="password"
                placeholder="X-Vital-API-Key for the dedicated admin reference-catalog Team"
                value={apiKey}
                onChange={event => setApiKey(event.target.value)}
              />
              <p className="text-xs text-muted-foreground leading-5">
                This key should belong to a special catalog/admin Junction Team. Save these settings first, then run
                the reference sync so the create-panel modal can query local catalog rows. Client Teams keep their own
                separate API keys and webhook secrets for strict tenant isolation.
              </p>
              {savedKeyDisplay && (
                <div className="text-xs text-muted-foreground">
                  Saved key: <code className="rounded bg-muted px-1.5 py-0.5">{savedKeyDisplay}</code>
                </div>
              )}
            </div>

            {/* Sync status / progress row */}
            {progress ? (
              <div className="rounded-lg border p-4 space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="capitalize">Syncing state: {progress.status}</span>
                  {progress.total_pages ? (
                    <span>
                      Page {progress.current_page} of {progress.total_pages}
                    </span>
                  ) : (
                    <span>Fetching pages…</span>
                  )}
                </div>
                {progress.total_pages && (
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (progress.current_page / progress.total_pages) * 100
                        )}%`,
                      }}
                    />
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white border rounded p-2">
                    <p className="text-muted-foreground font-medium text-[10px] uppercase">Seen</p>
                    <p className="font-semibold text-slate-900 font-mono mt-0.5">{progress.total_seen}</p>
                  </div>
                  <div className="bg-white border rounded p-2">
                    <p className="text-muted-foreground font-medium text-[10px] uppercase">Created</p>
                    <p className="font-semibold text-blue-700 font-mono mt-0.5">{progress.created_count}</p>
                  </div>
                  <div className="bg-white border rounded p-2">
                    <p className="text-muted-foreground font-medium text-[10px] uppercase">Updated</p>
                    <p className="font-semibold text-blue-700 font-mono mt-0.5">{progress.updated_count}</p>
                  </div>
                </div>
              </div>
            ) : (
              (lastSyncedAt || lastSyncStatus === "failed") && (
                <div className="rounded-md border bg-muted/10 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                  {lastSyncStatus === "success" && lastSyncedAt && (
                    <div className="flex items-center gap-1.5 text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      Last synced: {new Date(lastSyncedAt).toLocaleString()}
                    </div>
                  )}
                  {lastSyncStatus === "failed" && (
                    <div className="flex items-start gap-1.5 text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>Last sync failed{lastSyncError ? `: ${lastSyncError}` : "."}</span>
                    </div>
                  )}
                </div>
              )
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={saveSettings} disabled={loading || saving} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {saving ? "Saving..." : "Save settings"}
              </Button>
              <Button
                id="junction-sync-reference-catalog-btn"
                variant="outline"
                onClick={syncCatalog}
                disabled={!canSync}
                className="gap-2"
                title={
                  !savedKeyDisplay
                    ? "Save a catalog API key first"
                    : !enabled
                      ? "Enable reference catalog sync first"
                      : undefined
                }
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync reference catalog"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TestTube2 className="h-4 w-4 text-[#12517A]" />
                What This Key Powers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-md border p-3">
                <div className="font-medium text-foreground">Admin reference catalog</div>
                <div className="mt-1">Fetches Junction's broad marker/test catalog into the control-plane database for fast curation.</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="font-medium text-foreground">Provider IDs</div>
                <div className="mt-1">Stores stable provider/test identifiers and expanded marker composition.</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="font-medium text-foreground">Panel curation</div>
                <div className="mt-1">Lets admins build canonical WellieMD panels from synced catalog items, then expand them to marker provider IDs on save.</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tenant Boundary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                This catalog key does not replace client Junction Teams. When a panel is assigned to a client,
                WellieMD must still create that custom lab test under the client's own Junction Team.
              </p>
              <p>
                The assignment stores the client-scoped lab_test_id, status, lab account, and orderability.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
