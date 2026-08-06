import { useState, useMemo, useCallback, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { DateRange } from "react-day-picker"
import { exportToCSV } from "@/utils/exportUtils"
import { fetchReconciliationWorklist, type ReconciliationWorklistItem } from "@/api/ordersApi"

const resolutionColumns = [
  { key: "reference", label: "Reference" },
  { key: "patient_name", label: "Patient Name" },
  { key: "checkout_state", label: "Checkout State" },
  { key: "failure_code", label: "Failure Code" },
  { key: "status", label: "Status" },
  { key: "age_seconds", label: "Age (s)" },
  { key: "created_at", label: "Created At" },
]

export default function ResolutionQueue() {
  const [data, setData] = useState<ReconciliationWorklistItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [date, setDate] = useState<DateRange | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchWorklist = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchReconciliationWorklist()
      setData(result)
    } catch (err) {
      // A silently-empty queue is the one failure mode this page cannot
      // afford: staff must be able to tell "nothing is stuck" apart from
      // "the request failed and we don't actually know."
      console.error("Failed to fetch reconciliation worklist:", err)
      setError("Could not load the reconciliation worklist. Try refreshing.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorklist()
  }, [fetchWorklist, refreshKey])

  const filteredQueue = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.failure_code?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [data, searchTerm])

  const handleResetFilters = useCallback(() => {
    setDate(undefined)
    setSearchTerm("")
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  const handleExport = useCallback(() => {
    exportToCSV(filteredQueue, resolutionColumns, "resolution_queue_export")
  }, [filteredQueue])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resolution Queue</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Orders</span>
            <span>›</span>
            <span>Resolution Queue</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <DataTable
        data={filteredQueue}
        columns={resolutionColumns}
        searchPlaceholder="Search by reference, patient name or failure code"
        showDatePicker={true}
        showExport={true}
        showResetFilters={true}
        dateRange={date}
        onDateRangeChange={setDate}
        onSearch={setSearchTerm}
        onResetFilters={handleResetFilters}
        onExport={handleExport}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
