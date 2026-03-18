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
import { Plus, Trash2, Info } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  questionApi,
  templateApi,
  Question,
  CreateQuestionPayload,
} from "@/api/questionnaires";
import { productCategoryApi, ProductCategory } from "@/api/productCategories";
import { titrationCategoryApi, TitrationCategory } from "@/api/titrationCategories";
import { listDoseMappings, ProductDoseMapping } from "@/api/productDoseMappings";
import { RX_DRUG_FORM_OPTIONS } from "@/api/products";
import { ProductSelector } from "./ProductSelector";
import { GroupedQuestionBuilder } from "./GroupedQuestionBuilder";
import {
  VisibilityGroup,
  createDefaultVisibilityGroup,
  VisibilityRuleBuilder,
} from "./VisibilityRuleBuilder";
import { SubQuestion } from "@/api/questionnaires";
import { normalizeChoiceDisplay } from "@/utils/choiceValue";

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

interface StructuredChoiceMeta {
  category_id?: number;
  category_name?: string;
  dose_mapping_id?: number;
  dose_mapping_label?: string;
}

interface StructuredChoiceOption {
  label: string;
  value?: string;
  meta?: StructuredChoiceMeta;
}

type AnswerChoiceOption = string | StructuredChoiceOption;

interface LegacyConditionNode {
  question_id?: string;
  operator?: string;
  value?: unknown;
  field?: string;
}

interface CheckoutConfig {
  resolution_mode?: "followup_derived_context";
  target_regimen_protocol?: string;
  dose_strategy?: "same_dose" | "next_dose_if_available_else_same";
  category?: string;
  medication_base_name?: string;
  regimen?: string;
  regimen_name?: string;
  dose_mapping?: number;
  dose_mapping_label?: string;
  product_id?: string | number;
  product_name?: string;
  has_hierarchy?: boolean;
  duration?: string;
  duration_name?: string;
  pharmacy_id?: string;
  pharmacy_name?: string;
  beluga_medicine_id?: string;
  price?: number;
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
  answer_choices: AnswerChoiceOption[];
}

function isStructuredChoiceOption(choice: unknown): choice is StructuredChoiceOption {
  return !!choice && typeof choice === "object" && !Array.isArray(choice);
}

function getChoiceLabel(choice: AnswerChoiceOption): string {
  return normalizeChoiceDisplay(choice);
}

function getChoiceMeta(choice: AnswerChoiceOption): StructuredChoiceMeta {
  if (!isStructuredChoiceOption(choice) || !choice.meta) return {};
  return choice.meta;
}

function buildChoiceOption(
  label: string,
  meta?: StructuredChoiceMeta
): AnswerChoiceOption {
  const trimmed = label.trim();
  const normalizedMeta = meta || {};
  const hasMeta = Object.values(normalizedMeta).some(
    (value) => value !== undefined && value !== null && value !== ""
  );

  if (!hasMeta) {
    return trimmed;
  }

  return {
    label: trimmed,
    value: trimmed,
    meta: normalizedMeta,
  };
}

function isVisibilityGroup(value: unknown): value is VisibilityGroup {
  return (
    !!value &&
    typeof value === "object" &&
    (value as VisibilityGroup).type === "group" &&
    Array.isArray((value as VisibilityGroup).children)
  );
}

function normalizeShowIfToTree(showIf: unknown, logicOperator: "AND" | "OR" = "OR"): VisibilityGroup | null {
  if (!showIf) return null;

  if (isVisibilityGroup(showIf)) {
    return showIf;
  }

  if (Array.isArray(showIf)) {
    return {
      type: "group",
      operator: logicOperator,
      children: showIf
        .filter((item): item is LegacyConditionNode => !!item && typeof item === "object")
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
          value: Array.isArray(item.value) ? item.value.map(String) : String(item.value ?? ""),
          field: item.field,
        })),
    };
  }

  if (typeof showIf === "object" && showIf && (showIf as LegacyConditionNode).question_id) {
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
          value: Array.isArray(item.value) ? item.value.map(String) : String(item.value ?? ""),
          field: item.field,
        },
      ],
    };
  }

  return null;
}

function FieldHelp({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center text-muted-foreground hover:text-foreground"
            aria-label="Field help"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
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
  const [templateQuestionnaireType, setTemplateQuestionnaireType] = useState<
    "onboarding" | "follow_up" | null
  >(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [titrationCategories, setTitrationCategories] = useState<TitrationCategory[]>([]);
  const [doseMappings, setDoseMappings] = useState<ProductDoseMapping[]>([]);

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
  const [followUpMode, setFollowUpMode] = useState<"simple" | "advanced">("simple");
  const [visibilityRules, setVisibilityRules] = useState<VisibilityGroup>(
    createDefaultVisibilityGroup()
  );

  // Prefill config
  const [prefillEnabled, setPrefillEnabled] = useState(false);
  const [prefillSource, setPrefillSource] = useState<
    "onboarding" | "latest_completed" | "clinical" | "derived"
  >("onboarding");
  const [prefillFieldType, setPrefillFieldType] = useState<
    "" | "medication_family" | "medication_dose"
  >("");
  const [prefillSourceQuestionId, setPrefillSourceQuestionId] = useState("");
  const [prefillDerivedField, setPrefillDerivedField] = useState<
    "therapy_route" | "regimen_protocol"
  >("therapy_route");

  // State for checkout question type
  const [checkoutConfig, setCheckoutConfig] = useState<CheckoutConfig | null>(
    null
  );

  // State for grouped questions
  const [subQuestions, setSubQuestions] = useState<Omit<SubQuestion, "id">[]>(
    []
  );

  interface MedicationConfigInput {
    code: string;
    display: string;
    aliasesRaw: string;
    dosesRaw: string;
  }
  const [medicationConfig, setMedicationConfig] = useState<{
    medications: MedicationConfigInput[];
    note: string;
  }>({
    medications: [],
    note: "",
  });
  const [medicationMode, setMedicationMode] = useState<"static" | "dynamic">(
    "static"
  );
  const [medicationFilters, setMedicationFilters] = useState({
    categoryIds: [] as number[],
    doseMappingIds: [] as number[],
    titrationCategoryIds: [] as number[],
    rxDrugForm: "",
  });
  const [includeNoneOption, setIncludeNoneOption] = useState(false);
  const [includeOtherOption, setIncludeOtherOption] = useState(false);
  const [bmiMin, setBmiMin] = useState<number | "">("");
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
          setTemplateQuestionnaireType(templateData.questionnaire_type || null);
        } catch (error) {
          console.error("Failed to fetch template:", error);
        }
      }
    };
    fetchTemplateData();
  }, [open, templateId]);

  // Fetch catalog metadata for dynamic medication selector
  useEffect(() => {
    const fetchCatalogData = async () => {
      if (!open) return;
      try {
        const [cats, titrations, mappings] = await Promise.all([
          productCategoryApi.listCategories(),
          titrationCategoryApi.listCategories({ is_active: true, page_size: 100 }),
          listDoseMappings({ page_size: 1000 }),
        ]);
        setCategories(cats || []);
        setTitrationCategories(titrations || []);
        setDoseMappings(mappings?.results || []);
      } catch (error) {
        console.error("Failed to fetch catalog metadata:", error);
      }
    };
    fetchCatalogData();
  }, [open]);

  useEffect(() => {
    if (question) {
      // Extract follow-up data from conditional_logic
      const isFollowUp = !!question.conditional_logic?.show_if;

      // Initialize variables for backward compatibility
      let parentQuestionId = "";
      let triggerValue = "";

      // Check if this is the new multi-parent format or legacy single-parent format
      const showIf = question.conditional_logic?.show_if;
      const normalizedTree = normalizeShowIfToTree(
        showIf,
        question.conditional_logic?.logic_operator === "AND" ? "AND" : "OR"
      );
      setVisibilityRules(normalizedTree || createDefaultVisibilityGroup());
      setFollowUpMode(normalizedTree && isVisibilityGroup(showIf) ? "advanced" : "simple");

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
      setPrefillFieldType(
        (prefillConfig?.field_type as "" | "medication_family" | "medication_dose") || ""
      );
      setPrefillSourceQuestionId(prefillConfig?.source_question_id || "");
      if (prefillConfig?.field) {
        setPrefillDerivedField(
          prefillConfig.field as "therapy_route" | "regimen_protocol"
        );
      }

      // Extract checkout_config for checkout questions
      if (
        question.question_type === "checkout" &&
        validationRules?.checkout_config
      ) {
        const existingCheckoutConfig = validationRules.checkout_config as CheckoutConfig;
        setCheckoutConfig(existingCheckoutConfig);
      } else if (question.question_type === "checkout") {
        setCheckoutConfig(null);
      }

      // Extract medication config for medication_dose_selector questions
      if (
        question.question_type === "medication_dose_selector" &&
        validationRules?.medications
      ) {
        // Convert arrays back to raw strings for editing
        setMedicationConfig({
          medications: validationRules.medications.map((med: { code: string; display: string; aliases: string[]; doses: string[] }) => ({
            code: med.code,
            display: med.display,
            aliasesRaw: Array.isArray(med.aliases) ? med.aliases.join(', ') : '',
            dosesRaw: Array.isArray(med.doses) ? med.doses.join(', ') : '',
          })),
          note: validationRules.note || "",
        });
      }
      if (question.question_type === "medication_dose_selector") {
        const isDynamic = validationRules?.medications_source === "catalog";
        setMedicationMode(isDynamic ? "dynamic" : "static");
        if (isDynamic) {
          const filters = validationRules?.medications_filter || {};
          setMedicationFilters({
            categoryIds: filters.category_ids || [],
            doseMappingIds: filters.dose_mapping_ids || [],
            titrationCategoryIds: filters.titration_category_ids || [],
            rxDrugForm: filters.rx_drug_form || "",
          });
          setIncludeNoneOption(!!validationRules?.include_none_of_these);
          setIncludeOtherOption(!!validationRules?.include_other_option);
        } else {
        setMedicationFilters({
          categoryIds: [],
          doseMappingIds: [],
          titrationCategoryIds: [],
          rxDrugForm: "",
        });
          setIncludeNoneOption(false);
          setIncludeOtherOption(false);
        }
      }

      // Extract BMI eligibility config
      if (question.question_type === "bmi" && validationRules?.bmi_min !== undefined) {
        setBmiMin(validationRules.bmi_min);
      }

      // Extract DOB age eligibility config
      if (
        question.question_type === "date" &&
        question.beluga_field_mapping === "date_of_birth"
      ) {
        if (validationRules?.min_age !== undefined) {
          setDobMinAge(validationRules.min_age);
        }
        if (validationRules?.max_age !== undefined) {
          setDobMaxAge(validationRules.max_age);
        }
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
      setFollowUpMode("simple");
      setVisibilityRules(createDefaultVisibilityGroup());
      setCheckoutConfig(null);
      setSubQuestions([]);
      setEnableNumberValidation(false);
      setNumberValidationOperator("gt");
      setNumberValidationValue("");
      setMedicationConfig({ medications: [], note: "" });
      setMedicationMode("static");
      setMedicationFilters({
        categoryIds: [],
        doseMappingIds: [],
        titrationCategoryIds: [],
        rxDrugForm: "",
      });
      setIncludeNoneOption(false);
      setIncludeOtherOption(false);
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
          buildChoiceOption(newAnswerChoice.trim()),
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
    const choiceDisplay = choiceToRemove ? getChoiceLabel(choiceToRemove) : "";
    if (choiceDisplay && disqualifyingAnswers.includes(choiceDisplay)) {
      setDisqualifyingAnswers(
        disqualifyingAnswers.filter((a) => a !== choiceDisplay)
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
    const existingMeta = oldValue ? getChoiceMeta(oldValue) : {};
    updatedChoices[index] = buildChoiceOption(value, existingMeta);

    // Update disqualifying answers if the old value was marked
    const oldDisplay = oldValue ? getChoiceLabel(oldValue) : "";
    if (oldDisplay && disqualifyingAnswers.includes(oldDisplay)) {
      const updatedDisqualifying = disqualifyingAnswers.map((a) =>
        a === oldDisplay ? value : a
      );
      setDisqualifyingAnswers(updatedDisqualifying);
    }

    setFormData({
      ...formData,
      answer_choices: updatedChoices,
    });
  };

  const handleUpdateChoiceMeta = (
    index: number,
    updates: Partial<StructuredChoiceMeta>
  ) => {
    const updatedChoices = [...(formData.answer_choices || [])];
    const currentChoice = updatedChoices[index];
    const label = currentChoice ? getChoiceLabel(currentChoice) : "";
    const currentMeta = currentChoice ? getChoiceMeta(currentChoice) : {};
    const nextMeta = { ...currentMeta, ...updates };

    if (!nextMeta.category_id) {
      delete nextMeta.category_name;
    }
    if (!nextMeta.dose_mapping_id) {
      delete nextMeta.dose_mapping_label;
    }

    updatedChoices[index] = buildChoiceOption(label, nextMeta);

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
            description: "Add at least one visibility condition before saving this follow-up question.",
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

      // Validate each parent has trigger values
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
      if (formData.question_type === "checkout") {
        if (!checkoutConfig) {
          toast({
            title: "Validation Error",
            description: "Product selection is required for checkout questions",
            variant: "destructive",
          });
          return;
        }

        if (
          !checkoutConfig.category ||
          !checkoutConfig.regimen ||
          !checkoutConfig.dose_mapping
        ) {
          toast({
            title: "Validation Error",
            description:
              "Select medication category, regimen, and dose level for checkout",
            variant: "destructive",
          });
          return;
        }
      }

      // Validate medication_dose_selector question type
      if (formData.question_type === "medication_dose_selector") {
        if (medicationMode === "static" && medicationConfig.medications.length === 0) {
          toast({
            title: "Validation Error",
            description: "At least one medication is required",
            variant: "destructive",
          });
          return;
        }
        if (medicationMode === "static") {
          for (const med of medicationConfig.medications) {
            if (!med.display.trim()) {
              toast({
                title: "Validation Error",
                description: "All medications must have a display name",
                variant: "destructive",
              });
              return;
            }
            // Parse doses from raw string
            const doses = med.dosesRaw.split(',').map(d => d.trim()).filter(d => d);
            if (doses.length === 0) {
              toast({
                title: "Validation Error",
                description: `Medication "${med.display}" must have at least one dose`,
                variant: "destructive",
              });
              return;
            }
          }
        }
      }

      // Build validation_rules
      let validationRules: unknown = {};

      if (formData.question_type === "file_upload") {
        validationRules = {
          max_file_size: formData.max_file_size,
          allowed_extensions: formData.allowed_extensions,
        };
      } else if (formData.question_type === "checkout") {
        const normalizedCheckoutConfig: CheckoutConfig = { ...checkoutConfig };
        delete normalizedCheckoutConfig.resolution_mode;
        delete normalizedCheckoutConfig.target_regimen_protocol;
        delete normalizedCheckoutConfig.dose_strategy;
        validationRules = {
          checkout_config: normalizedCheckoutConfig,
        };
      } else if (formData.question_type === "medication_dose_selector") {
        if (medicationMode === "dynamic") {
          const filterPayload: Record<string, unknown> = {};
          if (medicationFilters.categoryIds.length > 0) {
            filterPayload.category_ids = medicationFilters.categoryIds;
          }
          if (medicationFilters.doseMappingIds.length > 0) {
            filterPayload.dose_mapping_ids = medicationFilters.doseMappingIds;
          }
          if (medicationFilters.titrationCategoryIds.length > 0) {
            filterPayload.titration_category_ids = medicationFilters.titrationCategoryIds;
          }
          if (medicationFilters.rxDrugForm) {
            filterPayload.rx_drug_form = medicationFilters.rxDrugForm;
          }
          validationRules = {
            medications_source: "catalog",
            medications_filter: filterPayload,
            include_none_of_these: includeNoneOption,
            include_other_option: includeOtherOption,
            note: medicationConfig.note,
          };
        } else {
          // Convert raw strings to arrays when saving
          const medications = medicationConfig.medications.map(med => ({
            code: med.code || med.display.toLowerCase().replace(/\s+/g, '_'),
            display: med.display,
            aliases: med.aliasesRaw.split(',').map(a => a.trim()).filter(a => a),
            doses: med.dosesRaw.split(',').map(d => d.trim()).filter(d => d),
          }));
          validationRules = {
            medications,
            note: medicationConfig.note,
          };
        }
      } else if (formData.question_type === "bmi") {
        // Add BMI eligibility config (minimum only)
        validationRules = {
          bmi_min: bmiMin !== "" ? bmiMin : undefined,
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

      // Apply prefill config
      if (prefillEnabled) {
        validationRules.prefill = {
          enabled: true,
          source: prefillSource,
          field_type: prefillFieldType || undefined,
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
            <div className="flex items-center gap-2">
              <Label htmlFor="question_type">
                Question Type <span className="text-red-500">*</span>
              </Label>
              <FieldHelp text="Use normal single-choice questions for medication and dose in follow-up flows. Use checkout questions only at the end of each final path." />
            </div>
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
                <SelectItem value="state_routing">State Routing (Service Area Check)</SelectItem>
                <SelectItem value="zip">ZIP Code</SelectItem>
                <SelectItem value="single_choice">
                  Single Choice (Radio)
                </SelectItem>
                <SelectItem value="multiple_choice">
                  Multiple Choice (Checkbox)
                </SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="bmi">BMI (Height, Weight & Auto-Calculate)</SelectItem>
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
                <SelectItem value="medication_dose_selector">
                  Medication & Dose Selector
                </SelectItem>
              </SelectContent>
            </Select>
            {(formData.question_type === "single_choice" ||
              formData.question_type === "medication_dose_selector" ||
              formData.question_type === "checkout") && (
              <p className="text-xs text-muted-foreground">
                Recommended: use `Single Choice (Radio)` for medication and dose questions, then use conditions to show the correct static checkout question.
              </p>
            )}
          </div>

          {/* Grouped Question Builder */}
          {(formData.question_type === "personal_details" ||
            formData.question_type === "shipping_address" ||
            formData.question_type === "bmi") && (
            <GroupedQuestionBuilder
              groupType={formData.question_type}
              subQuestions={subQuestions}
              onChange={setSubQuestions}
            />
          )}

          {/* BMI Eligibility Settings */}
          {formData.question_type === "bmi" && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-sm">BMI Eligibility Settings</h3>
              <p className="text-xs text-muted-foreground">
                Set the minimum BMI threshold. Patients with BMI below this limit will be disqualified.
              </p>
              <div className="space-y-2">
                <Label htmlFor="bmi_min">
                  Minimum BMI Limit <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bmi_min"
                  type="number"
                  step="0.1"
                  min="10"
                  max="50"
                  value={bmiMin}
                  onChange={(e) =>
                    setBmiMin(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="e.g., 18.5"
                />
                <p className="text-xs text-muted-foreground">
                  Common settings: 18.5 for underweight threshold, 25 for treatment-naive
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

          {/* Checkout Product Selection */}
          {formData.question_type === "checkout" && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Checkout Configuration</h3>
                <FieldHelp text="Pick the fixed product lane for this checkout question. Use questionnaire visibility rules to decide which checkout appears. Do not use checkout settings as the main branching engine." />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>
                  Select Product <span className="text-red-500">*</span>
                  </Label>
                  <FieldHelp text="Select the exact category, regimen, and dose mapping for this checkout path. Create separate checkout questions for same dose, increase dose, decrease dose, or change medication paths." />
                </div>
                <ProductSelector
                  value={checkoutConfig}
                  onChange={setCheckoutConfig}
                />
                <p className="text-xs text-muted-foreground">
                  This product will be displayed to the patient for checkout.
                  Use questionnaire conditions to decide which checkout question
                  should appear.
                </p>
              </div>
            </div>
          )}

          {/* Medication & Dose Selector Configuration */}
          {formData.question_type === "medication_dose_selector" && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Medication & Dose Configuration</h3>
                <FieldHelp text="This older selector is still supported, but the recommended follow-up pattern is now normal single-choice medication and dose questions with answer choice metadata." />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Use Dynamic Options (from Products)</Label>
                    <FieldHelp text="Dynamic mode builds the medication and dose list from product data. Use this only if you want the selector pattern. For the current follow-up setup, prefer normal single-choice questions instead." />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Build the two-step list from the client’s assigned products.
                  </p>
                </div>
                <Switch
                  checked={medicationMode === "dynamic"}
                  onCheckedChange={(checked) =>
                    setMedicationMode(checked ? "dynamic" : "static")
                  }
                />
              </div>
              
              {/* Helper Note */}
              <div className="space-y-2">
                <Label htmlFor="medication_note">Helper Note (shown to patients)</Label>
                <Input
                  id="medication_note"
                  value={medicationConfig.note}
                  onChange={(e) => setMedicationConfig({
                    ...medicationConfig,
                    note: e.target.value
                  })}
                  placeholder="e.g., Tirzepatide = Mounjaro, Zepbound"
                />
              </div>

              {medicationMode === "dynamic" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Dynamic Filters</Label>
                    <FieldHelp text="These filters control which product-backed options appear in the selector. Keep them aligned with the products assigned to the client." />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Medication Categories</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <label key={category.id} className="flex items-center gap-2 text-xs">
                          <Checkbox
                            checked={medicationFilters.categoryIds.includes(category.id)}
                            onCheckedChange={(checked) => {
                              const next = checked
                                ? [...medicationFilters.categoryIds, category.id]
                                : medicationFilters.categoryIds.filter((id) => id !== category.id);
                              const allowedDoseMappingIds = doseMappings
                                .filter((dm) => next.includes(dm.category))
                                .map((dm) => dm.id);
                              const nextDoseMappingIds = medicationFilters.doseMappingIds.filter((id) =>
                                allowedDoseMappingIds.includes(id)
                              );
                              setMedicationFilters({
                                ...medicationFilters,
                                categoryIds: next,
                                doseMappingIds: nextDoseMappingIds,
                              });
                            }}
                          />
                          {category.name}
                        </label>
                      ))}
                    </div>
                    {categories.length === 0 && (
                      <p className="text-xs text-muted-foreground">No categories found.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Dose Mappings</Label>
                    <p className="text-xs text-muted-foreground">
                      Select which dose mappings should appear for selected categories.
                    </p>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-auto border rounded-md p-2 bg-white">
                      {doseMappings
                        .filter((dm) =>
                          medicationFilters.categoryIds.length === 0
                            ? true
                            : medicationFilters.categoryIds.includes(dm.category)
                        )
                        .map((dm) => (
                          <label key={dm.id} className="flex items-center gap-2 text-xs">
                            <Checkbox
                              checked={medicationFilters.doseMappingIds.includes(dm.id)}
                              onCheckedChange={(checked) => {
                                const next = checked
                                  ? [...medicationFilters.doseMappingIds, dm.id]
                                  : medicationFilters.doseMappingIds.filter((id) => id !== dm.id);
                                setMedicationFilters({ ...medicationFilters, doseMappingIds: next });
                              }}
                            />
                            {dm.category_name} - {dm.patient_label}
                          </label>
                        ))}
                      {doseMappings.filter((dm) =>
                        medicationFilters.categoryIds.length === 0
                          ? true
                          : medicationFilters.categoryIds.includes(dm.category)
                      ).length === 0 && (
                        <p className="text-xs text-muted-foreground">No dose mappings found for selected categories.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Regimen / Protocol Filters</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {titrationCategories.map((category) => (
                        <label key={category.id} className="flex items-center gap-2 text-xs">
                          <Checkbox
                            checked={medicationFilters.titrationCategoryIds.includes(category.id)}
                            onCheckedChange={(checked) => {
                              const next = checked
                                ? [...medicationFilters.titrationCategoryIds, category.id]
                                : medicationFilters.titrationCategoryIds.filter((id) => id !== category.id);
                              setMedicationFilters({ ...medicationFilters, titrationCategoryIds: next });
                            }}
                          />
                          {category.name}
                        </label>
                      ))}
                    </div>
                    {titrationCategories.length === 0 && (
                      <p className="text-xs text-muted-foreground">No titration categories found.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Therapy Route (rx_drug_form)</Label>
                    <Select
                      value={medicationFilters.rxDrugForm || "all"}
                      onValueChange={(value) =>
                        setMedicationFilters({
                          ...medicationFilters,
                          rxDrugForm: value === "all" ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All routes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All routes</SelectItem>
                        {RX_DRUG_FORM_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={includeNoneOption}
                      onCheckedChange={(checked) => setIncludeNoneOption(!!checked)}
                    />
                    <Label className="text-xs">Include “None of these” option</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={includeOtherOption}
                      onCheckedChange={(checked) => setIncludeOtherOption(!!checked)}
                    />
                    <Label className="text-xs">Include “Not listed / Other” option</Label>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label>Medications <span className="text-red-500">*</span></Label>
                  
                  {medicationConfig.medications.map((med, medIndex) => (
                    <div key={medIndex} className="p-3 border rounded-lg bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Medication {medIndex + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newMeds = medicationConfig.medications.filter((_, i) => i !== medIndex);
                            setMedicationConfig({ ...medicationConfig, medications: newMeds });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                      
                      {/* Medication Name */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Display Name</Label>
                          <Input
                            value={med.display}
                            onChange={(e) => {
                              const newMeds = [...medicationConfig.medications];
                              newMeds[medIndex] = {
                                ...newMeds[medIndex],
                                display: e.target.value,
                                code: e.target.value.toLowerCase().replace(/\s+/g, '_')
                              };
                              setMedicationConfig({ ...medicationConfig, medications: newMeds });
                            }}
                            placeholder="e.g., Tirzepatide"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Aliases (comma-separated)</Label>
                          <Input
                            value={med.aliasesRaw}
                            onChange={(e) => {
                              const newMeds = [...medicationConfig.medications];
                              newMeds[medIndex] = {
                                ...newMeds[medIndex],
                                aliasesRaw: e.target.value
                              };
                              setMedicationConfig({ ...medicationConfig, medications: newMeds });
                            }}
                            placeholder="e.g., Mounjaro, Zepbound"
                          />
                        </div>
                      </div>
                      
                      {/* Doses */}
                      <div>
                        <Label className="text-xs">Doses (comma-separated)</Label>
                        <Input
                          value={med.dosesRaw}
                          onChange={(e) => {
                            const newMeds = [...medicationConfig.medications];
                            newMeds[medIndex] = {
                              ...newMeds[medIndex],
                              dosesRaw: e.target.value
                            };
                            setMedicationConfig({ ...medicationConfig, medications: newMeds });
                          }}
                          placeholder="e.g., 1.5mg, 3mg, 6mg, 9mg"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Medication Button */}
                  <Button
                    type="button"
                    onClick={() => {
                      setMedicationConfig({
                        ...medicationConfig,
                        medications: [
                          ...medicationConfig.medications,
                          { code: '', display: '', aliasesRaw: '', dosesRaw: '' }
                        ]
                      });
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Medication
                  </Button>
                  
                  {medicationConfig.medications.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Add at least one medication with its available doses.
                    </p>
                  )}
                </div>
              )}
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
                    <div key={index} className="space-y-2 rounded-md border bg-background p-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={getChoiceLabel(choice)}
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
                            checked={disqualifyingAnswers.includes(getChoiceLabel(choice))}
                            onChange={(e) => {
                              const choiceLabel = getChoiceLabel(choice);
                              if (e.target.checked) {
                                setDisqualifyingAnswers([
                                  ...disqualifyingAnswers,
                                  choiceLabel,
                                ]);
                              } else {
                                setDisqualifyingAnswers(
                                  disqualifyingAnswers.filter((a) => a !== choiceLabel)
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

                      {formData.question_type === "single_choice" && (
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">
                                Medication Category (Optional)
                              </Label>
                              <FieldHelp text="For medication-related single-choice answers, map the option to its medication family. This makes follow-up prefill and branching more reliable." />
                            </div>
                            <Select
                              value={
                                getChoiceMeta(choice).category_id
                                  ? String(getChoiceMeta(choice).category_id)
                                  : "__none__"
                              }
                              onValueChange={(value) => {
                                if (value === "__none__") {
                                  handleUpdateChoiceMeta(index, {
                                    category_id: undefined,
                                    category_name: undefined,
                                    dose_mapping_id: undefined,
                                    dose_mapping_label: undefined,
                                  });
                                  return;
                                }
                                const selectedCategory = categories.find(
                                  (category) => String(category.id) === value
                                );
                                handleUpdateChoiceMeta(index, {
                                  category_id: selectedCategory?.id,
                                  category_name: selectedCategory?.name,
                                  dose_mapping_id:
                                    getChoiceMeta(choice).category_id === selectedCategory?.id
                                      ? getChoiceMeta(choice).dose_mapping_id
                                      : undefined,
                                  dose_mapping_label:
                                    getChoiceMeta(choice).category_id === selectedCategory?.id
                                      ? getChoiceMeta(choice).dose_mapping_label
                                      : undefined,
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="No category mapping" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">No category mapping</SelectItem>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={String(category.id)}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">
                                Dose Mapping (Optional)
                              </Label>
                              <FieldHelp text="For medication-dose answers, select the exact dose mapping for this option. This lets follow-up prefill choose the correct answer directly from product context instead of guessing by text." />
                            </div>
                            <Select
                              value={
                                getChoiceMeta(choice).dose_mapping_id
                                  ? String(getChoiceMeta(choice).dose_mapping_id)
                                  : "__none__"
                              }
                              onValueChange={(value) => {
                                if (value === "__none__") {
                                  handleUpdateChoiceMeta(index, {
                                    dose_mapping_id: undefined,
                                    dose_mapping_label: undefined,
                                  });
                                  return;
                                }
                                const selectedDoseMapping = doseMappings.find(
                                  (mapping) => String(mapping.id) === value
                                );
                                handleUpdateChoiceMeta(index, {
                                  dose_mapping_id: selectedDoseMapping?.id,
                                  dose_mapping_label:
                                    selectedDoseMapping?.patient_label ||
                                    selectedDoseMapping?.name,
                                  category_id:
                                    getChoiceMeta(choice).category_id ||
                                    selectedDoseMapping?.category,
                                  category_name:
                                    getChoiceMeta(choice).category_name ||
                                    selectedDoseMapping?.category_name,
                                });
                              }}
                              disabled={
                                !getChoiceMeta(choice).category_id &&
                                !getChoiceMeta(choice).dose_mapping_id
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="No dose mapping" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">No dose mapping</SelectItem>
                                {doseMappings
                                  .filter((mapping) => {
                                    const categoryId = getChoiceMeta(choice).category_id;
                                    return !categoryId || mapping.category === categoryId;
                                  })
                                  .map((mapping) => (
                                    <SelectItem key={mapping.id} value={String(mapping.id)}>
                                      {mapping.category_name} - {mapping.patient_label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
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
                  <div className="flex items-center gap-2">
                    <Label>Visibility Builder Mode</Label>
                    <FieldHelp text="Use Simple parent triggers for basic show/hide rules. Use Advanced nested rules when one shared question should appear after more than one strict path, such as (A AND B) OR (C AND D)." />
                  </div>
                  <Select
                    value={followUpMode}
                    onValueChange={(value: "simple" | "advanced") => setFollowUpMode(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple parent triggers</SelectItem>
                      <SelectItem value="advanced">Advanced nested rules</SelectItem>
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
                    questions={parentQuestionOptions.map((question) => ({
                      id: question.id,
                      question_text: question.question_text,
                      order_index: question.order_index,
                      answer_choices: question.answer_choices,
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
                                        (option, idx) => {
                                          const optionValue = normalizeChoiceDisplay(option);
                                          const isSelected = parent.trigger_values.includes(optionValue);
                                          return (
                                            <SelectItem
                                              key={idx}
                                              value={optionValue}
                                              disabled={isSelected}
                                            >
                                              {optionValue} {isSelected ? "✓" : ""}
                                            </SelectItem>
                                          );
                                        }
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
                      ℹ️ This question will show{" "}
                      {logicOperator === "AND"
                        ? "only when every configured parent matches."
                        : "when any configured parent matches."}
                    </p>
                  )}
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="prefill_enabled">Prefill from previous answers</Label>
                  <FieldHelp text="Turn this on when the question should start with a value from the same treatment track instead of making the patient re-enter it." />
                </div>
                <Switch
                  id="prefill_enabled"
                  checked={prefillEnabled}
                  onCheckedChange={(checked) => setPrefillEnabled(checked)}
                />
              </div>
              {prefillEnabled && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Prefill Source</Label>
                    <FieldHelp text="Onboarding uses the original treatment setup. Latest Completed uses the most recent completed questionnaire in the same episode. Derived uses current treatment context such as route or regimen." />
                  </div>
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
                      <div className="flex items-center gap-2">
                        <Label>Derived Field</Label>
                        <FieldHelp text="Use a derived field when the answer should come from current treatment context rather than a previous questionnaire answer." />
                      </div>
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
                      <div className="flex items-center gap-2">
                        <Label>Prefill Field Type</Label>
                        <FieldHelp text="Use medication_family for medication-only questions. Use medication_dose for medication plus exact dose questions. This avoids relying on question wording to guess intent." />
                      </div>
                      <Select
                        value={prefillFieldType || "auto"}
                        onValueChange={(value) =>
                          setPrefillFieldType(
                            value === "auto"
                              ? ""
                              : (value as "medication_family" | "medication_dose")
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto detect from question wording</SelectItem>
                          <SelectItem value="medication_family">Medication family</SelectItem>
                          <SelectItem value="medication_dose">Medication dose</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Use this when you want prefill to match medication-only or medication+dose explicitly.
                      </p>

                      <div className="flex items-center gap-2">
                        <Label>Source Question ID (optional)</Label>
                        <FieldHelp text="Usually leave this blank. Use it only when this question should prefill from one exact earlier question instead of auto-matching within the same treatment track." />
                      </div>
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
