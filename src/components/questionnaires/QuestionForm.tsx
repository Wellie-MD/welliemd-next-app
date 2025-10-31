import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  questionApi,
  templateApi,
  Question,
  CreateQuestionPayload,
} from "@/api/questionnaires";

interface QuestionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  question?: Question | null;
  onSuccess: () => void;
}

interface ExtendedQuestionPayload extends CreateQuestionPayload {
  max_file_size?: number;
  allowed_extensions?: string[];
  is_follow_up?: boolean;
  parent_question_id?: string;
  trigger_value?: string;
  consent_text?: string;
  consent_type?: string;
  requires_agreement?: boolean;
  is_disqualifying?: boolean;
  beluga_consent_code?: string;
}

export function QuestionForm({
  open,
  onOpenChange,
  templateId,
  question,
  onSuccess,
}: QuestionFormProps) {
  const [loading, setLoading] = useState(false);

  const [existingQuestions, setExistingQuestions] = useState<Question[]>([]);

  const [formData, setFormData] = useState<ExtendedQuestionPayload>({
    template_id: templateId,
    question_text: "",
    question_type: "text",
    is_required: true,
    answer_choices: [],
    conditional_logic: {},
    validation_rules: {},
    beluga_field_mapping: "none",
    include_in_qa_section: true,
    max_file_size: 5,
    allowed_extensions: [],
    is_follow_up: false,
    parent_question_id: "",
    trigger_value: "",
    consent_text: "",
    consent_type: "custom",
    requires_agreement: true,
    is_disqualifying: false,
    beluga_consent_code: "",
  });

  const [newAnswerChoice, setNewAnswerChoice] = useState("");

  // Fetch template and existing questions when modal opens
  useEffect(() => {
    const fetchTemplateData = async () => {
      if (open && templateId) {
        try {
          const templateData = await templateApi.getTemplate(templateId);
          setExistingQuestions(templateData.questions || []);
        } catch (error) {
          console.error("Failed to fetch template:", error);
        }
      }
    };
    fetchTemplateData();
  }, [open, templateId]);

  useEffect(() => {
    if (question) {
      // Extract follow-up data from conditional_logic
      const isFollowUp = !!question.conditional_logic?.show_if;
      const parentQuestionId =
        question.conditional_logic?.show_if?.question_id || "";
      const triggerValue = question.conditional_logic?.show_if?.value || "";

      setFormData({
        template_id: templateId,
        question_text: question.question_text,
        question_type: question.question_type,
        is_required: question.is_required,
        answer_choices: question.answer_choices || [],
        conditional_logic: question.conditional_logic || {},
        validation_rules: question.validation_rules || {},
        beluga_field_mapping: question.beluga_field_mapping || "none",
        include_in_qa_section: question.include_in_qa_section,
        max_file_size:
          ((question.validation_rules as Record<string, unknown>)
            ?.max_file_size as number) || 5,
        allowed_extensions:
          ((question.validation_rules as Record<string, unknown>)
            ?.allowed_extensions as string[]) || [],
        is_follow_up: isFollowUp,
        parent_question_id: parentQuestionId,
        trigger_value: triggerValue,
        consent_text: question.consent_form?.consent_text || "",
        consent_type: question.consent_form?.consent_type || "custom",
        requires_agreement: question.consent_form?.requires_agreement !== undefined ? question.consent_form.requires_agreement : true,
        is_disqualifying: question.consent_form?.is_disqualifying || false,
        beluga_consent_code: question.consent_form?.beluga_consent_code || "",
      });
    } else {
      setFormData({
        template_id: templateId,
        question_text: "",
        question_type: "text",
        is_required: true,
        answer_choices: [],
        conditional_logic: {},
        validation_rules: {},
        beluga_field_mapping: "none",
        include_in_qa_section: true,
        max_file_size: 5,
        allowed_extensions: [],
        is_follow_up: false,
        parent_question_id: "",
        trigger_value: "",
        consent_text: "",
        consent_type: "custom",
        requires_agreement: true,
        is_disqualifying: false,
        beluga_consent_code: "",
      });
    }
  }, [question, templateId, open]);

  const handleAddChoice = () => {
    if (newAnswerChoice.trim()) {
      setFormData({
        ...formData,
        answer_choices: [
          ...(formData.answer_choices || []),
          newAnswerChoice.trim(),
        ],
      });
      setNewAnswerChoice("");
    }
  };

  const handleRemoveChoice = (index: number) => {
    setFormData({
      ...formData,
      answer_choices:
        formData.answer_choices?.filter((_, i) => i !== index) || [],
    });
  };

  const handleUpdateChoice = (index: number, value: string) => {
    const updatedChoices = [...(formData.answer_choices || [])];
    updatedChoices[index] = value;
    setFormData({
      ...formData,
      answer_choices: updatedChoices,
    });
  };

  const handleToggleExtension = (ext: string) => {
    const current = formData.allowed_extensions || [];
    const updated = current.includes(ext)
      ? current.filter((e) => e !== ext)
      : [...current, ext];
    setFormData({
      ...formData,
      allowed_extensions: updated,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question_text.trim()) {
      toast({
        title: "Validation Error",
        description: "Question text is required",
        variant: "destructive",
      });
      return;
    }

    // Validate answer choices for choice-based questions
    const choiceTypes = ["single_choice", "multiple_choice"];
    if (
      choiceTypes.includes(formData.question_type) &&
      (!formData.answer_choices || formData.answer_choices.length === 0)
    ) {
      toast({
        title: "Validation Error",
        description:
          "At least one answer choice is required for this question type",
        variant: "destructive",
      });
      return;
    }

    // Validate consent text for consent questions
    if (formData.question_type === "consent" && !formData.consent_text?.trim()) {
      toast({
        title: "Validation Error",
        description: "Consent text is required for consent questions",
        variant: "destructive",
      });
      return;
    }

    // Validate follow-up settings
    if (formData.is_follow_up) {
      if (!formData.parent_question_id) {
        toast({
          title: "Validation Error",
          description: "Parent question is required for follow-up questions",
          variant: "destructive",
        });
        return;
      }
      if (!formData.trigger_value) {
        toast({
          title: "Validation Error",
          description: "Trigger value is required for follow-up questions",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setLoading(true);

      // Build conditional_logic based on follow-up settings
      const conditionalLogic = formData.is_follow_up
        ? {
            show_if: {
              question_id: formData.parent_question_id,
              value: formData.trigger_value,
              operator: "equals",
            },
          }
        : {};

      // Build validation_rules for file upload
      const validationRules =
        formData.question_type === "file_upload"
          ? {
              max_file_size: formData.max_file_size,
              allowed_extensions: formData.allowed_extensions,
            }
          : formData.validation_rules || {};

      // Build consent_form for consent questions
      const consentForm =
        formData.question_type === "consent" && formData.consent_text
          ? {
              consent_type: formData.consent_type || "custom",
              consent_text: formData.consent_text,
              requires_agreement: formData.requires_agreement !== undefined ? formData.requires_agreement : true,
              is_disqualifying: formData.is_disqualifying || false,
              beluga_consent_code: formData.beluga_consent_code || "",
            }
          : undefined;

      const payload: CreateQuestionPayload = {
        template_id: formData.template_id,
        question_text: formData.question_text,
        question_type: formData.question_type,
        is_required: formData.is_required,
        answer_choices: formData.answer_choices,
        conditional_logic: conditionalLogic,
        validation_rules: validationRules,
        beluga_field_mapping:
          formData.beluga_field_mapping === "none"
            ? undefined
            : formData.beluga_field_mapping,
        include_in_qa_section: formData.include_in_qa_section,
        consent_form_data: consentForm,
      };

      if (question) {
        await questionApi.updateQuestion(question.id, payload);
        toast({
          title: "Success",
          description: "Question updated successfully",
        });
      } else {
        await questionApi.createQuestion(payload);
        toast({
          title: "Success",
          description: "Question created successfully",
        });
      }

      onSuccess();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: `Failed to ${question ? "update" : "create"} question`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Dynamic visibility flags
  const showAnswerChoices = ["single_choice", "multiple_choice"].includes(
    formData.question_type
  );
  const showFileSettings = formData.question_type === "file_upload";
  const showConsentSettings = formData.question_type === "consent";
  const showFollowUpSettings = formData.is_follow_up;

  // Get parent question's answer choices for trigger dropdown
  const selectedParent = existingQuestions.find(
    (q) => q.id === formData.parent_question_id
  );
  const triggerOptions = selectedParent?.answer_choices || [];

  // Filter out current question from parent options (when editing)
  const parentQuestionOptions = existingQuestions.filter(
    (q) => q.id !== question?.id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle>
            {question ? "Edit Question" : "Add New Question"}
          </DialogTitle>
          <DialogDescription>
            {question
              ? "Update the question details below."
              : "Create a new question for this template."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="question_text">
              Question Text <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="question_text"
              value={formData.question_text}
              onChange={(e) =>
                setFormData({ ...formData, question_text: e.target.value })
              }
              placeholder="Enter your question here"
              rows={3}
              required
            />
          </div>

          {/* Question Type */}
          <div className="space-y-2">
            <Label htmlFor="question_type">
              Question Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.question_type}
              onValueChange={(value) =>
                setFormData({ ...formData, question_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text (Short Answer)</SelectItem>
                <SelectItem value="textarea">
                  Text Area (Long Answer)
                </SelectItem>
                <SelectItem value="single_choice">
                  Single Choice (Radio)
                </SelectItem>
                <SelectItem value="multiple_choice">
                  Multiple Choice (Checkbox)
                </SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="height_weight">Height & Weight</SelectItem>
                <SelectItem value="consent">Consent Checkbox</SelectItem>
                <SelectItem value="file_upload">File Upload</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Answer Choices */}
          {showAnswerChoices && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-sm">Answer Configuration</h3>
              <div className="space-y-2">
                <Label>
                  Answer Choices <span className="text-red-500">*</span>
                </Label>

                {/* Existing choices */}
                <div className="space-y-2">
                  {formData.answer_choices?.map((choice, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={choice}
                        onChange={(e) =>
                          handleUpdateChoice(index, e.target.value)
                        }
                        placeholder={`Choice ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveChoice(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add new choice */}
                <div className="flex gap-2">
                  <Input
                    value={newAnswerChoice}
                    onChange={(e) => setNewAnswerChoice(e.target.value)}
                    placeholder="Enter a new answer choice"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddChoice();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddChoice}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* File Upload Settings */}
          {showFileSettings && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-sm">File Upload Settings</h3>

              <div className="space-y-2">
                <Label htmlFor="max_file_size">Max File Size (MB)</Label>
                <Input
                  id="max_file_size"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.max_file_size || 5}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_file_size: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Allowed File Extensions</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["pdf", "jpg", "jpeg", "png", "doc", "docx"].map((ext) => (
                    <div key={ext} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`ext-${ext}`}
                        checked={
                          formData.allowed_extensions?.includes(ext) || false
                        }
                        onChange={() => handleToggleExtension(ext)}
                        className="rounded"
                      />
                      <label
                        htmlFor={`ext-${ext}`}
                        className="text-sm cursor-pointer"
                      >
                        .{ext}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Consent Settings */}
          {showConsentSettings && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-sm">Consent Configuration</h3>

              <div className="space-y-2">
                <Label htmlFor="consent_type">Consent Type</Label>
                <Select
                  value={formData.consent_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, consent_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select consent type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hipaa">HIPAA Authorization</SelectItem>
                    <SelectItem value="telehealth">Telehealth Consent</SelectItem>
                    <SelectItem value="treatment">Treatment Consent</SelectItem>
                    <SelectItem value="privacy">Privacy Policy</SelectItem>
                    <SelectItem value="terms">Terms of Service</SelectItem>
                    <SelectItem value="marketing">Marketing Communications</SelectItem>
                    <SelectItem value="custom">Custom Consent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consent_text">
                  Consent Text <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="consent_text"
                  value={formData.consent_text}
                  onChange={(e) =>
                    setFormData({ ...formData, consent_text: e.target.value })
                  }
                  placeholder="Enter the full consent text that users will see..."
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This text will be displayed to users. They will see "Agree" and "Disagree" options.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requires_agreement">Requires Agreement</Label>
                    <p className="text-xs text-muted-foreground">
                      User must agree to proceed
                    </p>
                  </div>
                  <Switch
                    id="requires_agreement"
                    checked={formData.requires_agreement}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requires_agreement: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_disqualifying">Is Disqualifying</Label>
                    <p className="text-xs text-muted-foreground">
                      Refusal disqualifies the patient
                    </p>
                  </div>
                  <Switch
                    id="is_disqualifying"
                    checked={formData.is_disqualifying}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_disqualifying: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="beluga_consent_code">Beluga Consent Code (Optional)</Label>
                <Input
                  id="beluga_consent_code"
                  value={formData.beluga_consent_code}
                  onChange={(e) =>
                    setFormData({ ...formData, beluga_consent_code: e.target.value })
                  }
                  placeholder="e.g., HIPAA_AUTH"
                />
              </div>
            </div>
          )}

          {/* Beluga Field Mapping */}
          <div className="space-y-2">
            <Label htmlFor="beluga_field_mapping">Beluga Field Mapping</Label>
            <Select
              value={formData.beluga_field_mapping}
              onValueChange={(value) =>
                setFormData({ ...formData, beluga_field_mapping: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field mapping" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="first_name">First Name</SelectItem>
                <SelectItem value="last_name">Last Name</SelectItem>
                <SelectItem value="date_of_birth">Date of Birth</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="address">Address</SelectItem>
                <SelectItem value="height">Height</SelectItem>
                <SelectItem value="weight">Weight</SelectItem>
                <SelectItem value="medical_history">Medical History</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Follow-up Settings */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_follow_up">Is Follow-up Question</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Show this question only when a parent question has a specific
                  answer
                </p>
              </div>
              <Switch
                id="is_follow_up"
                checked={formData.is_follow_up}
                onCheckedChange={(checked) => {
                  setFormData({
                    ...formData,
                    is_follow_up: checked,
                    parent_question_id: checked
                      ? formData.parent_question_id
                      : "",
                    trigger_value: checked ? formData.trigger_value : "",
                  });
                }}
                disabled={parentQuestionOptions.length === 0}
              />
            </div>

            {parentQuestionOptions.length === 0 && (
              <p className="text-xs text-amber-600">
                No existing questions available. Add other questions first to
                create follow-ups.
              </p>
            )}

            {showFollowUpSettings && (
              <div className="space-y-3 mt-3 pl-4 border-l-2">
                {/* Parent Question */}
                <div className="space-y-2">
                  <Label htmlFor="parent_question">
                    Parent Question <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.parent_question_id}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        parent_question_id: value,
                        trigger_value: "",
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select parent question" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentQuestionOptions.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.order_index ? `${q.order_index}. ` : ""}
                          {q.question_text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Trigger Value */}
                {selectedParent && (
                  <div className="space-y-2">
                    <Label htmlFor="trigger_value">
                      Trigger Value <span className="text-red-500">*</span>
                    </Label>
                    {triggerOptions.length > 0 ? (
                      <Select
                        value={formData.trigger_value}
                        onValueChange={(value) =>
                          setFormData({ ...formData, trigger_value: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger value" />
                        </SelectTrigger>
                        <SelectContent>
                          {triggerOptions.map((option, idx) => (
                            <SelectItem key={idx} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-xs text-amber-600 p-2 bg-amber-50 rounded">
                        The selected parent question has no answer choices.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_required">Required Question</Label>
              <Switch
                id="is_required"
                checked={formData.is_required}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_required: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="include_in_qa">Include in QA Section</Label>
              <Switch
                id="include_in_qa"
                checked={formData.include_in_qa_section}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, include_in_qa_section: checked })
                }
              />
            </div>
          </div>

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
              {loading
                ? "Saving..."
                : question
                ? "Update Question"
                : "Create Question"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
