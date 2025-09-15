import { Button } from "@/components/ui/button"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { ScrollArea } from "@/components/ui/scroll-area"

interface AddQuestionnairesFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddQuestionnairesForm({ open, onOpenChange }: AddQuestionnairesFormProps) {
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
    console.log("Form data:", formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-0">
          <DialogTitle>New Questionnaire</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="space-y-6 py-4 px-5">
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
          </div>
        </ScrollArea>
        
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}