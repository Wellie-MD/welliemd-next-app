import React, { useEffect, useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Download,
  Calendar,
  Filter,
  X,
} from "lucide-react"

interface Column {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  hideToolbar?: boolean
  searchPlaceholder?: string
  showFilters?: boolean
  showExport?: boolean
  showDatePicker?: boolean
  onFilter?: (filters: any) => void
  onExport?: () => void
  onRefresh?: () => void
}

export function DataTable({
  data,
  columns,
  hideToolbar = false,
  searchPlaceholder = "Search...",
  showFilters = true,
  showExport = true,
  showDatePicker = true,
  onFilter,
  onExport,
  onRefresh,
}: DataTableProps) {
  // ---- pagination state ----
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState<number>(1)

  // ---- search state ----
  const [localSearch, setLocalSearch] = useState<string>("")

  // ---- filtering ----
  const filteredData = useMemo(() => {
    if (!localSearch) return data ?? []
    const lower = localSearch.toLowerCase()
    return (data ?? []).filter((row) =>
      columns.some((col) => {
        const val = row[col.key]
        return val?.toString().toLowerCase().includes(lower)
      })
    )
  }, [data, localSearch, columns])

  // ---- pagination ----
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((filteredData.length ?? 0) / pageSize)),
    [filteredData.length, pageSize]
  )

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
    if (page < 1) setPage(1)
  }, [page, totalPages])

  const visibleData = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return filteredData.slice(start, end)
  }, [filteredData, page, pageSize])

  // ---- handlers ----
  const goPrev = () => setPage((p) => Math.max(1, p - 1))
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1))

  const handleInputChange = (v: string) => {
    setLocalSearch(v)
    setPage(1)
  }

  const handleClearInput = () => {
    setLocalSearch("")
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {!hideToolbar && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* 🔎 search box with clear button */}
            <div className="relative w-full max-w-xl">
              <Input
                value={localSearch}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pr-9"
              />
              {localSearch && (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={handleClearInput}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {showDatePicker && (
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Select date range
              </Button>
            )}

            {showFilters && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => onFilter?.({})}
              >
                <Filter className="h-4 w-4" />
                Reset Filters
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showExport && (
              <Button variant="outline" className="gap-2" onClick={onExport}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={onRefresh}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className="font-medium">
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleData.length > 0 ? (
              visibleData.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(parseInt(v, 10))
              setPage(1)
            }}
          >
            <SelectTrigger className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={goPrev}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goNext}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
