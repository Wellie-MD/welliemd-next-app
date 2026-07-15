import { useEffect, useMemo, useState } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { JunctionSenseQueryStatus } from "@/api/junctionIntegration"
import {
  SENSE_AGG_FUNCS,
  SENSE_INDEX_FIELDS,
  SENSE_INDICES,
  SENSE_TIME_UNITS,
  SENSE_VALUE_MACROS,
  buildSenseQueryDsl,
  type SenseIndex,
  type SenseMetricRow,
} from "./senseGrammar"

// Same idiom as ProductFormModal.tsx's labelToSlug, swapped to dashes.
function nameToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Structural-only check mirroring the backend's _validate_sense_query_dsl —
 * we don't know Junction's full DSL grammar, so this just catches obvious
 * mistakes before a round trip; Junction's API is the real validator. */
function validateDsl(raw: string): { query: Record<string, unknown> | null; error: string | null } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { query: null, error: "Query must be valid JSON." }
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { query: null, error: "Query must be a JSON object." }
  }
  const obj = parsed as Record<string, unknown>
  if (!Array.isArray(obj.select) || obj.select.length === 0) {
    return { query: null, error: "query.select must be a non-empty array." }
  }
  if (!Array.isArray(obj.group_by)) {
    return { query: null, error: "query.group_by must be an array." }
  }
  return { query: obj, error: null }
}

const DEFAULT_INDEX: SenseIndex = "sleep"

function defaultMetricRow(index: SenseIndex): SenseMetricRow {
  const firstField = SENSE_INDEX_FIELDS[index]?.[0]?.value ?? ""
  return { kind: "field", name: firstField, func: "mean" }
}

const EXAMPLE_QUERY = `{
  "where": null,
  "select": [
    { "group_key": "*" },
    { "arg": { "activity": "steps" }, "func": "sum" }
  ],
  "group_by": [
    { "date_trunc": { "value": 1, "unit": "day" }, "arg": { "index": "activity" } },
    { "source": "source_provider" },
    { "source": "source_type" }
  ]
}`

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: JunctionSenseQueryStatus | null
  onSubmit: (values: { name: string; slug: string; query: Record<string, unknown>; custom_inputs?: string; custom_output?: string; min_gap_seconds?: number }) => Promise<void>
}

export function SenseCustomQueryModal({ open, onOpenChange, editing, onSubmit }: Props) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [customInputs, setCustomInputs] = useState("")
  const [customOutput, setCustomOutput] = useState("")
  const [minGapSeconds, setMinGapSeconds] = useState<string>("")

  const [mode, setMode] = useState<"guided" | "advanced">("guided")
  const [queryText, setQueryText] = useState("")

  const [guidedIndex, setGuidedIndex] = useState<SenseIndex>(DEFAULT_INDEX)
  const [guidedWhere, setGuidedWhere] = useState("")
  const [guidedMetrics, setGuidedMetrics] = useState<SenseMetricRow[]>([defaultMetricRow(DEFAULT_INDEX)])
  const [guidedTimeUnit, setGuidedTimeUnit] = useState("day")

  useEffect(() => {
    if (!open) return
    if (editing) {
      setName(editing.display_name)
      setSlug(editing.slug)
      setSlugTouched(true)
      setQueryText(JSON.stringify(editing.query_definition ?? {}, null, 2))
      setCustomInputs(editing.custom_inputs ?? "")
      setCustomOutput(editing.custom_output ?? "")
      setMinGapSeconds(editing.min_gap_seconds?.toString() ?? "")
      setMode("advanced")
    } else {
      setName("")
      setSlug("")
      setSlugTouched(false)
      setGuidedIndex(DEFAULT_INDEX)
      setGuidedWhere("")
      setGuidedMetrics([defaultMetricRow(DEFAULT_INDEX)])
      setGuidedTimeUnit("day")
      setQueryText(EXAMPLE_QUERY)
      setCustomInputs("")
      setCustomOutput("")
      setMinGapSeconds("")
      setMode("guided")
    }
    setError(null)
  }, [open, editing])

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugTouched) setSlug(nameToSlug(value))
  }

  const handleIndexChange = (value: string) => {
    const index = value as SenseIndex
    setGuidedIndex(index)
    setGuidedMetrics([defaultMetricRow(index)])
  }

  const handleModeChange = (value: string) => {
    const next = value as "guided" | "advanced"
    if (next === "advanced" && mode === "guided") {
      const assembled = buildSenseQueryDsl(guidedIndex, guidedWhere, guidedMetrics, guidedTimeUnit)
      setQueryText(JSON.stringify(assembled, null, 2))
    } else if (next === "guided" && mode === "advanced") {
      toast.info("Switching to guided mode resets the query fields below.")
      setGuidedIndex(DEFAULT_INDEX)
      setGuidedWhere("")
      setGuidedMetrics([defaultMetricRow(DEFAULT_INDEX)])
      setGuidedTimeUnit("day")
    }
    setMode(next)
    setError(null)
  }

  const addMetricRow = () => {
    setGuidedMetrics((current) => [...current, defaultMetricRow(guidedIndex)])
  }

  const removeMetricRow = (idx: number) => {
    setGuidedMetrics((current) => current.filter((_, i) => i !== idx))
  }

  const updateMetricRow = (idx: number, patch: Partial<SenseMetricRow>) => {
    setGuidedMetrics((current) =>
      current.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    )
  }

  const fieldOptionsForIndex = useMemo(() => SENSE_INDEX_FIELDS[guidedIndex] ?? [], [guidedIndex])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Name is required.")
      return
    }
    if (!slug.trim()) {
      setError("Slug is required.")
      return
    }

    let query: Record<string, unknown> | null = null
    if (mode === "guided") {
      const completeMetrics = guidedMetrics.filter((m) => m.name && m.func)
      if (completeMetrics.length === 0) {
        setError("Add at least one metric (pick a field and an aggregation).")
        return
      }
      query = buildSenseQueryDsl(guidedIndex, guidedWhere, completeMetrics, guidedTimeUnit)
    } else {
      const { query: parsed, error: dslError } = validateDsl(queryText)
      if (dslError || !parsed) {
        setError(dslError)
        return
      }
      query = parsed
    }

    setSubmitting(true)
    try {
      const payload: any = { name: name.trim(), slug: slug.trim(), query }
      if (customInputs.trim()) payload.custom_inputs = customInputs.trim()
      if (customOutput.trim()) payload.custom_output = customOutput.trim()
      if (minGapSeconds.trim()) {
        const gap = parseInt(minGapSeconds, 10)
        if (!isNaN(gap)) payload.min_gap_seconds = gap
      }
      await onSubmit(payload)
      onOpenChange(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || "Failed to save the query.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Sense query" : "Add Sense query"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Custom queries are edited as raw JSON — we can't reliably map an existing query back into guided fields."
              : "Build a query from dropdowns, or switch to Advanced to write the DSL JSON directly. We don't have Junction's complete grammar, so anything Junction itself rejects will show up as an error after you submit."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sense-query-name">Name</Label>
              <Input
                id="sense-query-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Morning recovery score"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sense-query-slug">Slug</Label>
              <Input
                id="sense-query-slug"
                value={slug}
                disabled={Boolean(editing)}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(nameToSlug(e.target.value))
                }}
                placeholder="morning-recovery-score"
                className="font-mono text-sm"
              />
            </div>
          </div>
          {editing && (
            <p className="-mt-2 text-xs text-muted-foreground">Slug can't be changed after creation.</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sense-query-custom-inputs">Display inputs (optional)</Label>
              <Input
                id="sense-query-custom-inputs"
                value={customInputs}
                onChange={(e) => setCustomInputs(e.target.value)}
                placeholder="e.g. Heart rate, steps"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sense-query-custom-output">Display output (optional)</Label>
              <Input
                id="sense-query-custom-output"
                value={customOutput}
                onChange={(e) => setCustomOutput(e.target.value)}
                placeholder="e.g. Daily trend"
                className="text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sense-query-min-gap">Min Gap (seconds) / Schedule</Label>
            <Input
              id="sense-query-min-gap"
              type="number"
              value={minGapSeconds}
              onChange={(e) => setMinGapSeconds(e.target.value)}
              placeholder="e.g. 86400 for daily"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Controls evaluation frequency on Junction's dashboard. Also used as the display schedule.
            </p>
          </div>

          {editing ? (
            <div className="space-y-1.5">
              <Label htmlFor="sense-query-json">Query (JSON)</Label>
              <Textarea
                id="sense-query-json"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                className="min-h-[220px] font-mono text-xs"
                spellCheck={false}
              />
            </div>
          ) : (
            <Tabs value={mode} onValueChange={handleModeChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="guided">Guided</TabsTrigger>
                <TabsTrigger value="advanced">Advanced (JSON)</TabsTrigger>
              </TabsList>

              <TabsContent value="guided" className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label>Data type</Label>
                  <Select value={guidedIndex} onValueChange={handleIndexChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SENSE_INDICES.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Metrics</Label>
                  {guidedMetrics.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Select
                        value={`${row.kind}:${row.name}`}
                        onValueChange={(value) => {
                          const [kind, ...rest] = value.split(":")
                          updateMetricRow(idx, {
                            kind: kind as "field" | "macro",
                            name: rest.join(":"),
                          })
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Fields</SelectLabel>
                            {fieldOptionsForIndex.map((opt) => (
                              <SelectItem key={opt.value} value={`field:${opt.value}`}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          {guidedIndex === "sleep" && (
                            <SelectGroup>
                              <SelectLabel>Computed macros</SelectLabel>
                              {SENSE_VALUE_MACROS.map((opt) => (
                                <SelectItem key={opt.value} value={`macro:${opt.value}`}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                        </SelectContent>
                      </Select>

                      <Select
                        value={row.func}
                        onValueChange={(value) => updateMetricRow(idx, { func: value })}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Aggregation" />
                        </SelectTrigger>
                        <SelectContent>
                          {SENSE_AGG_FUNCS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <button
                        type="button"
                        onClick={() => removeMetricRow(idx)}
                        disabled={guidedMetrics.length === 1}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                        aria-label="Remove metric"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addMetricRow}>
                    <Plus className="h-3.5 w-3.5" />
                    Add metric
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sense-query-timeunit">Group by</Label>
                  <Select value={guidedTimeUnit} onValueChange={setGuidedTimeUnit}>
                    <SelectTrigger id="sense-query-timeunit" className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SENSE_TIME_UNITS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sense-query-where">Filter (optional)</Label>
                  <Input
                    id="sense-query-where"
                    value={guidedWhere}
                    onChange={(e) => setGuidedWhere(e.target.value)}
                    placeholder={guidedIndex === "sleep" ? "type = 'long_sleep'" : "advanced SQL-like filter, optional"}
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-1.5 pt-3">
                <Label htmlFor="sense-query-json-advanced">Query (JSON)</Label>
                <Textarea
                  id="sense-query-json-advanced"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  className="min-h-[220px] font-mono text-xs"
                  spellCheck={false}
                />
              </TabsContent>
            </Tabs>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Create query"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
