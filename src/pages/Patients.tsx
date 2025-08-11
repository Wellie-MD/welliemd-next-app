import { useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const patientColumns = [
  { key: "name", label: "Name" },
  { key: "startDate", label: "Start Date" },
  { key: "mrn", label: "MRN #" },
  { key: "subscription", label: "Subscription" },
  { key: "productName", label: "Product Name" },
  { key: "email", label: "Email" },
  { 
    key: "phone", 
    label: "Phone Number",
    render: (value: string) => (
      <span className="font-mono text-sm">{value}</span>
    )
  },
  { key: "orders", label: "Order(s)" },
  { key: "location", label: "Location" },
  { key: "patientStatus", label: "Patient Status" },
  { key: "visitStatus", label: "Visit Status" },
  { key: "lastOrder", label: "Last Order" }
]

const statusFilters = ["All", "Active", "Pending", "Abandon", "Canceled"]

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")
  const [date, setDate] = useState<DateRange | undefined>()
  const [isOpen, setIsOpen] = useState(false)
  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    email: "",
  })

  const filteredPatients = mockData.patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Patients</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName"
                  value={newPatient.firstName}
                  onChange={(e) => setNewPatient({...newPatient, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName"
                  value={newPatient.lastName}
                  onChange={(e) => setNewPatient({...newPatient, lastName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsOpen(false)
                  setNewPatient({ firstName: "", lastName: "", email: "" })
                }}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Here you would typically save the patient data
                  console.log("Saving patient:", newPatient)
                  setIsOpen(false)
                  setNewPatient({ firstName: "", lastName: "", email: "" })
                }}>
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2">
        {statusFilters.map((status) => (
          <Button
            key={status}
            variant={activeFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(status)}
            className={activeFilter === status ? "bg-primary text-primary-foreground" : ""}
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Additional Filter Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          Refills
        </Button>
        <Button variant="outline" size="sm">
          Visit Status
        </Button>
        <Button variant="outline" size="sm">
          Patient Status
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[300px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <DataTable
        data={filteredPatients}
        columns={patientColumns}
        searchPlaceholder="Search by patient, Ex: name or email phone number, MRN#"
        onSearch={setSearchTerm}
      />
    </div>
  )
}