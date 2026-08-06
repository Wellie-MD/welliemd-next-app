import { useState, useMemo, useCallback, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { DateRange } from "react-day-picker"
import { exportToCSV } from "@/utils/exportUtils"

interface RecoveryCase {
  id: string
  reference: string
  submission_id: string
  patient_id: string
  patient_name: string
  checkout_state: string
  failure_code: string
  status: string
  created_at: string
  age_seconds: number | null
}

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
  const [data, setData] = useState<RecoveryCase[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [date, setDate] = useState<DateRange | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchWorklist = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/v1/orders/reconciliation-worklist/")
      if (res.ok) {
        const result = await res.json()
        setData(Array.isArray(result) ? result : result.results || [])
      }
    } catch (err) {
      console.error("Failed to fetch reconciliation worklist:", err)
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
