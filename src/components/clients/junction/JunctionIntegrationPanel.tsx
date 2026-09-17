import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  junctionIntegrationApi,
  type JunctionEnvironment,
  type JunctionIntegrationDetail,
} from "@/api/junctionIntegration"
import { JunctionLabAccountsDialog } from "./JunctionLabAccountsDialog"
import { JunctionWearablesSection } from "./JunctionWearablesSection"
import { JunctionHeader } from "./JunctionHeader"
import { JunctionApiCredentials } from "./JunctionApiCredentials"
import { JunctionLabAccountsCard } from "./JunctionLabAccountsCard"
import {
  JUNCTION_NETWORK_POLICY_SUMMARY,
  JUNCTION_ORDERING_MODE_LABELS,
} from "./junctionOrderingPolicy"

interface Props {
  clientId: string
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
    } catch (err) {
      console.error("Junction integration load error:", err)
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
      <JunctionHeader detail={detail} clientId={clientId} busy={busy} run={run} />

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-1 border-b pb-4">
          <h3 className="text-sm font-bold">Lab ordering policy</h3>
          <p className="text-xs text-muted-foreground">
            This routing policy is controlled by the control plane and synced to the tenant runtime.
          </p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ordering mode</span>
            <p className="mt-1 text-sm font-semibold">
              {JUNCTION_ORDERING_MODE_LABELS[detail.physician_ordering_mode as keyof typeof JUNCTION_ORDERING_MODE_LABELS] ?? "Not configured"}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current network rules</span>
            <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
              {JUNCTION_NETWORK_POLICY_SUMMARY.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </div>

      <JunctionApiCredentials detail={detail} clientId={clientId} busy={busy} run={run} />

      <JunctionWearablesSection
        clientId={clientId}
        senseEnvironment={env}
        initialEnabled={Boolean(detail.wearables?.enabled)}
        providerConfigs={detail.wearables?.settings}
        labAccountsCard={
          <JunctionLabAccountsCard
            detail={detail}
            env={env}
            provisioned={provisioned}
            onManage={() => setLabsOpen(true)}
          />
        }
      />

      <JunctionLabAccountsDialog
        open={labsOpen}
        onOpenChange={setLabsOpen}
        clientId={clientId}
        environment={env}
        mode={detail.lab_accounts.mode ?? "platform"}
        ambiguousProviders={detail.lab_accounts.ambiguous_providers ?? []}
        onChanged={setDetail}
      />
    </div>
  )
}

export default JunctionIntegrationPanel
