import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  junctionIntegrationApi,
  type JunctionEnvironment,
  type JunctionIntegrationDetail,
  type JunctionLabAccountItem,
} from "@/api/junctionIntegration"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  environment: JunctionEnvironment
  ambiguousProviders: string[]
  onChanged: (detail: JunctionIntegrationDetail) => void
}

export function JunctionLabAccountsDialog({
  open,
  onOpenChange,
  clientId,
  environment,
  ambiguousProviders,
  onChanged,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [items, setItems] = useState<JunctionLabAccountItem[]>([])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    junctionIntegrationApi
      .listLabAccounts(clientId, environment)
      .then((res) => {
        if (!cancelled) setItems(res.items)
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load lab accounts from Junction.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, clientId, environment])

  const handleToggle = async (item: JunctionLabAccountItem) => {
    setBusyId(item.lab_account_id)
    try {
      const detail = item.linked
        ? await junctionIntegrationApi.unlinkLabAccount(clientId, item.lab_account_id, environment)
        : await junctionIntegrationApi.linkLabAccount(clientId, item.lab_account_id, environment)
      onChanged(detail)
      const linkedIds = new Set(
        detail.lab_accounts.items.filter((i) => i.linked).map((i) => i.lab_account_id)
      )
      setItems((prev) =>
        prev.map((i) => ({ ...i, linked: linkedIds.has(i.lab_account_id) }))
      )
      toast.success(item.linked ? "Lab account unlinked." : "Lab account linked.")
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(detail || "Lab account update failed.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage lab accounts ({environment})</DialogTitle>
          <DialogDescription>
            Only <strong>active</strong> Junction lab accounts are orderable. Linking updates the
            team allowlist via the Management API.
          </DialogDescription>
        </DialogHeader>

        {ambiguousProviders.length > 0 && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Multiple active accounts are linked for: {ambiguousProviders.join(", ")}. Patient
            checkout requires an explicit lab account selection per assignment.
          </div>
        )}

        <div className="max-h-[55vh] overflow-y-auto rounded-md border">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Loading lab accounts from Junction…
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No org lab accounts found for this environment.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Lab / account</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Delegated flow</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const orderable = item.orderable ?? item.status?.toLowerCase() === "active"
                  return (
                    <tr key={item.lab_account_id} className="border-t">
                      <td className="px-3 py-2">
                        <div className="font-medium">{item.account_name || item.lab}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {item.lab_account_id} · {item.lab}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={orderable ? "default" : "secondary"}>{item.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {item.delegated_flow || "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant={item.linked ? "outline" : "default"}
                          disabled={(!orderable && !item.linked) || busyId === item.lab_account_id}
                          onClick={() => handleToggle(item)}
                        >
                          {busyId === item.lab_account_id
                            ? "…"
                            : item.linked
                            ? "Unlink"
                            : "Link"}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
