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
  consent_text?: string;
  consent_type?: string;
  requires_agreement?: boolean;
  is_disqualifying?: boolean;
  beluga_consent_code?: string;
}

export function AddQuestionnairesForm({
  open,
  onOpenChange,
  templateId,
  question,
  onSuccess,
}: AddQuestionnairesFormProps) {
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
  const [disqualifyingAnswers, setDisqualifyingAnswers] = useState<string[]>(
    []
  );
  const [enableNumberValidation, setEnableNumberValidation] = useState(false);
  const [numberValidationOperator, setNumberValidationOperator] = useState<
    "gt" | "lt" | "gte" | "lte" | "eq"
  >("gt");
  const [numberValidationValue, setNumberValidationValue] = useState<
    number | ""
  >("");
  const [triggerValues, setTriggerValues] = useState<string[]>([]);

  // State for BMI eligibility config
  const [bmiMax, setBmiMax] = useState<number | "">(27);

  // State for Date of Birth age eligibility config
  const [dobMinAge, setDobMinAge] = useState<number | "">(18);
  const [dobMaxAge, setDobMaxAge] = useState<number | "">(65);

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

      // Handle multiple trigger values
      const triggerValuesList = Array.isArray(
        question.conditional_logic?.show_if?.value
      )
        ? question.conditional_logic.show_if.value
        : triggerValue
        ? [triggerValue]
        : [];
      setTriggerValues(triggerValuesList);

      // Extract disqualifying answers from validation_rules
      const validationRules = question.validation_rules as unknown;
      let disqualifyingAnswersList: string[] = [];
      if (validationRules?.disqualifying_answer) {
        disqualifyingAnswersList = [validationRules.disqualifying_answer];
      } else if (
        validationRules?.disqualifying_answers &&
        Array.isArray(validationRules.disqualifying_answers)
      ) {
        disqualifyingAnswersList = validationRules.disqualifying_answers;
      }
      setDisqualifyingAnswers(disqualifyingAnswersList);

      // Extract number validation rules
      if (question.question_type === "number" && validationRules) {
        const hasValidation =
          validationRules.min !== undefined ||
          validationRules.max !== undefined ||
          validationRules.greater_than !== undefined ||
          validationRules.less_than !== undefined ||
          validationRules.equals !== undefined;

        setEnableNumberValidation(hasValidation);

        if (validationRules.greater_than !== undefined) {
          setNumberValidationOperator("gt");
          setNumberValidationValue(validationRules.greater_than);
        } else if (validationRules.greater_than_or_equal !== undefined) {
          setNumberValidationOperator("gte");
          setNumberValidationValue(validationRules.greater_than_or_equal);
        } else if (validationRules.less_than !== undefined) {
          setNumberValidationOperator("lt");
          setNumberValidationValue(validationRules.less_than);
        } else if (validationRules.less_than_or_equal !== undefined) {
          setNumberValidationOperator("lte");
          setNumberValidationValue(validationRules.less_than_or_equal);
        } else if (validationRules.equals !== undefined) {
          setNumberValidationOperator("eq");
          setNumberValidationValue(validationRules.equals);
        }
      }

      // Extract BMI eligibility config
      const qType = question.question_type as string;
      const valRules = validationRules as Record<string, unknown>;
      if (qType === "bmi" && valRules?.bmi_max !== undefined) {
        setBmiMax(valRules.bmi_max as number);
      }

      // Extract DOB age eligibility config
      if (
        question.question_type === "date" &&
        question.beluga_field_mapping === "date_of_birth"
      ) {
        if (valRules?.min_age !== undefined) {
          setDobMinAge(valRules.min_age as number);
        }
        if (valRules?.max_age !== undefined) {
          setDobMaxAge(valRules.max_age as number);
        }
      }

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
        requires_agreement:
          question.consent_form?.requires_agreement !== undefined
            ? question.consent_form.requires_agreement
            : true,
        is_disqualifying: question.consent_form?.is_disqualifying || false,
        beluga_consent_code: question.consent_form?.beluga_consent_code || "",
      });
    } else {
      setDisqualifyingAnswers([]);
      setTriggerValues([]);
      setEnableNumberValidation(false);
      setNumberValidationOperator("gt");
      setNumberValidationValue("");
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
    const choiceToRemove = formData.answer_choices?.[index];
    const updatedChoices =
      formData.answer_choices?.filter((_, i) => i !== index) || [];

    // Also remove from disqualifying answers if it was marked
    if (choiceToRemove && disqualifyingAnswers.includes(choiceToRemove)) {
      setDisqualifyingAnswers(
        disqualifyingAnswers.filter((a) => a !== choiceToRemove)
      );
    }

    setFormData({
      ...formData,
      answer_choices: updatedChoices,
    });
  };

  const handleUpdateChoice = (index: number, value: string) => {
    const oldValue = formData.answer_choices?.[index];
    const updatedChoices = [...(formData.answer_choices || [])];
    updatedChoices[index] = value;

    // Update disqualifying answers if the old value was marked
    if (oldValue && disqualifyingAnswers.includes(oldValue)) {
      const updatedDisqualifying = disqualifyingAnswers.map((a) =>
        a === oldValue ? value : a
      );
      setDisqualifyingAnswers(updatedDisqualifying);
    }

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
    const choiceTypes = ["single_choice", "multiple_choice", "sex"];
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
    if (
      formData.question_type === "consent" &&
      !formData.consent_text?.trim()
    ) {
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
      if (triggerValues.length === 0) {
        toast({
          title: "Validation Error",
          description:
            "At least one trigger value is required for follow-up questions",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate number validation settings
    if (formData.question_type === "number" && enableNumberValidation) {
      if (numberValidationValue === "" || numberValidationValue === null) {
        toast({
          title: "Validation Error",
          description:
            "Validation value is required when number validation is enabled",
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
              value:
                triggerValues.length === 1 ? triggerValues[0] : triggerValues,
              operator: triggerValues.length === 1 ? "equals" : "in",
            },
          }
        : {};

      // Build validation_rules
      let validationRules: unknown = {};

      if (formData.question_type === "file_upload") {
        validationRules = {
          max_file_size: formData.max_file_size,
          allowed_extensions: formData.allowed_extensions,
        };
      } else if (formData.question_type === "bmi" || formData.question_type === "height_weight") {
        // Add BMI eligibility config (supports both "bmi" and "height_weight" types)
        validationRules = {
          bmi_max: bmiMax !== "" ? bmiMax : undefined,
        };
      } else if (
        formData.question_type === "date" &&
        formData.beluga_field_mapping === "date_of_birth"
      ) {
        // Add DOB age eligibility config
        validationRules = {
          min_age: dobMinAge !== "" ? dobMinAge : undefined,
          max_age: dobMaxAge !== "" ? dobMaxAge : undefined,
        };
      } else if (
        formData.question_type === "number" &&
        enableNumberValidation &&
        numberValidationValue !== ""
      ) {
        // Add number validation rules
        const operatorMap = {
          gt: "greater_than",
          gte: "greater_than_or_equal",
          lt: "less_than",
          lte: "less_than_or_equal",
          eq: "equals",
        };
        validationRules[operatorMap[numberValidationOperator]] =
          numberValidationValue;
      } else {
        validationRules = formData.validation_rules || {};
      }

      // Handle disqualifying answers for choice-based questions
      if (
        ["single_choice", "multiple_choice", "consent"].includes(
          formData.question_type
        )
      ) {
        // Remove old disqualifying fields first
        delete validationRules.disqualifying_answer;
        delete validationRules.disqualifying_answers;

        // Add new disqualifying answers only if there are any
        if (disqualifyingAnswers.length > 0) {
          if (disqualifyingAnswers.length === 1) {
            validationRules.disqualifying_answer = disqualifyingAnswers[0];
          } else {
            validationRules.disqualifying_answers = disqualifyingAnswers;
          }
        }
      }

      // Build consent_form for consent questions
      const consentForm =
        formData.question_type === "consent" && formData.consent_text
          ? {
              consent_type: formData.consent_type || "custom",
              consent_text: formData.consent_text,
              requires_agreement:
                formData.requires_agreement !== undefined
                  ? formData.requires_agreement
                  : true,
              is_disqualifying: disqualifyingAnswers.length > 0,
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
      // Extract error message from backend response
      let errorMessage = `Failed to ${question ? "update" : "create"} question`;
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        const responseData = axiosError.response?.data;
        
        if (responseData && typeof responseData === 'object') {
          // Handle field-specific errors (e.g., {"answer_choices": ["error message"]})
          const errorFields = Object.entries(responseData);
          if (errorFields.length > 0) {
            const errorMessages: string[] = [];
            
            for (const [field, messages] of errorFields) {
              if (Array.isArray(messages)) {
                errorMessages.push(...messages);
              } else if (typeof messages === 'string') {
                errorMessages.push(messages);
              }
            }
            
            if (errorMessages.length > 0) {
              errorMessage = errorMessages.join('. ');
            }
          }
          
          // Handle generic error message
          if ('error' in responseData && typeof responseData.error === 'string') {
            errorMessage = responseData.error;
          }
          if ('message' in responseData && typeof responseData.message === 'string') {
            errorMessage = responseData.message;
          }
          if ('detail' in responseData && typeof responseData.detail === 'string') {
            errorMessage = responseData.detail;
          }
        }
      }
      
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
  const showAnswerChoices = ["single_choice", "multiple_choice", "sex"].includes(
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
              onValueChange={(value) => {
                // Initialize default answer choices for consent questions
                if (
                  value === "consent" &&
                  (!formData.answer_choices ||
                    formData.answer_choices.length === 0)
                ) {
                  setFormData({
                    ...formData,
                    question_type: value,
                    answer_choices: [
                      "I acknowledge that I have read and understood the above information",
                      "I have read the above information and I do not wish to continue",
                    ],
                  });
                } else if (
                  value === "sex" &&
                  (!formData.answer_choices ||
                    formData.answer_choices.length === 0)
                ) {
                  // Initialize default answer choices for sex questions
                  setFormData({
                    ...formData,
                    question_type: value,
                    answer_choices: ["Male", "Female", "Other"],
                  });
                } else {
                  // Reset validation states when changing question type
                  if (value !== "number") {
                    setEnableNumberValidation(false);
                    setNumberValidationValue("");
                  }
                  if (!["single_choice", "multiple_choice", "sex"].includes(value)) {
                    setDisqualifyingAnswers([]);
                  }
                  
                  setFormData({ ...formData, question_type: value });
                }
              }}
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
                <SelectItem value="sex">Sex (Beluga Mapped)</SelectItem>
                <SelectItem value="self_reported_meds">Self Reported Medications (Beluga Mapped)</SelectItem>
                <SelectItem value="allergies">Allergies (Beluga Mapped)</SelectItem>
                <SelectItem value="medical_conditions">Medical Conditions (Beluga Mapped)</SelectItem>
                <SelectItem value="medication_dose_selector">Medication & Dose Selector</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* BMI Eligibility Settings */}
          {(formData.question_type === "height_weight" || (formData.question_type as string) === "bmi") && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-sm">BMI Eligibility Settings</h3>
              <p className="text-xs text-muted-foreground">
                Set the maximum BMI threshold. Patients with BMI exceeding this limit will be disqualified.
              </p>
              <div className="space-y-2">
                <Label htmlFor="bmi_max">
                  Maximum BMI Limit <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bmi_max"
                  type="number"
                  step="0.1"
                  min="15"
                  max="100"
                  value={bmiMax}
                  onChange={(e) =>
                    setBmiMax(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="e.g., 27"
                />
                <p className="text-xs text-muted-foreground">
                  Common settings: 27 for treatment-naive, 25 for treatment-experienced
                </p>
              </div>
            </div>
          )}

          {/* Date of Birth Age Eligibility Settings */}
          {formData.question_type === "date" &&
            formData.beluga_field_mapping === "date_of_birth" && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-sm">Age Eligibility Settings</h3>
              <p className="text-xs text-muted-foreground">
                Set age constraints for eligibility. Patients outside these limits will be disqualified.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_age">Minimum Age</Label>
                  <Input
                    id="min_age"
                    type="number"
                    min="0"
                    max="120"
                    value={dobMinAge}
                    onChange={(e) =>
                      setDobMinAge(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="e.g., 18"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_age">Maximum Age</Label>
                  <Input
                    id="max_age"
                    type="number"
                    min="0"
                    max="120"
                    value={dobMaxAge}
                    onChange={(e) =>
                      setDobMaxAge(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="e.g., 65"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty if no constraint. Common: min 18, max 65
              </p>
            </div>
          )}

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
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`disqualify-${index}`}
                          checked={disqualifyingAnswers.includes(choice)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDisqualifyingAnswers([
                                ...disqualifyingAnswers,
                                choice,
                              ]);
                            } else {
                              setDisqualifyingAnswers(
                                disqualifyingAnswers.filter((a) => a !== choice)
                              );
                            }
                          }}
                          className="rounded"
                          title="Mark as disqualifying"
                        />
                        <label
                          htmlFor={`disqualify-${index}`}
                          className="text-xs text-red-600 cursor-pointer whitespace-nowrap"
                        >
                          Disqualify
                        </label>
                      </div>
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

                {disqualifyingAnswers.length > 0 && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    ⚠️ {disqualifyingAnswers.length} answer(s) marked as
                    disqualifying. Selecting these will disqualify the patient.
                  </p>
                )}
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
                    <SelectItem value="telehealth">
                      Telehealth Consent
                    </SelectItem>
                    <SelectItem value="treatment">Treatment Consent</SelectItem>
                    <SelectItem value="privacy">Privacy Policy</SelectItem>
                    <SelectItem value="terms">Terms of Service</SelectItem>
                    <SelectItem value="marketing">
                      Marketing Communications
                    </SelectItem>
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
              </div>

              <div className="space-y-2">
                <Label>
                  Answer Choices <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Customize the consent response options (e.g., Agree, Disagree,
                  I'm not sure)
                </p>

                {/* Existing consent choices */}
                <div className="space-y-2">
                  {formData.answer_choices && formData.answer_choices.length > 0
                    ? formData.answer_choices.map((choice, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={choice}
                            onChange={(e) =>
                              handleUpdateChoice(index, e.target.value)
                            }
                            placeholder={`Option ${index + 1}`}
                            className="flex-1"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`consent-disqualify-${index}`}
                              checked={disqualifyingAnswers.includes(choice)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setDisqualifyingAnswers([
                                    ...disqualifyingAnswers,
                                    choice,
                                  ]);
                                } else {
                                  setDisqualifyingAnswers(
                                    disqualifyingAnswers.filter(
                                      (a) => a !== choice
                                    )
                                  );
                                }
                              }}
                              className="rounded"
                              title="Mark as disqualifying"
                            />
                            <label
                              htmlFor={`consent-disqualify-${index}`}
                              className="text-xs text-red-600 cursor-pointer whitespace-nowrap"
                            >
                              Disqualify
                            </label>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveChoice(index)}
                            disabled={
                              formData.answer_choices &&
                              formData.answer_choices.length <= 1
                            }
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ))
                    : null}
                </div>

                {disqualifyingAnswers.length > 0 && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    ⚠️ {disqualifyingAnswers.length} answer(s) marked as
                    disqualifying. Selecting these will disqualify the patient.
                  </p>
                )}

                {/* Add new choice for consent */}
                <div className="flex gap-2">
                  <Input
                    value={newAnswerChoice}
                    onChange={(e) => setNewAnswerChoice(e.target.value)}
                    placeholder="Add another option"
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

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requires_agreement">
                      Requires Agreement
                    </Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="beluga_consent_code">
                  Beluga Consent Code (Optional)
                </Label>
                <Input
                  id="beluga_consent_code"
                  value={formData.beluga_consent_code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      beluga_consent_code: e.target.value,
                    })
                  }
                  placeholder="e.g., HIPAA_AUTH"
                />
              </div>
            </div>
          )}

          {/* Number Validation Settings */}
          {formData.question_type === "number" && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable_number_validation">
                    Enable Validation
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add validation rules for numeric input (e.g., BMI must be
                    greater than 27)
                  </p>
                </div>
                <Switch
                  id="enable_number_validation"
                  checked={enableNumberValidation}
                  onCheckedChange={(checked) => {
                    setEnableNumberValidation(checked);
                    if (!checked) {
                      setNumberValidationValue("");
                    }
                  }}
                />
              </div>

              {enableNumberValidation && (
                <div className="space-y-3 mt-3 pl-4 border-l-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="validation_operator">Operator</Label>
                      <Select
                        value={numberValidationOperator}
                        onValueChange={(value: unknown) =>
                          setNumberValidationOperator(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gt">
                            Greater than (&gt;)
                          </SelectItem>
                          <SelectItem value="gte">
                            Greater than or equal (≥)
                          </SelectItem>
                          <SelectItem value="lt">Less than (&lt;)</SelectItem>
                          <SelectItem value="lte">
                            Less than or equal (≤)
                          </SelectItem>
                          <SelectItem value="eq">Equal to (=)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="validation_value">
                        Value <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="validation_value"
                        type="number"
                        step="any"
                        value={numberValidationValue}
                        onChange={(e) =>
                          setNumberValidationValue(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        placeholder="e.g., 27"
                      />
                    </div>
                  </div>
                  {numberValidationValue !== "" && (
                    <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      ℹ️ Value must be{" "}
                      {numberValidationOperator === "gt"
                        ? "greater than"
                        : numberValidationOperator === "gte"
                        ? "greater than or equal to"
                        : numberValidationOperator === "lt"
                        ? "less than"
                        : numberValidationOperator === "lte"
                        ? "less than or equal to"
                        : "equal to"}{" "}
                      {numberValidationValue}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

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
                      setTriggerValues([]);
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

                {/* Trigger Values (Multiple Selection) */}
                {selectedParent && (
                  <div className="space-y-2">
                    <Label htmlFor="trigger_values">
                      Trigger Values <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select one or more parent options that will trigger this
                      follow-up question
                    </p>
                    {triggerOptions.length > 0 ? (
                      <div className="space-y-2">
                        {/* Selected trigger values */}
                        {triggerValues.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded">
                            {triggerValues.map((value, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium"
                              >
                                <span>{value}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setTriggerValues(
                                      triggerValues.filter((v) => v !== value)
                                    )
                                  }
                                  className="ml-1 hover:text-red-200 font-bold text-lg leading-none"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Dropdown to add trigger values */}
                        <Select
                          value=""
                          onValueChange={(value) => {
                            if (value && !triggerValues.includes(value)) {
                              setTriggerValues([...triggerValues, value]);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select trigger value(s)" />
                          </SelectTrigger>
                          <SelectContent>
                            {triggerOptions.map((option, idx) => (
                              <SelectItem
                                key={idx}
                                value={option}
                                disabled={triggerValues.includes(option)}
                              >
                                {option}{" "}
                                {triggerValues.includes(option) ? "✓" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {triggerValues.length > 0 && (
                          <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            ℹ️ This question will show when the parent question
                            has{" "}
                            {triggerValues.length === 1
                              ? "this value"
                              : "any of these values"}
                            : {triggerValues.join(", ")}
                          </p>
                        )}
                      </div>
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
