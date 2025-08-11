import { useState } from "react"
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

const goalColumns = [
  { key: "title", label: "Title" },
  { key: "duration", label: "Duration" },
  { key: "createdAt", label: "Created At" },
  { key: "totalWeightLoss", label: "Total Weight Loss" }
]

export default function TreatmentConfigurations() {
  const [isOpen, setIsOpen] = useState(false)
  const [newTreatment, setNewTreatment] = useState({
    title: "",
    duration: "",
    weightLossTarget: ""
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurations</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Treatments</span>
            <span>›</span>
            <span>Treatments</span>
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
                    // Here you would typically save the treatment configuration
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
            data={mockData.treatments.goals}
            columns={goalColumns}
            searchPlaceholder="Search by title"
            showDatePicker={false}
            showExport={false}
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