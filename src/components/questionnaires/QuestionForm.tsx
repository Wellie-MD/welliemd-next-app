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
import { ProductSelector } from "./ProductSelector";
import { GroupedQuestionBuilder } from "./GroupedQuestionBuilder";
import { SubQuestion } from "@/api/questionnaires";

interface QuestionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  question?: Question | null;
  onSuccess: () => void;
}

interface ParentQuestionConfig {
  question_id: string;
  trigger_values: string[];
}

interface ExtendedQuestionPayload extends CreateQuestionPayload {
  max_file_size?: number;
  allowed_extensions?: string[];
  is_follow_up?: boolean;
  parent_question_id?: string; // Deprecated - kept for backward compatibility
  trigger_value?: string; // Deprecated - kept for backward compatibility
  parent_questions?: ParentQuestionConfig[]; // New: supports multiple parents
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

  // New state for multiple parent questions
  const [parentQuestions, setParentQuestions] = useState<
    ParentQuestionConfig[]
  >([]);
  const [selectedParentForAdding, setSelectedParentForAdding] =
    useState<string>("");
  const [logicOperator, setLogicOperator] = useState<"AND" | "OR">("OR");

  // State for checkout question type
  const [checkoutConfig, setCheckoutConfig] = useState<{
    product_id: string;
    product_name: string;
    has_hierarchy: boolean;
    regimen?: string;
    regimen_name?: string;
    duration?: string;
    duration_name?: string;
    pharmacy_id?: string;
    pharmacy_name?: string;
    beluga_medicine_id: string;
    price?: number;
  } | null>(null);

  // State for grouped questions
  const [subQuestions, setSubQuestions] = useState<Omit<SubQuestion, "id">[]>(
    []
  );

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

      // Initialize variables for backward compatibility
      let parentQuestionId = "";
      let triggerValue = "";

      // Check if this is the new multi-parent format or legacy single-parent format
      const showIf = question.conditional_logic?.show_if;

      if (showIf && Array.isArray(showIf)) {
        // New format: Array of parent question configs
        const parentConfigs: ParentQuestionConfig[] = showIf.map(
          (config: unknown) => ({
            question_id: config.question_id,
            trigger_values: Array.isArray(config.value)
              ? config.value
              : [config.value],
          })
        );
        setParentQuestions(parentConfigs);

        // Extract logic_operator (AND/OR)
        const operator = question.conditional_logic?.logic_operator;
        if (operator === "AND" || operator === "OR") {
          setLogicOperator(operator);
        }

        // For backward compatibility with single parent UI
        if (parentConfigs.length > 0) {
          const firstParent = parentConfigs[0];
          parentQuestionId = firstParent.question_id;
          triggerValue = firstParent.trigger_values[0] || "";
          setTriggerValues(firstParent.trigger_values);
        }
      } else if (showIf && typeof showIf === "object" && showIf.question_id) {
        // Legacy format: Single parent question
        parentQuestionId = showIf.question_id || "";
        triggerValue = showIf.value || "";

        // Handle multiple trigger values for single parent
        const triggerValuesList = Array.isArray(showIf.value)
          ? showIf.value
          : triggerValue
          ? [triggerValue]
          : [];
        setTriggerValues(triggerValuesList);

        // Convert to new format
        if (parentQuestionId && triggerValuesList.length > 0) {
          setParentQuestions([
            {
              question_id: parentQuestionId,
              trigger_values: triggerValuesList,
            },
          ]);
        }
      } else {
        // No follow-up logic
        setParentQuestions([]);
        setTriggerValues([]);
      }

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

      // Extract checkout_config for checkout questions
      if (
        question.question_type === "checkout" &&
        validationRules?.checkout_config
      ) {
        setCheckoutConfig(validationRules.checkout_config);
      }

      // Extract sub-questions for grouped questions
      if (
        question.sub_questions &&
        question.sub_questions.length > 0 &&
        (question.question_type === "personal_details" ||
          question.question_type === "shipping_address")
      ) {
        setSubQuestions(
          question.sub_questions.map((sq) => ({
            question_text: sq.question_text,
            question_type: sq.question_type,
            is_required: sq.is_required,
            order_index: sq.order_index,
            validation_rules: sq.validation_rules,
            answer_choices: sq.answer_choices,
          }))
        );
      }

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
      setParentQuestions([]);
      setSelectedParentForAdding("");
      setLogicOperator("OR");
      setCheckoutConfig(null);
      setSubQuestions([]);
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
      if (parentQuestions.length === 0) {
        toast({
          title: "Validation Error",
          description:
            "At least one parent question is required for follow-up questions",
          variant: "destructive",
        });
        return;
      }

      // Validate each parent has trigger values
      for (const parent of parentQuestions) {
        if (parent.trigger_values.length === 0) {
          const parentQ = existingQuestions.find(
            (q) => q.id === parent.question_id
          );
          toast({
            title: "Validation Error",
            description: `Parent question "${
              parentQ?.question_text || "Unknown"
            }" must have at least one trigger value`,
            variant: "destructive",
          });
          return;
        }
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
      let conditionalLogic = {};

      if (formData.is_follow_up && parentQuestions.length > 0) {
        if (parentQuestions.length === 1) {
          // Single parent: use legacy format for backward compatibility
          const parent = parentQuestions[0];
          conditionalLogic = {
            show_if: {
              question_id: parent.question_id,
              value:
                parent.trigger_values.length === 1
                  ? parent.trigger_values[0]
                  : parent.trigger_values,
              operator: parent.trigger_values.length === 1 ? "equals" : "in",
            },
          };
        } else {
          // Multiple parents: use new array format with logic operator
          conditionalLogic = {
            show_if: parentQuestions.map((parent) => ({
              question_id: parent.question_id,
              value:
                parent.trigger_values.length === 1
                  ? parent.trigger_values[0]
                  : parent.trigger_values,
              operator: parent.trigger_values.length === 1 ? "equals" : "in",
            })),
            logic_operator: logicOperator, // AND or OR
          };
        }
      }

      // Validate checkout question type
      if (formData.question_type === "checkout" && !checkoutConfig) {
        toast({
          title: "Validation Error",
          description: "Product selection is required for checkout questions",
          variant: "destructive",
        });
        return;
      }

      // Build validation_rules
      let validationRules: unknown = {};

      if (formData.question_type === "file_upload") {
        validationRules = {
          max_file_size: formData.max_file_size,
          allowed_extensions: formData.allowed_extensions,
        };
      } else if (formData.question_type === "checkout") {
        validationRules = {
          checkout_config: checkoutConfig,
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
        ["single_choice", "multiple_choice", "consent", "sex"].includes(
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

      // Validate grouped questions
      if (
        (formData.question_type === "personal_details" ||
          formData.question_type === "shipping_address") &&
        subQuestions.length === 0
      ) {
        toast({
          title: "Validation Error",
          description:
            "At least one sub-question is required for grouped questions",
          variant: "destructive",
        });
        return;
      }

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
        sub_questions:
          formData.question_type === "personal_details" ||
          formData.question_type === "shipping_address"
            ? subQuestions
            : undefined,
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

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: unknown } };
        const responseData = axiosError.response?.data;

        if (responseData && typeof responseData === "object") {
          // Handle field-specific errors (e.g., {"answer_choices": ["error message"]})
          const errorFields = Object.entries(responseData);
          if (errorFields.length > 0) {
            const errorMessages: string[] = [];

            for (const [field, messages] of errorFields) {
              if (Array.isArray(messages)) {
                errorMessages.push(...messages);
              } else if (typeof messages === "string") {
                errorMessages.push(messages);
              }
            }

            if (errorMessages.length > 0) {
              errorMessage = errorMessages.join(". ");
            }
          }

          // Handle generic error message
          if (
            "error" in responseData &&
            typeof responseData.error === "string"
          ) {
            errorMessage = responseData.error;
          }
          if (
            "message" in responseData &&
            typeof responseData.message === "string"
          ) {
            errorMessage = responseData.message;
          }
          if (
            "detail" in responseData &&
            typeof responseData.detail === "string"
          ) {
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
                <SelectItem value="email">Email Address</SelectItem>
                <SelectItem value="phone">Phone Number</SelectItem>
                <SelectItem value="state">State</SelectItem>
                <SelectItem value="zip">ZIP Code</SelectItem>
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
                <SelectItem value="checkout">
                  Checkout (Product Display)
                </SelectItem>
                <SelectItem value="personal_details">
                  Personal Details (Grouped)
                </SelectItem>
                <SelectItem value="shipping_address">
                  Shipping Address (Grouped)
                </SelectItem>
                <SelectItem value="sex">Sex (Beluga Mapped)</SelectItem>
                <SelectItem value="self_reported_meds">
                  Self Reported Medications (Beluga Mapped)
                </SelectItem>
                <SelectItem value="allergies">
                  Allergies (Beluga Mapped)
                </SelectItem>
                <SelectItem value="medical_conditions">
                  Medical Conditions (Beluga Mapped)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grouped Question Builder */}
          {(formData.question_type === "personal_details" ||
            formData.question_type === "shipping_address") && (
            <GroupedQuestionBuilder
              groupType={formData.question_type}
              subQuestions={subQuestions}
              onChange={setSubQuestions}
            />
          )}

          {/* Checkout Product Selection */}
          {formData.question_type === "checkout" && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-sm">Checkout Configuration</h3>
              <div className="space-y-2">
                <Label>
                  Select Product <span className="text-red-500">*</span>
                </Label>
                <ProductSelector
                  value={checkoutConfig}
                  onChange={setCheckoutConfig}
                />
                <p className="text-xs text-muted-foreground">
                  This product will be displayed to the patient for checkout.
                  The product's Beluga Med ID and pharmacy will be automatically
                  included.
                </p>
              </div>
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
              <div className="space-y-4 mt-3 pl-4 border-l-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>
                      Parent Questions <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {parentQuestions.length} parent(s) configured
                    </span>
                  </div>

                  {/* AND/OR Logic Selector */}
                  {parentQuestions.length > 1 && (
                    <div className="space-y-2 p-3 border rounded-lg bg-blue-50">
                      <Label htmlFor="logic_operator">Logic Operator</Label>
                      <Select
                        value={logicOperator}
                        onValueChange={(value: "AND" | "OR") =>
                          setLogicOperator(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OR">
                            OR - Show if ANY parent matches
                          </SelectItem>
                          <SelectItem value="AND">
                            AND - Show if ALL parents match
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {logicOperator === "OR"
                          ? "This question will show when ANY of the parent questions has the specified trigger values"
                          : "This question will show only when ALL parent questions have the specified trigger values"}
                      </p>
                    </div>
                  )}

                  {/* List of configured parent questions */}
                  {parentQuestions.length > 0 && (
                    <div className="space-y-3">
                      {parentQuestions.map((parent, parentIdx) => {
                        const parentQ = existingQuestions.find(
                          (q) => q.id === parent.question_id
                        );
                        return (
                          <div
                            key={parentIdx}
                            className="p-3 border rounded-lg bg-muted/30 space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {parentQ?.order_index
                                    ? `${parentQ.order_index}. `
                                    : ""}
                                  {parentQ?.question_text || "Unknown Question"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Trigger when answer is:
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setParentQuestions(
                                    parentQuestions.filter(
                                      (_, idx) => idx !== parentIdx
                                    )
                                  );
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Trigger values for this parent */}
                            <div className="space-y-2">
                              {parent.trigger_values.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {parent.trigger_values.map(
                                    (value, valueIdx) => (
                                      <div
                                        key={valueIdx}
                                        className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs"
                                      >
                                        <span>{value}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updatedParents = [
                                              ...parentQuestions,
                                            ];
                                            updatedParents[
                                              parentIdx
                                            ].trigger_values = updatedParents[
                                              parentIdx
                                            ].trigger_values.filter(
                                              (_, idx) => idx !== valueIdx
                                            );
                                            setParentQuestions(updatedParents);
                                          }}
                                          className="ml-1 hover:text-red-200 font-bold leading-none"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}

                              {/* Add trigger value dropdown */}
                              {parentQ?.answer_choices &&
                                parentQ.answer_choices.length > 0 && (
                                  <Select
                                    value=""
                                    onValueChange={(value) => {
                                      if (
                                        value &&
                                        !parent.trigger_values.includes(value)
                                      ) {
                                        const updatedParents = [
                                          ...parentQuestions,
                                        ];
                                        updatedParents[
                                          parentIdx
                                        ].trigger_values.push(value);
                                        setParentQuestions(updatedParents);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Add trigger value" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {parentQ.answer_choices.map(
                                        (option, idx) => (
                                          <SelectItem
                                            key={idx}
                                            value={option}
                                            disabled={parent.trigger_values.includes(
                                              option
                                            )}
                                          >
                                            {option}{" "}
                                            {parent.trigger_values.includes(
                                              option
                                            )
                                              ? "✓"
                                              : ""}
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add new parent question */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs">Add Parent Question</Label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedParentForAdding}
                        onValueChange={setSelectedParentForAdding}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a parent question" />
                        </SelectTrigger>
                        <SelectContent>
                          {parentQuestionOptions
                            .filter(
                              (q) =>
                                !parentQuestions.some(
                                  (p) => p.question_id === q.id
                                )
                            )
                            .map((q) => (
                              <SelectItem key={q.id} value={q.id}>
                                {q.order_index ? `${q.order_index}. ` : ""}
                                {q.question_text}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={() => {
                          if (selectedParentForAdding) {
                            setParentQuestions([
                              ...parentQuestions,
                              {
                                question_id: selectedParentForAdding,
                                trigger_values: [],
                              },
                            ]);
                            setSelectedParentForAdding("");
                          }
                        }}
                        disabled={!selectedParentForAdding}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>

                  {parentQuestions.length > 0 && (
                    <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      ℹ️ This question will show when ANY of the{" "}
                      {parentQuestions.length} parent question(s) has the
                      specified trigger value(s)
                    </p>
                  )}
                </div>
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
