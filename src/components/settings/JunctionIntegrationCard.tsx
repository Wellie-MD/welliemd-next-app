import { useEffect, useState } from "react"
import { Watch } from "lucide-react"

import { junctionSettingsApi, type JunctionTenantStatus } from "@/api/junctionSettingsApi"

// Read-only Junction integration card for the client portal, mirroring the
// client prototype. Junction credentials are managed by WellieMD; nothing here
// is editable — no API key, webhook secret, team-id edit, or rotate controls.

function envLabel(env: string) {
  return env === "production" ? "Live" : "Sandbox"
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—"
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return "—"
  const diff = Date.now() - then
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

export function JunctionIntegrationCard() {
  const [status, setStatus] = useState<JunctionTenantStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    junctionSettingsApi
      .getStatus()
      .then((data) => {
        if (!cancelled) setStatus(data)
      })
      .catch(() => {
        if (!cancelled) setStatus(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const env = status?.environment ?? "sandbox"
  const isLive = env === "production"
  const connected = status?.status === "connected"

  const envPillClass = isLive
    ? "bg-green-100 text-green-700 border-green-200"
    : "bg-sky-50 text-sky-700 border-sky-200"

  return (
    <div className="max-w-[900px] rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
          <Watch className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-semibold text-foreground">Junction</h2>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${envPillClass}`}
            >
              {envLabel(env)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Wearables &amp; device data — patients connect rings, watches, scales and CGMs from
            their own app, and data flows to your team.
          </p>

          <div className="my-4 border-t" />

          {/* Connection environment (read-only) */}
          <div>
            <div className="text-xs font-semibold text-foreground">Connection environment</div>
            <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
              <p className="max-w-[560px] text-xs leading-relaxed text-muted-foreground">
                {isLive ? (
                  <>
                    <b>Live</b> — connected to patients' real devices. Environment is managed by
                    WellieMD.
                  </>
                ) : (
                  <>
                    <b>Sandbox</b> — Junction synthetic data so your team can build and demo without
                    a real device. Environment is managed by WellieMD.
                  </>
                )}
              </p>
              {/* Read-only segmented display — reflects current env, not editable */}
              <div className="inline-flex flex-shrink-0 rounded-lg bg-muted p-0.5">
                <span
                  className={`rounded-md px-3 py-1 text-[11.5px] ${
                    !isLive ? "bg-background font-semibold text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Sandbox
                </span>
                <span
                  className={`rounded-md px-3 py-1 text-[11.5px] ${
                    isLive ? "bg-background font-semibold text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Live
                </span>
              </div>
            </div>
          </div>

          <div className="my-4 border-t" />

          {/* Integration status */}
          <div>
            <div className="text-xs font-semibold text-foreground">Integration status</div>
            <div className="mt-2.5 flex flex-wrap gap-x-8 gap-y-3">
              <StatusCol label="Status">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      connected ? "bg-green-600" : "bg-muted-foreground"
                    }`}
                  />
                  {loading ? "Loading…" : connected ? "Connected · healthy" : "Disconnected"}
                </span>
              </StatusCol>
              <StatusCol label="Junction team">
                <span className="font-mono text-muted-foreground">{status?.team_id || "—"}</span>
              </StatusCol>
              <StatusCol label="Environment">{envLabel(env)}</StatusCol>
              <StatusCol label="Webhook">
                {status?.webhook?.configured ? "Configured" : "Not configured"}
              </StatusCol>
              <StatusCol label="Linked lab accounts">
                {status?.lab_accounts?.linked_count ?? 0}
              </StatusCol>
              <StatusCol label="Last sync">{relativeTime(status?.last_synced_at ?? null)}</StatusCol>
            </div>
            <p className="mt-3 text-[11.5px] text-muted-foreground">
              API keys and webhook signing secrets for this integration are held securely by
              WellieMD and are never shown here. The team ID is a non-secret reference you can
              quote to support.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusCol({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-[10.5px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-[13px] font-semibold text-foreground">{children}</div>
    </div>
  )
}

export default JunctionIntegrationCard
