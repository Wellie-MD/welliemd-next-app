import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Lock, GripVertical } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  createTemplate,
  templateApi,
  updateTemplate,
  createQuestion,
  QuestionnaireTemplate,
  CreateTemplatePayload,
  CreateQuestionPayload
} from "@/api/questionnaires"

interface AddQuestionnairesFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: QuestionnaireTemplate | null
  onSuccess: () => void
}

interface QuestionFormData {
  id?: string
  question_text: string
  question_type: string
  is_required: boolean
  answer_choices: string[]
  beluga_field_mapping: string
  include_in_qa_section: boolean
}

const QUESTION_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "single_choice", label: "Single Choice" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "height_weight", label: "Height & Weight" },
  { value: "consent", label: "Consent" },
  { value: "file_upload", label: "File Upload" },
]

const FIELD_MAPPINGS = [
  { value: "none", label: "None" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "dateOfBirth", label: "Date of Birth" },
  { value: "sex", label: "Sex" },
  { value: "medicalConditions", label: "Medical Conditions" },
  { value: "medications", label: "Current Medications" },
  { value: "allergies", label: "Allergies" },
  { value: "custom_qa", label: "Custom Q&A" },
]

export default function AddQuestionnairesForm({
  open,
  onOpenChange,
  template,
  onSuccess
}: AddQuestionnairesFormProps) {
  const [loading, setLoading] = useState(false)
  const [followupTemplates, setFollowupTemplates] = useState<QuestionnaireTemplate[]>([])
  const [formData, setFormData] = useState<CreateTemplatePayload>({
    name: "",
    description: "",
    questionnaire_type: "onboarding",
    treatment_type: "",
    beluga_visit_type: "",
    slug: "",
    requires_photo_upload: false,
    requires_labs: false,
    requires_identity_verification: false,
    min_age: 18,
    is_admin_template: true,
    default_followup_template: null,
  })
  const [questions, setQuestions] = useState<QuestionFormData[]>([])

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || "",
        questionnaire_type: template.questionnaire_type,
        treatment_type: template.treatment_type || "",
        beluga_visit_type: template.beluga_visit_type || "",
        slug: template.slug || "",
        requires_photo_upload: template.requires_photo_upload || false,
        requires_labs: (template as any).requires_labs || false,
        requires_identity_verification: template.requires_identity_verification || false,
        min_age: template.min_age || 18,
        is_admin_template: template.is_admin_template !== undefined ? template.is_admin_template : true,
        default_followup_template: template.default_followup_template || null,
      })
      setQuestions([])
    } else {
      setFormData({
        name: "",
        description: "",
        questionnaire_type: "onboarding",
        treatment_type: "",
        beluga_visit_type: "",
        slug: "",
        requires_photo_upload: false,
        requires_labs: false,
        requires_identity_verification: false,
        min_age: 18,
        is_admin_template: true,
        default_followup_template: null,
      })
      setQuestions([])
    }
  }, [template, open])

  useEffect(() => {
    const loadFollowups = async () => {
      if (!open) return
      try {
        const templates = await templateApi.listTemplates({ standaloneOnly: true })
        setFollowupTemplates(
          (templates || []).filter(
            (t) =>
              t.questionnaire_type === "follow_up" &&
              (!template || t.id !== template.id)
          )
        )
      } catch {
        setFollowupTemplates([])
      }
    }
    loadFollowups()
  }, [open, template])

  useEffect(() => {
    if (formData.questionnaire_type !== "onboarding" && formData.default_followup_template) {
      setFormData((prev) => ({ ...prev, default_followup_template: null }))
    }
  }, [formData.questionnaire_type, formData.default_followup_template])

  const addQuestion = () => {
    const newQuestion: QuestionFormData = {
      question_text: "",
      question_type: "text",
      is_required: false,
      answer_choices: [],
      beluga_field_mapping: "none",
      include_in_qa_section: true,
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (index: number, field: keyof QuestionFormData, value: string | boolean | string[]) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value }
    setQuestions(updatedQuestions)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const addAnswerChoice = (questionIndex: number) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].answer_choices.push("")
    setQuestions(updatedQuestions)
  }

  const updateAnswerChoice = (questionIndex: number, choiceIndex: number, value: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].answer_choices[choiceIndex] = value
    setQuestions(updatedQuestions)
  }

  const removeAnswerChoice = (questionIndex: number, choiceIndex: number) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].answer_choices = updatedQuestions[questionIndex].answer_choices.filter((_, i) => i !== choiceIndex)
    setQuestions(updatedQuestions)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive",
      })
      return
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question_text.trim()) {
        toast({
          title: "Validation Error",
          description: `Question ${i + 1} text is required`,
          variant: "destructive",
        })
        return
      }
      if ((q.question_type === "single_choice" || q.question_type === "multiple_choice") && q.answer_choices.length === 0) {
        toast({
          title: "Validation Error",
          description: `Question ${i + 1} requires at least one answer choice`,
          variant: "destructive",
        })
        return
      }
    }

    try {
      setLoading(true)

      // Remove beluga_visit_type if it's empty
      const payload = {
        ...formData,
        beluga_visit_type: formData.beluga_visit_type.trim() === "" ? undefined : formData.beluga_visit_type,
        slug: (formData.slug || "").trim() === "" ? undefined : formData.slug,
      }

      let createdTemplate: QuestionnaireTemplate

      if (template) {
        createdTemplate = await updateTemplate(template.id, payload)
        toast({
          title: "Success",
          description: "Template updated successfully",
        })
      } else {
        createdTemplate = await createTemplate(payload)

        // Create questions for the new template
        if (questions.length > 0) {
          for (let i = 0; i < questions.length; i++) {
            const q = questions[i]
            const questionPayload: CreateQuestionPayload = {
              template_id: createdTemplate.id,
              question_text: q.question_text,
              question_type: q.question_type,
              is_required: q.is_required,
              is_read_only: true, // Always true for admin-created questions
              answer_choices: q.answer_choices.filter(c => c.trim() !== ""),
              beluga_field_mapping: q.beluga_field_mapping !== "none" ? q.beluga_field_mapping : undefined,
              include_in_qa_section: q.include_in_qa_section,
            }
            await createQuestion(questionPayload)
          }
        }

        toast({
          title: "Success",
          description: `Template created successfully${questions.length > 0 ? ` with ${questions.length} question(s)` : ""}`,
        })
      }

      onSuccess()
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: `Failed to ${template ? "update" : "create"} template`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Template" : "Create New Template"}
          </DialogTitle>
          <DialogDescription>
            {template
              ? "Update the template details below."
              : "Create a new questionnaire template. All questions created will be read-only by default."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6 py-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Template Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Weight Loss Intake Form"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this template"
              rows={3}
            />
          </div>

          {/* Questionnaire Type */}
          <div className="space-y-2">
            <Label htmlFor="questionnaire_type">
              Questionnaire Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.questionnaire_type}
              onValueChange={(value) => setFormData({ ...formData, questionnaire_type: value as "onboarding" | "follow_up" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Treatment Type */}
          <div className="space-y-2">
            <Label htmlFor="treatment_type">Treatment Type</Label>
            <Input
              id="treatment_type"
              value={formData.treatment_type}
              onChange={(e) => setFormData({ ...formData, treatment_type: e.target.value })}
              placeholder="e.g., Weight Loss, GLP-1, Erectile Dysfunction"
            />
          </div>

          {/* Visit Type */}
          <div className="space-y-2">
            <Label htmlFor="beluga_visit_type">Visit Type</Label>
            <Input
              id="beluga_visit_type"
              value={formData.beluga_visit_type}
              onChange={(e) => setFormData({ ...formData, beluga_visit_type: e.target.value })}
              placeholder="e.g., Initial Visit, Follow-up, Consultation (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              value={formData.slug || ""}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g., initial-visit-v2 (optional)"
            />
            <p className="text-xs text-muted-foreground">
              Optional routing slug. If multiple active templates share the same Visit Type,
              each one needs a unique slug. If left blank, backend auto-generates one when required.
            </p>
          </div>

          {formData.questionnaire_type === "onboarding" && (
            <div className="space-y-2">
              <Label htmlFor="default_followup_template">
                Default Follow-up Template
              </Label>
              <Select
                value={formData.default_followup_template || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    default_followup_template: value === "none" ? null : value,
                  })
                }
              >
                <SelectTrigger id="default_followup_template">
                  <SelectValue placeholder="Select default follow-up template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Default Follow-up</SelectItem>
                  {followupTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Used to auto-select follow-up for episodes started from this onboarding template.
              </p>
            </div>
          )}

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_admin_template">
                Admin Template
                <span className="text-xs text-muted-foreground ml-2">
                  (Can be assigned to clients)
                </span>
              </Label>
              <Switch
                id="is_admin_template"
                checked={formData.is_admin_template}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_admin_template: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requires_photo">Requires Photo Upload</Label>
              <Switch
                id="requires_photo"
                checked={formData.requires_photo_upload}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requires_photo_upload: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requires_labs">Requires Labs</Label>
              <Switch
                id="requires_labs"
                checked={formData.requires_labs || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requires_labs: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requires_verification">
                Requires Identity Verification
              </Label>
              <Switch
                id="requires_verification"
                checked={formData.requires_identity_verification}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requires_identity_verification: checked })
                }
              />
            </div>
          </div>

          {/* Question Builder Section */}
          {!template && (
            <>
              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Questions</h3>
                    <p className="text-sm text-muted-foreground">
                      Add questions to this template. All questions will be read-only by default.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                {questions.length > 0 && (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {questions.map((question, qIndex) => (
                      <div
                        key={qIndex}
                        className="border rounded-lg p-4 space-y-4 bg-muted/30"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="secondary">Q{qIndex + 1}</Badge>
                            <Badge variant="outline" className="gap-1">
                              <Lock className="h-3 w-3" />
                              Read-only
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(qIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>

                        {/* Question Text */}
                        <div className="space-y-2">
                          <Label htmlFor={`question_text_${qIndex}`}>
                            Question Text <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id={`question_text_${qIndex}`}
                            value={question.question_text}
                            onChange={(e) => updateQuestion(qIndex, "question_text", e.target.value)}
                            placeholder="Enter your question..."
                            rows={2}
                          />
                        </div>

                        {/* Question Type */}
                        <div className="space-y-2">
                          <Label htmlFor={`question_type_${qIndex}`}>Question Type</Label>
                          <Select
                            value={question.question_type}
                            onValueChange={(value) => updateQuestion(qIndex, "question_type", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {QUESTION_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Answer Choices for single/multiple choice */}
                        {(question.question_type === "single_choice" || question.question_type === "multiple_choice") && (
                          <div className="space-y-2">
                            <Label>Answer Choices</Label>
                            <div className="space-y-2">
                              {question.answer_choices.map((choice, cIndex) => (
                                <div key={cIndex} className="flex items-center gap-2">
                                  <Input
                                    value={choice}
                                    onChange={(e) => updateAnswerChoice(qIndex, cIndex, e.target.value)}
                                    placeholder={`Choice ${cIndex + 1}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeAnswerChoice(qIndex, cIndex)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addAnswerChoice(qIndex)}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Choice
                              </Button>
                            </div>
                          </div>
                        )}


                        {/* Toggles */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Required</Label>
                            <Switch
                              checked={question.is_required}
                              onCheckedChange={(checked) => updateQuestion(qIndex, "is_required", checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label>Include in Q&A Section</Label>
                            <Switch
                              checked={question.include_in_qa_section}
                              onCheckedChange={(checked) => updateQuestion(qIndex, "include_in_qa_section", checked)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {questions.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      No questions added yet. Click "Add Question" to get started.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : template ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
