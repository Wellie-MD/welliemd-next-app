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
import { Plus, Trash2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  questionApi,
  templateApi,
  Question,
  CreateQuestionPayload,
  QuestionnaireTemplate,
} from "@/api/questionnaires";
import { ReadOnlyIndicator } from "./ReadOnlyIndicator";

interface AddQuestionnairesFormProps {
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
}

export function AddQuestionnairesForm({
  open,
  onOpenChange,
  templateId,
  question,
  onSuccess,
}: AddQuestionnairesFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      });
    }
  }, [question, templateId, open, existingQuestions]);

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
        // Note: is_read_only is automatically set to false by the backend for client-created questions
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
      const errorMessage =
        (error as unknown)?.response?.data?.message ||
        `Failed to ${question ? "update" : "create"} question`;
      toast({
        title: "Error",
        description: errorMessage,
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

  // Check if question is read-only
  const isReadOnly = question?.is_read_only || false;

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

        {/* Read-only warning view */}
        {isReadOnly ? (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/30">
              <Lock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Question is Locked</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                This question is from the admin template and cannot be modified
                or deleted. Only administrators can edit template questions.
              </p>
              <ReadOnlyIndicator />
            </div>

            {/* Display question details in read-only mode */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
              <div>
                <Label className="text-muted-foreground">Question Text</Label>
                <p className="mt-1 text-sm">{question?.question_text}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Question Type</Label>
                <p className="mt-1 text-sm capitalize">
                  {question?.question_type?.replace(/_/g, " ")}
                </p>
              </div>

              {question?.answer_choices &&
                question.answer_choices.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">
                      Answer Choices
                    </Label>
                    <ul className="mt-1 text-sm list-disc list-inside">
                      {question.answer_choices.map((choice, idx) => (
                        <li key={idx}>{choice}</li>
                      ))}
                    </ul>
                  </div>
                )}

              <div className="flex gap-4">
                <div>
                  <Label className="text-muted-foreground">Required</Label>
                  <p className="mt-1 text-sm">
                    {question?.is_required ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Include in QA</Label>
                  <p className="mt-1 text-sm">
                    {question?.include_in_qa_section ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>

            {/* Close button */}
            <div className="flex justify-end pt-4">
              <Button type="button" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
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

            {/* ========== ANSWER CONFIGURATION (Single/Multiple Choice) ========== */}
            {showAnswerChoices && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold text-sm">Answer Configuration</h3>
                <div className="space-y-2">
                  <Label>
                    Answer Choices <span className="text-red-500">*</span>
                  </Label>

                  {/* Existing choices with inline edit */}
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

            {/* ========== FILE UPLOAD SETTINGS ========== */}
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
                  <SelectItem value="medical_history">
                    Medical History
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ========== FOLLOW-UP SETTINGS ========== */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_follow_up">Is Follow-up Question</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Show this question only when a parent question has a
                    specific answer
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
                  {/* Parent Question Dropdown */}
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
                          trigger_value: "", // Reset trigger when parent changes
                        });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select parent question" />
                      </SelectTrigger>
                      <SelectContent
                        className="max-w-[min(600px,calc(100vw-20rem))]"
                        position="popper"
                        sideOffset={5}
                      >
                        {parentQuestionOptions.map((q) => (
                          <SelectItem
                            key={q.id}
                            value={q.id}
                            className="max-w-full"
                          >
                            <span
                              className="block truncate max-w-full"
                              title={q.question_text}
                            >
                              {q.order_index ? `${q.order_index}. ` : ""}
                              {q.question_text}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Trigger Value Dropdown */}
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
                          Choose a single_choice or multiple_choice question.
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
        )}
      </DialogContent>
    </Dialog>
  );
}
