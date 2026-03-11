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
import { normalizeChoiceDisplay } from "@/utils/choiceValue";
import {
  VisibilityGroup,
  createDefaultVisibilityGroup,
  VisibilityRuleBuilder,
} from "./VisibilityRuleBuilder";

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

interface ParentQuestionConfig {
  question_id: string;
  trigger_values: string[];
}

interface LegacyConditionNode {
  question_id?: string;
  operator?: string;
  value?: unknown;
  field?: string;
}

function isVisibilityGroup(value: unknown): value is VisibilityGroup {
  return (
    !!value &&
    typeof value === "object" &&
    (value as VisibilityGroup).type === "group" &&
    Array.isArray((value as VisibilityGroup).children)
  );
}

function normalizeShowIfToTree(
  showIf: unknown,
  logicOperator: "AND" | "OR" = "OR"
): VisibilityGroup | null {
  if (!showIf) return null;

  if (isVisibilityGroup(showIf)) {
    return showIf;
  }

  if (Array.isArray(showIf)) {
    return {
      type: "group",
      operator: logicOperator,
      children: showIf
        .filter(
          (item): item is LegacyConditionNode =>
            !!item && typeof item === "object"
        )
        .map((item) => ({
          type: "condition" as const,
          question_id: item.question_id || "",
          operator: (item.operator as
            | "equals"
            | "not_equals"
            | "in"
            | "not_in"
            | "contains"
            | "not_contains") || "equals",
          value: Array.isArray(item.value)
            ? item.value.map(String)
            : String(item.value ?? ""),
          field: item.field,
        })),
    };
  }

  if (
    typeof showIf === "object" &&
    showIf &&
    (showIf as LegacyConditionNode).question_id
  ) {
    const item = showIf as LegacyConditionNode;
    return {
      type: "group",
      operator: "AND",
      children: [
        {
          type: "condition",
          question_id: item.question_id || "",
          operator: (item.operator as
            | "equals"
            | "not_equals"
            | "in"
            | "not_in"
            | "contains"
            | "not_contains") || "equals",
          value: Array.isArray(item.value)
            ? item.value.map(String)
            : String(item.value ?? ""),
          field: item.field,
        },
      ],
    };
  }

  return null;
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
  const [parentQuestions, setParentQuestions] = useState<
    ParentQuestionConfig[]
  >([]);
  const [selectedParentForAdding, setSelectedParentForAdding] =
    useState<string>("");
  const [logicOperator, setLogicOperator] = useState<"AND" | "OR">("OR");
  const [followUpMode, setFollowUpMode] = useState<"simple" | "advanced">(
    "simple"
  );
  const [visibilityRules, setVisibilityRules] = useState<VisibilityGroup>(
    createDefaultVisibilityGroup()
  );

  // Prefill config
  const [prefillEnabled, setPrefillEnabled] = useState(false);
  const [prefillSource, setPrefillSource] = useState<
    "onboarding" | "latest_completed" | "clinical" | "derived"
  >("onboarding");
  const [prefillSourceQuestionId, setPrefillSourceQuestionId] = useState("");
  const [prefillDerivedField, setPrefillDerivedField] = useState<
    "therapy_route" | "regimen_protocol"
  >("therapy_route");

  // State for BMI eligibility config
  const [bmiMax, setBmiMax] = useState<number | "">(27);

  // State for Date of Birth age eligibility config
  const [dobMinAge, setDobMinAge] = useState<number | "">(18);
  const [dobMaxAge, setDobMaxAge] = useState<number | "">(65);
  const [isHidden, setIsHidden] = useState(false);

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
      let parentQuestionId = "";
      let triggerValue = "";
      const showIf = question.conditional_logic?.show_if;
      const normalizedTree = normalizeShowIfToTree(
        showIf,
        question.conditional_logic?.logic_operator === "AND" ? "AND" : "OR"
      );
      setVisibilityRules(normalizedTree || createDefaultVisibilityGroup());
      setFollowUpMode(
        normalizedTree && isVisibilityGroup(showIf) ? "advanced" : "simple"
      );

      if (showIf && Array.isArray(showIf)) {
        const parentConfigs: ParentQuestionConfig[] = showIf
          .filter(
            (config): config is { question_id?: string; value?: unknown } =>
              !!config && typeof config === "object"
          )
          .map((config) => ({
            question_id: config.question_id || "",
            trigger_values: Array.isArray(config.value)
              ? config.value.map(String)
              : config.value !== undefined && config.value !== null
              ? [String(config.value)]
              : [],
          }))
          .filter((config) => config.question_id);
        setParentQuestions(parentConfigs);

        const operator = question.conditional_logic?.logic_operator;
        if (operator === "AND" || operator === "OR") {
          setLogicOperator(operator);
        }

        if (parentConfigs.length > 0) {
          const firstParent = parentConfigs[0];
          parentQuestionId = firstParent.question_id;
          triggerValue = firstParent.trigger_values[0] || "";
        }
      } else if (
        showIf &&
        typeof showIf === "object" &&
        (showIf as { question_id?: string }).question_id
      ) {
        parentQuestionId =
          (showIf as { question_id?: string }).question_id || "";
        triggerValue = (showIf as { value?: string }).value || "";

        const triggerValuesList = Array.isArray((showIf as { value?: unknown }).value)
          ? ((showIf as { value: string[] }).value)
          : triggerValue
          ? [triggerValue]
          : [];

        if (parentQuestionId && triggerValuesList.length > 0) {
          setParentQuestions([
            {
              question_id: parentQuestionId,
              trigger_values: triggerValuesList,
            },
          ]);
        } else {
          setParentQuestions([]);
        }
      } else {
        setParentQuestions([]);
      }

      // Extract disqualifying answers from validation_rules
      const validationRules = question.validation_rules as unknown;
      const hiddenFlag = (validationRules as Record<string, unknown>)?.hidden === true;
      setIsHidden(hiddenFlag);
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

      // Extract prefill config
      const prefillConfig = (validationRules as Record<string, unknown>)?.prefill as
        | { enabled?: boolean; source?: string; source_question_id?: string }
        | undefined;
      setPrefillEnabled(!!prefillConfig?.enabled);
      setPrefillSource(
        (prefillConfig?.source as "onboarding" | "latest_completed" | "clinical" | "derived") ||
          "onboarding"
      );
      setPrefillSourceQuestionId(prefillConfig?.source_question_id || "");
      if (prefillConfig?.field) {
        setPrefillDerivedField(
          prefillConfig.field as "therapy_route" | "regimen_protocol"
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
      setParentQuestions([]);
      setSelectedParentForAdding("");
      setLogicOperator("OR");
      setFollowUpMode("simple");
      setVisibilityRules(createDefaultVisibilityGroup());
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
      if (followUpMode === "advanced") {
        if (!visibilityRules.children.length) {
          toast({
            title: "Validation Error",
            description:
              "Add at least one visibility condition before saving this follow-up question.",
            variant: "destructive",
          });
          return;
        }
      } else if (parentQuestions.length === 0) {
        toast({
          title: "Validation Error",
          description:
            "At least one parent question is required for follow-up questions",
          variant: "destructive",
        });
        return;
      }

      if (followUpMode === "simple") {
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
      if (formData.is_follow_up && followUpMode === "advanced") {
        conditionalLogic = {
          show_if: visibilityRules,
        };
      } else if (formData.is_follow_up && parentQuestions.length > 0) {
        if (parentQuestions.length === 1) {
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
          conditionalLogic = {
            show_if: parentQuestions.map((parent) => ({
              question_id: parent.question_id,
              value:
                parent.trigger_values.length === 1
                  ? parent.trigger_values[0]
                  : parent.trigger_values,
              operator: parent.trigger_values.length === 1 ? "equals" : "in",
            })),
            logic_operator: logicOperator,
          };
        }
      }

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

      // Apply prefill config
      if (prefillEnabled) {
        validationRules.prefill = {
          enabled: true,
          source: prefillSource,
          source_question_id:
            prefillSource === "derived" ? undefined : prefillSourceQuestionId || undefined,
          field: prefillSource === "derived" ? prefillDerivedField : undefined,
          match_strategy:
            prefillSource === "derived"
              ? undefined
              : prefillSourceQuestionId
              ? "by_id"
              : "by_text",
        };
      } else {
        delete validationRules.prefill;
      }
      validationRules.hidden = isHidden === true;

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
              <div className="space-y-4 mt-3 pl-4 border-l-2">
                <div className="space-y-2 p-3 border rounded-lg bg-background">
                  <Label>Visibility Builder Mode</Label>
                  <Select
                    value={followUpMode}
                    onValueChange={(value: "simple" | "advanced") =>
                      setFollowUpMode(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">
                        Simple parent triggers
                      </SelectItem>
                      <SelectItem value="advanced">
                        Advanced nested rules
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Use advanced mode when you need branch convergence like
                    <code className="ml-1">(A AND B) OR (C AND D)</code>.
                  </p>
                </div>

                {followUpMode === "advanced" ? (
                  <VisibilityRuleBuilder
                    value={visibilityRules}
                    onChange={setVisibilityRules}
                    questions={parentQuestionOptions.map((q) => ({
                      id: q.id,
                      question_text: q.question_text,
                      order_index: q.order_index,
                      answer_choices: q.answer_choices,
                    }))}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>
                        Parent Questions <span className="text-red-500">*</span>
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {parentQuestions.length} parent(s) configured
                      </span>
                    </div>

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
                      </div>
                    )}

                    {parentQuestions.length > 0 && (
                      <div className="space-y-3">
                        {parentQuestions.map((parent, parentIdx) => {
                          const parentQ = existingQuestions.find(
                            (q) => q.id === parent.question_id
                          );
                          return (
                            <div
                              key={`${parent.question_id}-${parentIdx}`}
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
                                  onClick={() =>
                                    setParentQuestions(
                                      parentQuestions.filter(
                                        (_, idx) => idx !== parentIdx
                                      )
                                    )
                                  }
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="space-y-2">
                                {parent.trigger_values.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {parent.trigger_values.map((value, valueIdx) => (
                                      <div
                                        key={`${value}-${valueIdx}`}
                                        className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs"
                                      >
                                        <span>{value}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = [...parentQuestions];
                                            updated[parentIdx].trigger_values =
                                              updated[parentIdx].trigger_values.filter(
                                                (_, idx) => idx !== valueIdx
                                              );
                                            setParentQuestions(updated);
                                          }}
                                          className="ml-1 hover:text-red-200 font-bold leading-none"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {parentQ?.answer_choices &&
                                  parentQ.answer_choices.length > 0 && (
                                    <Select
                                      value=""
                                      onValueChange={(value) => {
                                        if (
                                          value &&
                                          !parent.trigger_values.includes(value)
                                        ) {
                                          const updated = [...parentQuestions];
                                          updated[parentIdx].trigger_values.push(value);
                                          setParentQuestions(updated);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Add trigger value" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {parentQ.answer_choices.map((option, idx) => {
                                          const optionValue =
                                            normalizeChoiceDisplay(option);
                                          const isSelected =
                                            parent.trigger_values.includes(optionValue);
                                          return (
                                            <SelectItem
                                              key={`${optionValue}-${idx}`}
                                              value={optionValue}
                                              disabled={isSelected}
                                            >
                                              {optionValue} {isSelected ? "✓" : ""}
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

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
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            {/* Prefill config */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="prefill_enabled">Prefill from previous answers</Label>
                <Switch
                  id="prefill_enabled"
                  checked={prefillEnabled}
                  onCheckedChange={(checked) => setPrefillEnabled(checked)}
                />
              </div>
              {prefillEnabled && (
                <div className="space-y-2">
                  <Label>Prefill Source</Label>
                  <Select
                    value={prefillSource}
                    onValueChange={(value) =>
                      setPrefillSource(
                        value as "onboarding" | "latest_completed" | "clinical" | "derived"
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="latest_completed">Latest Completed</SelectItem>
                      <SelectItem value="clinical">Clinical</SelectItem>
                      <SelectItem value="derived">Derived</SelectItem>
                    </SelectContent>
                  </Select>

                  {prefillSource === "derived" ? (
                    <>
                      <Label>Derived Field</Label>
                      <Select
                        value={prefillDerivedField}
                        onValueChange={(value) =>
                          setPrefillDerivedField(
                            value as "therapy_route" | "regimen_protocol"
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="therapy_route">Therapy Route</SelectItem>
                          <SelectItem value="regimen_protocol">Regimen Protocol</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Derived values come from latest confirmed treatment data.
                      </p>
                    </>
                  ) : (
                    <>
                      <Label>Source Question ID (optional)</Label>
                      <Input
                        value={prefillSourceQuestionId}
                        onChange={(e) => setPrefillSourceQuestionId(e.target.value)}
                        placeholder="UUID of source question"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank to auto-match by question text when possible.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

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

            <div className="flex items-center justify-between">
              <Label htmlFor="hidden_question">Hidden (Do Not Show Patient)</Label>
              <Switch
                id="hidden_question"
                checked={isHidden}
                onCheckedChange={(checked) => setIsHidden(checked)}
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
