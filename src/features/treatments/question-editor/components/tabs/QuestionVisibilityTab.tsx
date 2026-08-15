import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import {
  DERIVED_BMI_ID,
  VisibilityRuleBuilder,
} from "@/components/questionnaires/VisibilityRuleBuilder";
import {
  visibilityPathLabel,
  type VisibilityValidationIssue,
} from "@/components/questionnaires/visibilityRuleValidation";
import {
  fromBuilderGroup,
  PATIENT_PROFILE_AGE_ID,
  PATIENT_PROFILE_SEX_ID,
  toBuilderGroup,
} from "@/features/treatments/utils/visibilityBuilderAdapters";
import type { ProgramQuestion, VisibilityRule, VisibilityRuleGroup } from "@/features/treatments/types";
import { treatmentConfigurationApi } from "@/features/treatments/api/configurationApi";
import { treatmentQueryKeys } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { isPersistedUuid } from "@/features/treatments/api/mappers";
import { resolveChoiceValue } from "@/utils/choiceValue";

interface QuestionVisibilityTabProps {
  visibilityRuleGroup: VisibilityRuleGroup | undefined;
  setVisibilityRuleGroup: (val: VisibilityRuleGroup | undefined) => void;
  questions: ProgramQuestion[];
  currentQuestionId: string;
  validationIssues?: VisibilityValidationIssue[];
}

const NUMERIC_VISIBILITY_OPERATORS = new Set(["gt", "gte", "lt", "lte", "between"]);

const createEmptyRule = (): VisibilityRule => ({
  questionId: "",
  operator: "equals",
  value: "",
});

const createTreatmentRuleGroup = (): VisibilityRuleGroup => ({
  mode: "nested",
  rules: [createEmptyRule()],
  subgroups: [],
});

export function QuestionVisibilityTab({
  visibilityRuleGroup,
  setVisibilityRuleGroup,
  questions,
  currentQuestionId,
  validationIssues = [],
}: QuestionVisibilityTabProps) {
  const currentQuestionOrder = questions.find((question) => question.id === currentQuestionId)?.order || 999;
  const eligibleQuestions = questions.filter((question) => (
    question.id !== currentQuestionId && question.order < currentQuestionOrder
  ));
  const sectionQuestions = eligibleQuestions.filter((question) => question.kind === "section");
  const sectionFieldQueries = useQueries({
    queries: sectionQuestions.map((question) => {
      const sectionId = String(
        question.elementConfig?.sourceSectionId || question.elementConfig?.sourceId || "",
      );
      return {
        queryKey: treatmentQueryKeys.sectionFields(sectionId),
        queryFn: () => treatmentConfigurationApi.listSectionFields(sectionId),
        enabled: isPersistedUuid(sectionId),
        staleTime: 60_000,
      };
    }),
  });

  const hasBmiQuestion = eligibleQuestions.some(
    (q) => q.kind === "height_weight" || q.kind === "bmi"
  );

  const builderQuestions = eligibleQuestions
    .filter((q) => q.kind !== "height_weight" && q.kind !== "bmi" && q.kind !== "section")
    .map((question) => ({
      id: question.id,
      question_text: question.text,
      order_index: question.order,
      answer_choices: question.choices,
    }));

  sectionQuestions.forEach((sectionQuestion, index) => {
    const fields = sectionFieldQueries[index]?.data || [];
    fields
      .filter((field) => field.kind !== "checkout")
      .forEach((field) => {
        const configuredChoices = field.configuration?.choices;
        const answerChoices = Array.isArray(configuredChoices)
          ? configuredChoices.map((choice) => (
              typeof choice === "string"
                ? choice
                : String((choice as Record<string, unknown>).label || (choice as Record<string, unknown>).value || "")
            )).filter(Boolean)
          : [];
        builderQuestions.push({
          id: field.sourceFieldId,
          question_text: `${sectionQuestion.text} — ${field.label}`,
          order_index: sectionQuestion.order,
          answer_choices: answerChoices,
        });
      });
  });

  if (hasBmiQuestion) {
    const bmiQuestion = eligibleQuestions.find(
      (q) => q.kind === "height_weight" || q.kind === "bmi"
    );
    builderQuestions.push({
      id: DERIVED_BMI_ID,
      question_text: "BMI (Calculated)",
      order_index: bmiQuestion?.order ?? 0,
    });
  }

  builderQuestions.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  builderQuestions.push(
    {
      id: PATIENT_PROFILE_SEX_ID,
      question_text: "Patient profile — Sex assigned at birth",
      order_index: 10000,
      answer_choices: ["Male", "Female", "Other"],
    },
    {
      id: PATIENT_PROFILE_AGE_ID,
      question_text: "Patient profile — Age",
      order_index: 10001,
    },
  );

  // Older rules may contain a short semantic answer (for example
  // `Semaglutide`) while the current question choice has a longer display
  // label. Keep the persisted rule aligned with the current choice whenever
  // there is exactly one unambiguous match. This also makes the selected value
  // survive closing and reopening the editor.
  useEffect(() => {
    if (!visibilityRuleGroup) return;

    const canonicalize = (group: VisibilityRuleGroup): VisibilityRuleGroup => ({
      ...group,
      rules: (group.rules || []).map((rule) => {
        const question = builderQuestions.find((candidate) => candidate.id === rule.questionId);
        if (!question?.answer_choices?.length || NUMERIC_VISIBILITY_OPERATORS.has(rule.operator)) return rule;

        const value = Array.isArray(rule.value)
          ? rule.value.map((item) => resolveChoiceValue(question.answer_choices, item))
          : resolveChoiceValue(question.answer_choices, rule.value);
        return JSON.stringify(value) === JSON.stringify(rule.value)
          ? rule
          : { ...rule, value };
      }),
      subgroups: (group.subgroups || []).map(canonicalize),
    });

    const canonicalGroup = canonicalize(visibilityRuleGroup);
    if (JSON.stringify(canonicalGroup) !== JSON.stringify(visibilityRuleGroup)) {
      setVisibilityRuleGroup(canonicalGroup);
    }
  }, [builderQuestions, setVisibilityRuleGroup, visibilityRuleGroup]);

  const hasRules = !!visibilityRuleGroup && (
    (visibilityRuleGroup.rules?.length || 0) > 0 || (visibilityRuleGroup.subgroups || []).length > 0
  );

  return (
    <div className="space-y-4" data-visibility-section>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-green-100 text-green-600">
          <Eye className="h-3 w-3" />
        </div>
        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800">
          VISIBILITY
        </h3>
      </div>

      <div className="mb-4 text-xs leading-relaxed text-slate-500">
        By default, every question shows to every patient. Add rules below to limit when this question appears - e.g., only show it when an earlier question has a specific answer. Combine conditions with AND / OR groups.
      </div>

      {validationIssues.length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          data-testid="visibility-validation-summary"
        >
          <p className="font-semibold">Visibility is incomplete.</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs">
            {validationIssues.map((issue) => (
              <li key={`${issue.path.join("-")}-${issue.field}`}>
                {issue.field === "group"
                  ? `Group ${visibilityPathLabel(issue.path)}`
                  : `Condition ${visibilityPathLabel(issue.path)}`}
                {`: ${issue.message}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!hasRules ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-400">
          No visibility rules - this question is always shown.
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibilityRuleGroup(createTreatmentRuleGroup())}
              className="h-8 border-slate-200 bg-white text-xs font-semibold text-slate-600 shadow-sm"
              data-testid="add-first-visibility-rule"
            >
              + Add visibility rule
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <VisibilityRuleBuilder
            value={toBuilderGroup(visibilityRuleGroup)}
            onChange={(nextGroup) => setVisibilityRuleGroup(fromBuilderGroup(nextGroup))}
            questions={builderQuestions}
            validationIssues={validationIssues}
          />
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs font-semibold text-red-500 hover:text-red-700"
              onClick={() => setVisibilityRuleGroup(undefined)}
              data-testid="clear-visibility-rules"
            >
              Remove visibility rules
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
