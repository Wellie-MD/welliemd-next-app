import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Download,
  CalendarIcon,
  X,
  Building2,
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  headerClassName?: string;
  className?: string;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  render?: (value: unknown, row: unknown) => React.ReactNode;
}

interface FilterConfig {
  key: string;
  label: string;
  type: "button" | "select";
  options?: string[];
  value?: string;
  onClick?: () => void;
}

interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void; // Optional callback for page size change
}

interface DataTableProps {
  data: unknown[];
  columns: Column[];
  hideToolbar?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  showDatePicker?: boolean;
  showExport?: boolean;
  showResetFilters?: boolean;
  filters?: FilterConfig[];
  dateRange?: DateRange | undefined;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onSearch?: (searchTerm: string) => void;
  onFilter?: (filters: unknown) => void;
  onExport?: () => void;
  onResetFilters?: () => void;
  onRefresh?: () => void;
  getRowClassName?: (row: unknown) => string;
  loading?: boolean;
  pagination?: PaginationConfig; // External pagination config
}

export function DataTable({
  data,
  columns,
  hideToolbar = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
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
  getRowClassName,
  loading,
  pagination,
}: DataTableProps) {
  // ---- pagination state (internal or external) ----
  const [internalPageSize, setInternalPageSize] = useState<number>(10);
  const [internalPage, setInternalPage] = useState<number>(1);

  // Use external pagination if provided, otherwise use internal
  const isExternalPagination = !!pagination;
  const pageSize = isExternalPagination
    ? pagination.pageSize
    : internalPageSize;
  const page = isExternalPagination ? pagination.currentPage : internalPage;
  const totalPages = isExternalPagination
    ? pagination.totalPages
    : Math.max(1, Math.ceil((data?.length ?? 0) / internalPageSize));
  const totalCount = isExternalPagination
    ? pagination.totalCount
    : data?.length ?? 0;

  // ---- local search state ----
  const [localSearch, setLocalSearch] = useState<string>("");

  // ---- filtering (using the filtered data passed from parent) ----
  const filteredData = data ?? [];

  // ---- internal pagination (only if not using external) ----
  useEffect(() => {
    if (!isExternalPagination) {
      if (internalPage > totalPages) setInternalPage(totalPages);
      if (internalPage < 1) setInternalPage(1);
    }
  }, [internalPage, totalPages, isExternalPagination]);

  const visibleData = useMemo(() => {
    // If external pagination, show all data (already paginated by backend)
    if (isExternalPagination) {
      return filteredData;
    }
    // Otherwise, do client-side pagination
    const start = (internalPage - 1) * internalPageSize;
    const end = start + internalPageSize;
    return filteredData.slice(start, end);
  }, [filteredData, internalPage, internalPageSize, isExternalPagination]);

  // ---- handlers ----
  const goPrev = () => {
    if (isExternalPagination) {
      pagination.onPageChange(page - 1);
    } else {
      setInternalPage((p) => Math.max(1, p - 1));
    }
  };

  const goNext = () => {
    if (isExternalPagination) {
      pagination.onPageChange(page + 1);
    } else {
      setInternalPage((p) => Math.min(totalPages, p + 1));
    }
  };

  const handleInputChange = (v: string) => {
    setLocalSearch(v);
    onSearch?.(v);
    if (!isExternalPagination) {
      setInternalPage(1);
    }
  };

  const handleClearInput = () => {
    setLocalSearch("");
    onSearch?.("");
    if (!isExternalPagination) {
      setInternalPage(1);
    }
  };

  // Use the onExport prop instead of defining our own export logic
  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

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
                className={
                  filter.value ? "bg-primary text-primary-foreground" : ""
                }
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
                    <Button
                      variant="outline"
                      className="w-[280px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
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

      {/* Table - Enhanced Design */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          <Table className="min-w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={`font-medium text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wider py-3 px-3 ${
                      column.headerClassName || ""
                    }`}
                      style={{
                        width: column.width,
                        minWidth: column.minWidth,
                        maxWidth: column.maxWidth,
                      }}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleData.length > 0 ? (
                visibleData.map((row, index) => (
                  <TableRow
                    key={index}
                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent dark:hover:from-gray-800/50 dark:hover:to-transparent transition-all duration-200 group ${
                      getRowClassName ? getRowClassName(row) : ""
                    }`}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={`py-4 px-3 overflow-hidden ${column.className || ""}`}
                         style={{
                            width: column.width,
                            minWidth: column.minWidth,
                            maxWidth: column.maxWidth,
                          }}
                      >
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
                    className="h-32 text-center py-8"
                  >
                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                      <Building2 className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-lg font-medium mb-1">{emptyMessage}</p>
                      <p className="text-sm">
                        Try adjusting your search criteria
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              const newSize = parseInt(v, 10);
              if (isExternalPagination) {
                // External pagination: notify parent
                pagination?.onPageSizeChange?.(newSize);
              } else {
                // Internal pagination: update local state
                setInternalPageSize(newSize);
                setInternalPage(1);
              }
            }}
          >
            <SelectTrigger className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
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
              disabled={page <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goNext}
              disabled={page >= totalPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
