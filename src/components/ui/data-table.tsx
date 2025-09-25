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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Download,
  CalendarIcon,
  X,
  Edit,
  Trash2,
} from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"

interface Column {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

interface FilterConfig {
  key: string
  label: string
  type: 'button' | 'select'
  options?: string[]
  value?: string
  onClick?: () => void
}

interface ActionConfig {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: (row: any) => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  className?: string
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  actions?: ActionConfig[]
  hideToolbar?: boolean
  searchPlaceholder?: string
  showDatePicker?: boolean
  showExport?: boolean
  showResetFilters?: boolean
  filters?: FilterConfig[]
  dateRange?: DateRange | undefined
  onDateRangeChange?: (range: DateRange | undefined) => void
  onSearch?: (searchTerm: string) => void
  onFilter?: (filters: any) => void
  onExport?: () => void
  onResetFilters?: () => void
  onRefresh?: () => void
  isLoading?: boolean
}

export function DataTable({
  data,
  columns,
  actions = [],
  hideToolbar = false,
  searchPlaceholder = "Search...",
  showDatePicker = false,
  showExport = true,
  showResetFilters = true,
  filters = [],
  dateRange,
  onDateRangeChange,
  onSearch,
  onFilter,
  onExport,
  onResetFilters,
  onRefresh,
  isLoading = false,
}: DataTableProps) {
  // ---- pagination state ----
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState<number>(1)

  // ---- local search state ----
  const [localSearch, setLocalSearch] = useState<string>("")

  // ---- filtering (using the filtered data passed from parent) ----
  const filteredData = data ?? []

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
    onSearch?.(v)
    setPage(1)
  }

  const handleClearInput = () => {
    setLocalSearch("")
    onSearch?.("")
    setPage(1)
  }

  // Use the onExport prop instead of defining our own export logic
  const handleExport = () => {
    if (onExport) {
      onExport()
    }
  }

  // Determine if we need to show the Actions column
  const showActions = actions.length > 0
  const effectiveColumns = showActions 
    ? [...columns, { key: 'actions', label: 'Actions' }] 
    : columns

  return (
    <div className="space-y-4">
      {!hideToolbar && (
        <>
          {/* All filters in a single line */}
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((filter) => (
              <Button
                key={filter.key}
                variant={filter.value ? "default" : "outline"}
                size="sm"
                onClick={filter.onClick}
                className={filter.value ? "bg-primary text-primary-foreground" : ""}
              >
                {filter.label}
              </Button>
            ))}

            {/* Reset Filters Button */}
            {showResetFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onResetFilters}
                className="gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filters
              </Button>
            )}
          </div>

          {/* Search Box, Date Picker, Export and Refresh in same line */}
          <div className="flex items-center gap-4">
            {/* Search Box */}
            <div className="relative flex-1 max-w-xl">
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

            {/* Right side buttons container */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Date Picker */}
              {showDatePicker && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={onDateRangeChange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              )}

              {/* Export Button */}
              {showExport && (
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              )}

              {/* Refresh Button */}
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onRefresh}
                title="Refresh data"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {effectiveColumns.map((column) => (
                <TableHead key={column.key} className="font-medium">
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={effectiveColumns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : visibleData.length > 0 ? (
              visibleData.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </TableCell>
                  ))}
                  {/* Actions column */}
                  {showActions && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {actions.map((action) => {
                          const IconComponent = action.icon
                          return (
                            <Button
                              key={action.key}
                              variant={action.variant || 'ghost'}
                              size="sm"
                              onClick={() => action.onClick(row)}
                              className={action.className}
                              title={action.label}
                            >
                              <IconComponent className="h-4 w-4" />
                            </Button>
                          )
                        })}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={effectiveColumns.length}
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
