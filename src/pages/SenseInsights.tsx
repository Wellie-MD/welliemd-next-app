import { useEffect, useMemo, useState } from "react"
import { Activity, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { clientApi, type Client } from "@/api/clientApi"
import {
  junctionIntegrationApi,
  type JunctionEnvironment,
  type JunctionSenseQueryStatus,
} from "@/api/junctionIntegration"
import { SenseCustomQueryModal } from "@/components/sense/SenseCustomQueryModal"

// Mirrors apps/integrations/junction_sense_constants.py's
// SENSE_DOMAIN_QUERY_DEFINITIONS — the fixed standard queries WellieMD
// provisions per tenant. Display copy only; the actual query bodies live
// server-side and aren't admin-editable.
const SENSE_QUERY_CATALOG: {
  domain: string
  name: string
  inputs: string
  output: string
  schedule: string
}[] = [
  {
    domain: "sleep",
    name: "Sleep summary",
    inputs: "Efficiency, sleep score, chronotype, duration",
    output: "Sleep macros (blended)",
    schedule: "Continuous · nightly",
  },
  {
    domain: "activity",
    name: "Daily activity",
    inputs: "Steps, resting heart rate",
    output: "Step count, resting heart rate",
    schedule: "Continuous · daily",
  },
  {
    domain: "body",
    name: "Weight trend",
    inputs: "Body weight",
    output: "Latest + mean weight",
    schedule: "Continuous · daily",
  },
  {
    domain: "glucose",
    name: "Glucose daily",
    inputs: "CGM time-series",
    output: "Mean glucose, min/max, latest reading",
    schedule: "Continuous · daily",
  },
  {
    domain: "workouts",
    name: "Workout summary",
    inputs: "Calories, moving time",
    output: "Weekly workout rollup",
    schedule: "Continuous · weekly",
  },
]

function statusFor(row: JunctionSenseQueryStatus | undefined) {
  if (!row) return { label: "Not provisioned", tone: "bg-slate-100 text-slate-600 border-slate-200" }
  if (row.sync_status === "failed") {
    return { label: "Provisioning failed", tone: "bg-red-50 text-red-700 border-red-200" }
  }
  if (row.sync_status !== "synced") {
    return { label: "Provisioning…", tone: "bg-amber-50 text-amber-700 border-amber-200" }
  }
  if (!row.access_granted) {
    return { label: "Awaiting access", tone: "bg-slate-100 text-slate-600 border-slate-200" }
  }
  return { label: "Active", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" }
}

export default function SenseInsights() {
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearch, setClientSearch] = useState("")
  const [clientId, setClientId] = useState<string>("")
  const [environment, setEnvironment] = useState<JunctionEnvironment>("sandbox")
  const [queries, setQueries] = useState<JunctionSenseQueryStatus[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [busy, setBusy] = useState<"ensure" | "access" | null>(null)
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [editingCustomQuery, setEditingCustomQuery] = useState<JunctionSenseQueryStatus | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<JunctionSenseQueryStatus | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    clientApi
      .list()
      .then((data) => {
        if (active) setClients(data)
      })
      .catch((err) => {
        console.error("Failed to load clients:", err)
        toast.error("Failed to load clients.")
      })
      .finally(() => {
        if (active) setLoadingClients(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase()
    if (!term) return clients
    return clients.filter((c) => c.name.toLowerCase().includes(term))
  }, [clients, clientSearch])

  const loadStatus = async () => {
    if (!clientId) {
      setQueries([])
      return
    }
    setLoadingStatus(true)
    try {
      const detail = await junctionIntegrationApi.get(clientId)
      const envBlock = detail.wearables?.sense?.[environment]
      setQueries(envBlock?.queries ?? [])
    } catch (err) {
      console.error("Failed to load Sense status:", err)
      toast.error("Failed to load Sense status for this client.")
      setQueries([])
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    void loadStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, environment])

  const queryByDomain = useMemo(() => {
    const map = new Map<string, JunctionSenseQueryStatus>()
    queries.forEach((q) => map.set(q.domain, q))
    return map
  }, [queries])

  const customQueries = useMemo(() => queries.filter((q) => q.is_custom), [queries])

  const provisioned = queries.length > 0
  const allSynced = provisioned && queries.every((q) => q.sync_status === "synced")
  const allGranted = provisioned && queries.every((q) => q.access_granted)

  const handleEnsure = async () => {
    if (!clientId) return
    setBusy("ensure")
    try {
      await junctionIntegrationApi.ensureSense(clientId, environment)
      toast.success("Sense queries provisioned for this client.")
      await loadStatus()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || "Failed to provision Sense queries.")
    } finally {
      setBusy(null)
    }
  }

  const handleAccessToggle = async (granted: boolean) => {
    if (!clientId) return
    setBusy("access")
    try {
      await junctionIntegrationApi.setSenseAccessGranted(clientId, environment, granted)
      toast.success(granted ? "Marked Sense access as granted." : "Marked Sense access as not granted.")
      await loadStatus()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || "Failed to update Sense access.")
    } finally {
      setBusy(null)
    }
  }

  const openCreateQueryModal = () => {
    setEditingCustomQuery(null)
    setCustomModalOpen(true)
  }

  const openEditQueryModal = (row: JunctionSenseQueryStatus) => {
    setEditingCustomQuery(row)
    setCustomModalOpen(true)
  }

  const handleCustomQuerySubmit = async (values: {
    name: string
    slug: string
    query: Record<string, unknown>
    custom_inputs?: string
    custom_output?: string
    min_gap_seconds?: number
  }) => {
    if (!clientId) return
    if (editingCustomQuery) {
      await junctionIntegrationApi.updateSenseQuery(clientId, environment, editingCustomQuery.id, {
        name: values.name,
        query: values.query,
        custom_inputs: values.custom_inputs,
        custom_output: values.custom_output,
        min_gap_seconds: values.min_gap_seconds,
      })
      toast.success("Sense query updated.")
    } else {
      await junctionIntegrationApi.createSenseQuery(clientId, environment, values)
      toast.success("Sense query created.")
    }
    await loadStatus()
  }

  const confirmDelete = async () => {
    if (!clientId || !deleteTarget) return
    setDeleting(true)
    try {
      await junctionIntegrationApi.deleteSenseQuery(clientId, environment, deleteTarget.id)
      toast.success("Sense query deleted.")
      await loadStatus()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || "Failed to delete Sense query.")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-sky-500" />
          <h1 className="text-2xl font-bold text-foreground">
            Sense insights
            <Badge variant="outline" className="ml-2 border-amber-200 bg-amber-50 text-amber-700 uppercase text-[10px] tracking-wide">
              Closed beta
            </Badge>
          </h1>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Define the readiness scores and aggregated metrics WellieMD computes from a client's
          connected wearables, using Junction Sense continuous queries with admin-configured
          per-metric device priority. These power the readiness and trend views in the client and
          patient portals.
        </p>
      </header>

      <Card className="rounded-2xl">
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Client</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="pl-9">
                    <SelectValue placeholder={loadingClients ? "Loading clients…" : "Select a client"} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Filter clients…"
                        className="h-8"
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    {filteredClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Environment</label>
              <Select value={environment} onValueChange={(v) => setEnvironment(v as JunctionEnvironment)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              disabled={!clientId || busy !== null}
              onClick={handleEnsure}
            >
              <RefreshCw className={cn("h-4 w-4", busy === "ensure" && "animate-spin")} />
              {provisioned ? "Re-sync Sense queries" : "Provision Sense queries"}
            </Button>
            <Button className="gap-2" disabled={!clientId} onClick={openCreateQueryModal}>
              <Plus className="h-4 w-4" />
              Add query
            </Button>
          </div>
        </CardContent>
      </Card>

      {!clientId ? (
        <div className="rounded-2xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          Select a client above to view and manage its Sense provisioning status.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm leading-relaxed text-amber-900">
              {!provisioned ? (
                <>
                  Sense hasn't been provisioned for this client's wearables Junction Team yet. Click{" "}
                  <span className="font-semibold">Provision Sense queries</span> to create the
                  standard set below.
                </>
              ) : allGranted ? (
                <>Sense is live for this client — queries are computing continuously.</>
              ) : (
                <>
                  Sense is in closed beta. The queries below are defined and ready — they begin
                  computing once your team is granted access by your Junction CSM. Once confirmed,
                  mark access as granted below.
                </>
              )}
            </div>
            {provisioned && (
              <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-2">
                <span className="text-xs font-medium text-muted-foreground">Access granted</span>
                <Switch
                  checked={allGranted}
                  disabled={busy !== null || !allSynced}
                  onCheckedChange={handleAccessToggle}
                />
              </div>
            )}
          </div>

          <Card className="rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Query configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 text-left">Query</th>
                      <th className="px-3 py-3 text-left">Inputs</th>
                      <th className="px-3 py-3 text-left">Output</th>
                      <th className="px-3 py-3 text-left">Schedule</th>
                      <th className="px-3 py-3 text-left">Status</th>
                      <th className="px-3 py-3 text-left">&nbsp;</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SENSE_QUERY_CATALOG.map((q) => {
                      const row = queryByDomain.get(q.domain)
                      const s = statusFor(row)
                      return (
                        <tr key={q.domain} className="border-t">
                          <td className="px-5 py-3 text-sm font-medium">{q.name}</td>
                          <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{q.inputs}</td>
                          <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{q.output}</td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">{q.schedule}</td>
                          <td className="px-3 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                                s.tone
                              )}
                            >
                              {s.label}
                            </span>
                            {row?.last_error && (
                              <div className="mt-1 max-w-xs truncate text-[10.5px] text-red-600" title={row.last_error}>
                                {row.last_error}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3" />
                        </tr>
                      )
                    })}
                    {customQueries.map((row) => {
                      const s = statusFor(row)
                      const preview = JSON.stringify(row.query_definition ?? {})
                      return (
                        <tr key={row.id} className="border-t bg-sky-50/30">
                          <td className="px-5 py-3 text-sm font-medium">
                            {row.display_name}
                            <span className="ml-2 rounded-full border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-sky-700">
                              Custom
                            </span>
                          </td>
                          <td
                            className="max-w-xs truncate px-3 py-3 font-mono text-xs text-muted-foreground"
                            title={row.custom_inputs || preview}
                          >
                            {row.custom_inputs || preview}
                          </td>
                          <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                            {row.custom_output || "—"}
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">
                            {row.min_gap_seconds ? `Continuous · ${row.min_gap_seconds}s gap` : "Continuous · custom"}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                                s.tone
                              )}
                            >
                              {s.label}
                            </span>
                            {row.last_error && (
                              <div className="mt-1 max-w-xs truncate text-[10.5px] text-red-600" title={row.last_error}>
                                {row.last_error}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditQueryModal(row)}
                                className="flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted"
                                aria-label={`Edit ${row.display_name}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(row)}
                                className="flex h-7 w-7 items-center justify-center rounded-md border text-red-600 transition-colors hover:bg-red-50"
                                aria-label={`Delete ${row.display_name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {loadingStatus && (
                <div className="px-5 py-3 text-xs text-muted-foreground">Refreshing status…</div>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Per-metric device priority (which connected wearable wins when a client has overlapping
            hardware) is configured per client under Clients → that client → Junction Integration →
            Patient Wearable Sync → Data Prioritization.
          </p>
        </>
      )}

      <SenseCustomQueryModal
        open={customModalOpen}
        onOpenChange={setCustomModalOpen}
        editing={editingCustomQuery}
        onSubmit={handleCustomQuerySubmit}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Sense query?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive "{deleteTarget?.display_name}" on Junction and remove it from this
              list. This can't be undone from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
