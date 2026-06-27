import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  junctionIntegrationApi,
  type JunctionEnvironment,
  type JunctionIntegrationDetail,
} from "@/api/junctionIntegration"
import { JunctionStatusBadges } from "./JunctionStatusBadges"
import { JunctionLabAccountsDialog } from "./JunctionLabAccountsDialog"
import { JunctionWearablesSection } from "./JunctionWearablesSection"

interface Props {
  clientId: string
}

function fmt(dt?: string | null) {
  if (!dt) return "—"
  try {
    return new Date(dt).toLocaleString()
  } catch {
    return dt
  }
}

export function JunctionIntegrationPanel({ clientId }: Props) {
  const [detail, setDetail] = useState<JunctionIntegrationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [labsOpen, setLabsOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setDetail(await junctionIntegrationApi.get(clientId))
    } catch {
      toast.error("Failed to load Junction integration.")
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    void load()
  }, [load])

  const run = async (
    key: string,
    action: () => Promise<JunctionIntegrationDetail>,
    successMsg: string
  ) => {
    setBusy(key)
    try {
      const next = await action()
      setDetail(next)
      if (next.detail) toast.warning(next.detail)
      else toast.success(successMsg)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || "Action failed.")
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading Junction integration…</div>
  }
  if (!detail) return null

  const provisioned = Boolean(detail.team_id)
  const env: JunctionEnvironment = detail.active_environment ?? "sandbox"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Junction Integration</h3>
          <p className="text-sm text-muted-foreground">
            Lab ordering routes through this client's Junction team. API keys are managed by the
            control plane and never shown in full.
          </p>
        </div>
        <JunctionStatusBadges status={detail.status} />
      </div>

      {detail.status.blocking_reason && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {detail.status.blocking_reason}
        </div>
      )}

      {/* Team section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Team ID</div>
              <div className="font-mono">{detail.team_id || "— not provisioned —"}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Integration team ID
              </div>
              <div className="font-mono">{detail.integration_team_id}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Region</div>
              <div>{detail.region ?? "us"}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Active environment
              </div>
              <div>{env}</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Last synced: {fmt(detail.last_synced_at)}
            {detail.last_sync_status ? ` · ${detail.last_sync_status}` : ""}
            {detail.last_sync_error ? ` · ${detail.last_sync_error}` : ""}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={busy !== null}
              onClick={() =>
                run("provision", () => junctionIntegrationApi.provision(clientId), "Team provisioned.")
              }
            >
              {provisioned ? "Re-provision" : "Provision team"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null || !provisioned}
              onClick={() =>
                run("sync", () => junctionIntegrationApi.syncTenant(clientId), "Synced to tenant.")
              }
            >
              Sync to tenant
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API keys section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Team API keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-xs text-muted-foreground">
            Junction returns each key only once. Keys are stored securely; only a masked value is
            shown here.
          </p>
          {(["sandbox", "production"] as JunctionEnvironment[]).map((environment) => {
            const block = detail.api_keys[environment]
            return (
              <div
                key={environment}
                className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2"
              >
                <span className="min-w-[84px] rounded-full bg-muted px-2 py-0.5 text-center text-xs font-medium capitalize">
                  {environment}
                </span>
                <code className="flex-1 min-w-[160px] font-mono text-xs text-muted-foreground">
                  {block.exists ? block.masked || "stored securely" : "— not created —"}
                </code>
                <span className="text-xs text-muted-foreground">
                  {block.exists ? fmt(block.created_at) : ""}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy !== null || !provisioned}
                  onClick={() =>
                    run(
                      `ensure-${environment}`,
                      () => junctionIntegrationApi.ensureKey(clientId, environment),
                      "API key ensured."
                    )
                  }
                >
                  Ensure
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy !== null || !block.exists}
                  onClick={() =>
                    run(
                      `rotate-${environment}`,
                      () => junctionIntegrationApi.rotateKey(clientId, environment),
                      "Rotation completed."
                    )
                  }
                >
                  Rotate
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Lab accounts section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Lab accounts</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm">
          <span>
            <strong>{detail.lab_accounts.linked_count}</strong> of {detail.lab_accounts.total_count}{" "}
            lab accounts linked ({env})
          </span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            disabled={!provisioned}
            onClick={() => setLabsOpen(true)}
          >
            Manage lab accounts
          </Button>
        </CardContent>
      </Card>

      {/* Wearables (UI-only) */}
      <JunctionWearablesSection initialEnabled={Boolean(detail.wearables?.enabled)} />

      <JunctionLabAccountsDialog
        open={labsOpen}
        onOpenChange={setLabsOpen}
        clientId={clientId}
        environment={env}
        ambiguousProviders={detail.lab_accounts.ambiguous_providers ?? []}
        onChanged={setDetail}
      />
    </div>
  )
}

export default JunctionIntegrationPanel
