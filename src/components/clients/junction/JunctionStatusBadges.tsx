import { Badge } from "@/components/ui/badge"
import type { JunctionStatusAxes } from "@/api/junctionIntegration"

const INTEGRATION_LABELS: Record<string, string> = {
  not_provisioned: "Not provisioned",
  team_created: "Team created",
  keys_missing: "Keys missing",
  tenant_sync_failed: "Tenant sync failed",
  connected: "Connected",
}

const LABS_LABELS: Record<string, string> = {
  lab_accounts_missing: "No lab accounts linked",
  ambiguous_lab_account: "Ambiguous lab account",
  ready: "Labs ready",
}

function tone(ok: boolean, warn = false): "default" | "secondary" | "destructive" | "outline" {
  if (ok) return "default"
  if (warn) return "outline"
  return "destructive"
}

export function JunctionStatusBadges({ status }: { status: JunctionStatusAxes }) {
  const integrationOk = status.integration_status === "connected"
  const integrationWarn = status.integration_status === "team_created"
  const labsOk = status.labs_status === "ready"
  const labsWarn = status.labs_status === "ambiguous_lab_account"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={tone(integrationOk, integrationWarn)}>
        Integration: {INTEGRATION_LABELS[status.integration_status] ?? status.integration_status}
      </Badge>
      <Badge variant={tone(labsOk, labsWarn)}>
        Labs: {LABS_LABELS[status.labs_status] ?? status.labs_status}
      </Badge>
      <Badge variant={status.checkout_ready ? "default" : "secondary"}>
        {status.checkout_ready ? "Checkout ready" : "Checkout blocked"}
      </Badge>
    </div>
  )
}
