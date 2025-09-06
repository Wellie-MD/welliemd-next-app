import { useState, useMemo, useCallback } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import mockData from "@/data/mockData.json"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DateRange } from "react-day-picker"
import { isWithinInterval } from "date-fns"
import { exportToCSV } from "@/utils/exportUtils"

const goalColumns = [
  { key: "title", label: "Title" },
  { key: "duration", label: "Duration" },
  { key: "createdAt", label: "Created At" },
  { key: "totalWeightLoss", label: "Total Weight Loss" }
]

// Remove "All" from individual filter arrays
const durationFilters = ["3 Months", "6 Months", "9 Months", "12 Months"]
const weightLossFilters = ["Under 10kg", "10-15kg", "Over 15kg"]

// Helper function to parse date in DD/MM/YYYY format
const parseDate = (dateString: string) => {
  if (!dateString) return new Date()
  const [day, month, year] = dateString.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

export default function TreatmentConfigurations() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeDurationFilter, setActiveDurationFilter] = useState("All")
  const [activeWeightLossFilter, setActiveWeightLossFilter] = useState("All")
  const [date, setDate] = useState<DateRange | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [newTreatment, setNewTreatment] = useState({
    title: "",
    duration: "",
    weightLossTarget: ""
  })

  // Comprehensive filtering logic based on actual goal data
  const filteredGoals = useMemo(() => {
    return mockData.treatments.goals.filter(goal => {
      // Search filter - search by title
      const matchesSearch = !searchTerm || 
        goal.title.toLowerCase().includes(searchTerm.toLowerCase())

      // Duration filter based on actual duration values
      const matchesDuration = activeDurationFilter === "All" || goal.duration === activeDurationFilter

      // Weight loss filter based on actual totalWeightLoss values
      let matchesWeightLoss = true
      if (activeWeightLossFilter !== "All") {
        const weightLoss = parseInt(goal.totalWeightLoss.toString().replace('kg', ''))
        switch (activeWeightLossFilter) {
          case "Under 10kg":
            matchesWeightLoss = weightLoss < 10
            break
          case "10-15kg":
            matchesWeightLoss = weightLoss >= 10 && weightLoss <= 15
            break
          case "Over 15kg":
            matchesWeightLoss = weightLoss > 15
            break
        }
      }

      // Date range filter based on createdAt
      let matchesDateRange = true
      if (date?.from || date?.to) {
        const goalDate = parseDate(goal.createdAt)
        
        if (date.from && date.to) {
          matchesDateRange = isWithinInterval(goalDate, {
            start: date.from,
            end: date.to
          })
        } else if (date.from) {
          matchesDateRange = goalDate >= date.from
        } else if (date.to) {
          matchesDateRange = goalDate <= date.to
        }
      }

      return matchesSearch && matchesDuration && matchesWeightLoss && matchesDateRange
    })
  }, [mockData.treatments.goals, searchTerm, activeDurationFilter, activeWeightLossFilter, date, refreshKey])

  // Create meaningful filter configuration with single "All" button
  const filters = [
    // Single "All" button that resets both filters
    {
      key: 'all',
      label: 'All',
      type: 'button' as const,
      value: (activeDurationFilter === "All" && activeWeightLossFilter === "All") ? "All" : undefined,
      onClick: () => {
        setActiveDurationFilter("All")
        setActiveWeightLossFilter("All")
      }
    },
    // Duration filters (without "All")
    ...durationFilters.map(duration => ({
      key: `duration-${duration}`,
      label: duration,
      type: 'button' as const,
      value: activeDurationFilter === duration ? duration : undefined,
      onClick: () => {
        setActiveDurationFilter(duration)
        // Don't reset weight loss filter when selecting duration
      }
    })),
    // Weight Loss filters (without "All")
    ...weightLossFilters.map(weightLoss => ({
      key: `weightLoss-${weightLoss}`,
      label: weightLoss,
      type: 'button' as const,
      value: activeWeightLossFilter === weightLoss ? weightLoss : undefined,
      onClick: () => {
        setActiveWeightLossFilter(weightLoss)
        // Don't reset duration filter when selecting weight loss
      }
    }))
  ]

  const handleResetFilters = useCallback(() => {
    setActiveDurationFilter("All")
    setActiveWeightLossFilter("All")
    setDate(undefined)
    setSearchTerm("")
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    console.log("Refreshing treatment configurations data...")
  }, [])

  const handleExport = useCallback(() => {
    exportToCSV(filteredGoals, goalColumns, 'treatment_configurations')
  }, [filteredGoals])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurations</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Treatments</span>
            <span>›</span>
            <span>Configurations</span>
          </div>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Treatment Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title"
                  value={newTreatment.title}
                  onChange={(e) => setNewTreatment({...newTreatment, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (in months)</Label>
                <Input 
                  id="duration"
                  type="number"
                  min="1"
                  value={newTreatment.duration}
                  onChange={(e) => setNewTreatment({...newTreatment, duration: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="weightLossTarget">Weight Loss Target (lbs)</Label>
                <Input 
                  id="weightLossTarget"
                  type="number"
                  min="1"
                  value={newTreatment.weightLossTarget}
                  onChange={(e) => setNewTreatment({...newTreatment, weightLossTarget: e.target.value})}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsOpen(false)
                  setNewTreatment({ title: "", duration: "", weightLossTarget: "" })
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (!newTreatment.title || !newTreatment.duration || !newTreatment.weightLossTarget) {
                      alert("Please fill in all fields")
                      return
                    }
                    console.log("Saving treatment:", newTreatment)
                    setIsOpen(false)
                    setNewTreatment({ title: "", duration: "", weightLossTarget: "" })
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Goals</h2>
          <DataTable
            data={filteredGoals}
            columns={goalColumns}
            searchPlaceholder="Search by title"
            showDatePicker={true}
            showExport={true}
            showResetFilters={true}
            filters={filters}
            dateRange={date}
            onDateRangeChange={setDate}
            onSearch={setSearchTerm}
            onResetFilters={handleResetFilters}
            onExport={handleExport}
            onRefresh={handleRefresh}
          />
        </div>

        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
            </div>
            <p className="text-sm text-muted-foreground">
              By disabling the Goals feature, all patient's on this treatment type will be unable to view the page in the Patient's Portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
