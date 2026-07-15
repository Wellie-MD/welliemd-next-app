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

      <JunctionApiCredentials detail={detail} clientId={clientId} busy={busy} run={run} />

      <JunctionWearablesSection
        clientId={clientId}
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
