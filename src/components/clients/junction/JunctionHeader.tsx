import { GitMerge, RefreshCcw, ShieldCheck, Send, AlertCircle, Copy } from "lucide-react"
import { JunctionStatusBadges } from "./JunctionStatusBadges"
import type { JunctionIntegrationDetail } from "@/api/junctionIntegration"
import { junctionIntegrationApi } from "@/api/junctionIntegration"
import { toast } from "sonner"
import { useState } from "react"
import { JUNCTION_ORDERING_MODE_LABELS } from "./junctionOrderingPolicy"

interface Props {
  detail: JunctionIntegrationDetail
  clientId: string
  busy: string | null
  run: (key: string, action: () => Promise<JunctionIntegrationDetail>, successMsg: string) => Promise<void>
}

export function JunctionHeader({ detail, clientId, busy, run }: Props) {
  const provisioned = Boolean(detail.team_id)
  const env = detail.active_environment ?? "sandbox"
  const [orderingMode, setOrderingMode] = useState<"junction_network" | "own_physician">(
    detail.physician_ordering_mode === "own_physician" ? "own_physician" : "junction_network"
  )

  const fmt = (dt?: string | null) => {
    if (!dt) return "—"
    try {
      return new Date(dt).toLocaleString()
    } catch {
      return dt
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <div className="bg-card rounded-2xl border p-5 sm:p-6 shadow-sm space-y-6">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
              <GitMerge className="w-4.5 h-4.5 text-primary" /> Junction Integration
            </h2>
            <JunctionStatusBadges status={detail.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Provision the client's Junction team, manage environment credentials, and sync the tenant runtime.
          </p>
        </div>
        
        {/* Environment controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={busy !== null}
            onClick={() =>
              run("provision", () => junctionIntegrationApi.provision(clientId, false, orderingMode), "Team provisioned.")
            }
            className="px-3 py-1.5 text-xs font-semibold bg-background border hover:bg-muted rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-muted-foreground" />{" "}
            {provisioned ? "Provision again" : "Provision team"}
          </button>

          <select
            value={orderingMode}
            onChange={(event) => setOrderingMode(event.target.value as typeof orderingMode)}
            disabled={busy !== null}
            aria-label="Junction ordering mode"
            className="px-2.5 py-1.5 text-xs font-semibold bg-background border rounded-lg disabled:opacity-50"
          >
            {Object.entries(JUNCTION_ORDERING_MODE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          
          <button
            disabled={busy !== null || !provisioned || env === "sandbox"}
            onClick={() => run("switch-sandbox", () => junctionIntegrationApi.switchEnvironment(clientId, "sandbox"), "Switched to sandbox.")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 ${env === "sandbox" ? "bg-amber-50 border-amber-200 text-amber-700 border" : "bg-background border hover:bg-muted"}`}
          >
            {env === "sandbox" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>} Sandbox
          </button>
          
          <button
            disabled={busy !== null || !provisioned || env === "production"}
            onClick={() => run("switch-production", () => junctionIntegrationApi.switchEnvironment(clientId, "production"), "Switched to production.")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 ${env === "production" ? "bg-emerald-50 border-emerald-200 text-emerald-700 border" : "bg-background border hover:bg-muted"}`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" /> Production
          </button>
          
          <button
            disabled={busy !== null || !provisioned}
            onClick={() => run("sync", () => junctionIntegrationApi.syncTenant(clientId, orderingMode), "Synced to tenant.")}
            className="px-3 py-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Sync to Tenant
          </button>
        </div>
      </div>

      {detail.status.blocking_reason && (
        <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive shadow-sm">
          <div className="p-1.5 bg-destructive/20 rounded-lg shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <span className="font-bold">Integration Alert:</span>
            <p className="leading-relaxed opacity-90">{detail.status.blocking_reason}</p>
          </div>
        </div>
      )}

      {/* System environment details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-muted/30 border hover:border-border/80 rounded-xl p-4 transition-colors">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Team ID</span>
          <div className="font-mono text-[11px] font-medium mt-1.5 bg-background border rounded-lg px-2 py-1.5 shadow-inner flex items-center justify-between gap-1">
            <span className="truncate">{detail.team_id || "— not provisioned —"}</span>
            {detail.team_id && (
              <button onClick={() => copyToClipboard(detail.team_id, "Team ID")} className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-muted shrink-0">
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-muted/30 border hover:border-border/80 rounded-xl p-4 transition-colors">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Integration Team ID</span>
          <div className="font-mono text-[11px] font-medium mt-1.5 bg-background border rounded-lg px-2 py-1.5 shadow-inner flex items-center justify-between gap-1">
            <span className="truncate">{detail.integration_team_id}</span>
            <button onClick={() => copyToClipboard(detail.integration_team_id, "Integration Team ID")} className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-muted shrink-0">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-muted/30 border hover:border-border/80 rounded-xl p-4 flex flex-col justify-between transition-colors">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Region Context</span>
            <div className="text-xs font-bold mt-2 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary border inline-block"></span>
              {(detail.region ?? "us").toUpperCase()}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2 pt-1 border-t">
            Last synced: {fmt(detail.last_synced_at)}
            {detail.last_sync_status ? ` · ${detail.last_sync_status}` : ""}
            {detail.last_sync_error ? ` · ${detail.last_sync_error}` : ""}
          </div>
        </div>

        <div className="bg-muted/30 border hover:border-border/80 rounded-xl p-4 flex flex-col justify-between transition-colors">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Active Mode Target</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mt-1.5 border ${
                env === "sandbox"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {env}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2 pt-1 border-t">
            Tenant enabled: {detail.enabled ? "Yes" : "No"}
          </div>
        </div>
      </div>
    </div>
  )
}
