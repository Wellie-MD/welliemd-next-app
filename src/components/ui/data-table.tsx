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
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, RotateCcw, Download, Calendar, Filter } from "lucide-react"

interface Column {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  searchPlaceholder?: string
  showFilters?: boolean
  showExport?: boolean
  showDatePicker?: boolean
  onSearch?: (value: string) => void
  onFilter?: (filters: any) => void
  onExport?: () => void
}

export function DataTable({
  data,
  columns,
  searchPlaceholder = "Search...",
  showFilters = true,
  showExport = true,
  showDatePicker = true,
  onSearch,
  onFilter,
  onExport
}: DataTableProps) {
  return (
    <div className="space-y-4">
      {/* Search and Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-sm">
            <Input
              placeholder={searchPlaceholder}
              className="pl-10"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
          
          {showDatePicker && (
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Select date range
            </Button>
          )}
          
          {showFilters && (
            <Button variant="outline" className="gap-2">
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
          
          <Button variant="outline" size="icon">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
            {data.length > 0 ? (
              data.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
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
          <Select defaultValue="10">
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
            Page 1 of 1
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}