"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, RotateCcw, Download, ViewIcon, List } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"

interface TableFiltersProps {
  searchPlaceholder?: string
  statusFilters?: string[]
  onSearch?: (value: string) => void
  onStatusChange?: (status: string) => void
  onDateChange?: (date: Date | undefined) => void
  onReset?: () => void
  onExport?: () => void
  showDatePicker?: boolean
  showExport?: boolean
  additionalFilters?: {
    label: string;
    onClick: () => void;
  }[]
}

export function TableFilters({
  searchPlaceholder = "Search...",
  statusFilters = [],
  onSearch,
  onStatusChange,
  onDateChange,
  onReset,
  onExport,
  showDatePicker = true,
  showExport = true,
  additionalFilters = []
}: TableFiltersProps) {
  const [date, setDate] = useState<Date>()
  const [selectedStatus, setSelectedStatus] = useState("All")

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    onDateChange?.(newDate)
  }

  const handleStatusClick = (status: string) => {
    setSelectedStatus(status)
    onStatusChange?.(status)
  }

  return (
    <div className="space-y-4">
      {/* Search and Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Input
            placeholder={searchPlaceholder}
            className="pl-10"
            onChange={(e) => onSearch?.(e.target.value)}
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          {showDatePicker && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}

          <Button variant="outline" className="gap-2" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            Reset Filters
          </Button>

          <Button variant="outline" className="gap-2">
            <ViewIcon className="h-4 w-4" />
            View
          </Button>

          {showExport && (
            <Button variant="outline" className="gap-2" onClick={onExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}

          <Button variant="outline" size="icon">
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Filters */}
      {statusFilters.length > 0 && (
        <div className="flex items-center gap-2">
          {statusFilters.map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusClick(status)}
            >
              {status}
            </Button>
          ))}
        </div>
      )}

      {/* Additional Filters */}
      {additionalFilters.length > 0 && (
        <div className="flex items-center gap-2">
          {additionalFilters.map((filter, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={filter.onClick}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
