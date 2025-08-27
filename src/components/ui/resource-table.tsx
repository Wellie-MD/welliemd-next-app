import { useMemo, useState } from "react"
import { RotateCcw, X } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"

export type Column = {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

type ResourceTableProps<T = any> = {
  data: T[]
  columns: Column[]

  /** placeholder for the search input */
  searchPlaceholder?: string

  /** optional: called when user clicks refresh icon */
  onRefresh?: () => void

  /**
   * optional: custom filter function.
   * return true to keep the row.
   */
  filterFn?: (row: T, query: string) => boolean

  /** pass through to inner DataTable if you want export/datePicker etc off */
  tableProps?: Partial<React.ComponentProps<typeof DataTable>>
}

/**
 * Lightweight wrapper that renders:
 *  - Search + Clear + Refresh toolbar
 *  - Your existing DataTable underneath (toolbar hidden)
 *
 * Does client-side filtering by default (stringify row),
 * but you can pass a custom filterFn for precise filtering.
 */
export default function ResourceTable<T>({
  data,
  columns,
  searchPlaceholder = "Search…",
  onRefresh,
  filterFn,
  tableProps,
}: ResourceTableProps<T>) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data
    if (filterFn) return data.filter((r) => filterFn(r, q))
    // default: cheap JSON search
    return data.filter((r: any) =>
      JSON.stringify(r).toLowerCase().includes(q)
    )
  }, [data, query, filterFn])

  const clear = () => setQuery("")

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full border rounded-md px-4 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-green-600/30"
          />
          {query && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={clear}
              aria-label="Clear"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center h-10 px-3 rounded-md border hover:bg-muted transition"
          onClick={clear}
        >
          Clear
        </button>

        {onRefresh && (
          <button
            type="button"
            className="inline-flex items-center justify-center h-10 w-10 rounded-md border hover:bg-muted transition"
            title="Refresh"
            onClick={onRefresh}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table (use the shared DataTable with its toolbar hidden) */}
      <DataTable
        data={filtered as any[]}
        columns={columns as any}
        hideToolbar
        showDatePicker={false}
        showExport={false}
        {...tableProps}
      />
    </div>
  )
}
