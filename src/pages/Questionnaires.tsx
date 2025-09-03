import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import mockData from "@/data/mockData.json"

const questionnaireColumns = [
  { key: "name", label: "Name" },
  { key: "id", label: "ID" },
  { key: "createdDate", label: "Created Date" },
  { key: "questions", label: "Questions" },
  { key: "products", label: "Products" },
  { key: "checkoutPages", label: "Checkout Pages" },
  { key: "domain", label: "Domain" },
  { key: "slug", label: "Slug" },
  { 
    key: "review", 
    label: "Review",
    render: (value: string) => (
      <Badge variant={value === "Unpublished" ? "destructive" : "default"}>
        {value}
      </Badge>
    )
  },
  { 
    key: "status", 
    label: "Status",
    render: (value: string) => (
      <Badge variant={value === "Approved" ? "default" : "secondary"}>
        {value}
      </Badge>
    )
  }
]

const statusFilters = ["All", "Active", "Inactive", "Extra Filters"]

export default function Questionnaires() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    domain: "",
    template: "",
    treatmentType: "",
    questionnaireType: "",
    testMode: "",
    belugaEnabled: "",
    defaultLanguage: "English",
    enableTranslations: "Yes",
    globalLayout: "Layout One"
  })

  const handleSave = () => {
    // Handle form submission
    setOpen(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Questionnaires</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>New Questionnaire</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="font-medium">Basic Info</div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="New Questionnaire"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">
                    Slug <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="/new-questionnaire"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">
                    Domain <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.domain}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, domain: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="domain1">Domain 1</SelectItem>
                      <SelectItem value="domain2">Domain 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template">Template</Label>
                  <Select
                    value={formData.template}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, template: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="template1">Template 1</SelectItem>
                      <SelectItem value="template2">Template 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="treatmentType">Treatment Type</Label>
                  <Select
                    value={formData.treatmentType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, treatmentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="type1">Type 1</SelectItem>
                      <SelectItem value="type2">Type 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questionnaireType">
                    Questionnaire Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.questionnaireType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, questionnaireType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="type1">Type 1</SelectItem>
                      <SelectItem value="type2">Type 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testMode">
                    Test Mode <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.testMode}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, testMode: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mode1">Mode 1</SelectItem>
                      <SelectItem value="mode2">Mode 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="belugaEnabled">
                    Beluga Enabled (RX) <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.belugaEnabled}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, belugaEnabled: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">
                    Default Language <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.defaultLanguage}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, defaultLanguage: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="English" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enableTranslations">
                    Enable Translations <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.enableTranslations}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, enableTranslations: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Yes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="globalLayout">
                    Global Layout <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.globalLayout}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, globalLayout: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Layout One" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="layout1">Layout One</SelectItem>
                      <SelectItem value="layout2">Layout Two</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Products</Label>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      + Add
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Sort</span>
        {statusFilters.map((status) => (
          <Button
            key={status}
            variant="outline"
            size="sm"
          >
            {status}
          </Button>
        ))}
      </div>

      <DataTable
        data={mockData.questionnaires}
        columns={questionnaireColumns}
        searchPlaceholder="Search by questionnaire name, slug, or ID"
      />
    </div>
  )
}