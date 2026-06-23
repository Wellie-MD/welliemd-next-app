import { useEffect, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, KeyRound, RefreshCw, ShieldCheck, TestTube2 } from "lucide-react"
import { junctionCatalogSettingsApi, type JunctionCatalogSettings, type SyncResult } from "@/api/junctionCatalogSettings"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"

export default function JunctionLabs() {
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
    try {
      const result: SyncResult = await junctionCatalogSettingsApi.syncMarkerCatalog()
      setLastSyncedAt(result.last_synced_at)
      setLastSyncStatus("success")
      setLastSyncError(null)

      const warningNote = result.warnings.length > 0
        ? ` (${result.warnings.length} warning${result.warnings.length > 1 ? "s" : ""} — check logs)`
        : ""

      toast({
        title: "Marker catalog synced",
        description: `Created ${result.created_count}, updated ${result.updated_count}, total ${result.total_seen} markers. Labs ${result.labs_seen ?? 0}, accounts ${result.lab_accounts_seen ?? 0}.${warningNote}`,
      })
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string; error?: string } } }
      const message = err?.response?.data?.detail || err?.response?.data?.error || "Marker catalog sync failed."
      setLastSyncStatus("failed")
      setLastSyncError(message)
      toast({
        title: "Sync failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const canSync = !loading && !saving && !syncing && savedKeyDisplay !== "" && enabled

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Junction Labs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the control-plane Junction key used only for lab catalog sync and admin panel curation.
        </p>
      </div>

      <Alert className="border-blue-200 bg-blue-50 text-blue-950">
        <ShieldCheck className="h-4 w-4 text-blue-700" />
        <AlertDescription className="text-sm leading-6">
          This is a dedicated WellieMD admin/catalog Team API key. It is used to fetch real Junction markers,
          provider IDs, lab metadata, and other panel-design data for admins. It must not be used to place patient
          orders or create client-specific lab tests.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-[#12517A]" />
                  Catalog API Key
                </CardTitle>
                <CardDescription>
                  Store a dedicated Junction Team API key for catalog lookup and sync.
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
                <div className="text-sm font-medium text-foreground">Use Junction catalog sync</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Allows admin panel creation to use Junction marker/provider data.
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
                placeholder="Optional Junction Team ID for admin/catalog reference"
                value={teamId}
                onChange={event => setTeamId(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="junction-catalog-key">Catalog Team API key</Label>
              <Input
                id="junction-catalog-key"
                type="password"
                placeholder="X-Vital-API-Key for the dedicated admin/catalog Junction Team"
                value={apiKey}
                onChange={event => setApiKey(event.target.value)}
              />
              <p className="text-xs text-muted-foreground leading-5">
                This key should belong to a special catalog/admin Junction Team. Client Teams keep their own
                separate API keys and webhook secrets for strict tenant isolation.
              </p>
              {savedKeyDisplay && (
                <div className="text-xs text-muted-foreground">
                  Saved key: <code className="rounded bg-muted px-1.5 py-0.5">{savedKeyDisplay}</code>
                </div>
              )}
            </div>

            {/* Sync status row */}
            {(lastSyncedAt || lastSyncStatus === "failed") && (
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
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={saveSettings} disabled={loading || saving} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {saving ? "Saving..." : "Save settings"}
              </Button>
              <Button
                id="junction-sync-marker-catalog-btn"
                variant="outline"
                onClick={syncCatalog}
                disabled={!canSync}
                className="gap-2"
                title={
                  !savedKeyDisplay
                    ? "Save a catalog API key first"
                    : !enabled
                      ? "Enable catalog sync first"
                      : undefined
                }
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync marker catalog"}
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
                <div className="font-medium text-foreground">Admin marker picker</div>
                <div className="mt-1">Fetches real Junction biomarkers from GET /v3/lab_tests/markers.</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="font-medium text-foreground">Provider IDs</div>
                <div className="mt-1">Stores provider_id values for stable custom lab test creation.</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="font-medium text-foreground">Panel curation</div>
                <div className="mt-1">Lets admins build canonical WellieMD panels from real catalog data.</div>
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
