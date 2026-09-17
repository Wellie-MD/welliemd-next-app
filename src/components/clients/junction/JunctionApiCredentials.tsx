import { ShieldAlert, Copy } from "lucide-react"
import type { JunctionIntegrationDetail, JunctionEnvironment } from "@/api/junctionIntegration"
import { junctionIntegrationApi } from "@/api/junctionIntegration"
import { toast } from "sonner"

interface Props {
  detail: JunctionIntegrationDetail
  clientId: string
  busy: string | null
  run: (key: string, action: () => Promise<JunctionIntegrationDetail>, successMsg: string) => Promise<void>
}

export function JunctionApiCredentials({ detail, clientId, busy, run }: Props) {
  const provisioned = Boolean(detail.team_id)
  const environments: JunctionEnvironment[] = ["sandbox", "production"]

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <div className="bg-card rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
          <ShieldAlert className="w-4.5 h-4.5 text-primary" /> Environment API Credentials
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Each environment keeps its own Junction API key and webhook configuration. Full secrets are never shown here.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
        {environments.map((environment) => {
          const keyBlock = detail.api_keys[environment]
          const webhook = detail.webhooks?.[environment]
          const ready = Boolean(keyBlock?.exists && webhook?.exists && webhook.secret_configured)
          const isSandbox = environment === "sandbox"
          
          return (
            <div key={environment} className="border bg-muted/20 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-background border px-2 py-1 rounded">
                    {environment} Environment
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      ready
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {ready ? "Ready" : "Needs Setup"}
                  </span>
                </div>
                <button
                  disabled={busy !== null || !provisioned}
                  onClick={() => run(`prepare-${environment}`, () => junctionIntegrationApi.prepareEnvironment(clientId, environment), `${environment} prepared.`)}
                  className="text-xs font-bold text-primary hover:underline transition-all disabled:opacity-50"
                >
                  {ready ? "Prepare Again" : "Prepare"}
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {environment} API Key
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      {keyBlock?.exists ? (
                        <input
                          type="text"
                          value={keyBlock.masked || "stored securely"}
                          readOnly
                          className="w-full text-xs font-mono bg-background border rounded-lg px-3 py-2 shadow-inner"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted border border-dashed rounded-lg px-3 py-2 text-muted-foreground italic text-xs flex items-center">
                          Not created
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={busy !== null || !provisioned}
                        onClick={() => run(`ensure-key-${environment}`, () => junctionIntegrationApi.ensureKey(clientId, environment), "API key ensured.")}
                        className={`flex-1 sm:flex-initial px-3 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 ${isSandbox ? "bg-background border hover:bg-muted" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                      >
                        {keyBlock?.exists ? "Ensure key" : `Generate ${environment} key`}
                      </button>
                      <button
                        disabled={busy !== null || !keyBlock?.exists}
                        onClick={() => run(`rotate-${environment}`, () => junctionIntegrationApi.rotateKey(clientId, environment), "Rotation completed.")}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 ${keyBlock?.exists ? "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20" : "bg-muted text-muted-foreground"}`}
                      >
                        Rotate
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {environment} Webhook Endpoint
                  </label>
                  <div className="flex flex-col gap-2">
                    {webhook?.exists ? (
                      <>
                        <div className="bg-background border rounded-lg p-2.5 shadow-inner text-xs font-mono break-all select-all flex items-start justify-between gap-3">
                          <span title={webhook.url}>{webhook.url || "configured"}</span>
                          {webhook.url && (
                            <button onClick={() => copyToClipboard(webhook.url!, "Webhook Endpoint")} className="text-muted-foreground hover:text-primary p-1 rounded hover:bg-muted shrink-0">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground space-y-1">
                          <div>State: <span className="font-medium text-foreground">{webhook.state || "unknown"}</span></div>
                          <div>Secret stored locally: <span className="font-medium text-foreground">{webhook.secret_configured ? "Yes" : "No"}</span></div>
                          {webhook.last_error ? <div className="text-destructive">Last error: {webhook.last_error}</div> : null}
                        </div>
                      </>
                    ) : (
                      <div className="bg-muted border border-dashed rounded-lg p-2.5 text-muted-foreground italic text-xs space-y-0.5">
                        <div>Not created</div>
                        <div className="text-[10px] opacity-80">One webhook is managed per environment.</div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={busy !== null || !provisioned}
                        onClick={() =>
                          run(
                            `ensure-webhook-${environment}`,
                            () => junctionIntegrationApi.ensureWebhook(clientId, environment),
                            "Webhook ensured."
                          )
                        }
                        className="px-3 py-2 text-xs font-semibold bg-background border hover:bg-muted rounded-lg shadow-sm transition-all disabled:opacity-50"
                      >
                        Ensure webhook
                      </button>
                      {webhook?.filter_types?.length ? (
                        <span className="self-center text-[11px] text-muted-foreground">
                          {webhook.filter_types.length} subscribed event
                          {webhook.filter_types.length === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
