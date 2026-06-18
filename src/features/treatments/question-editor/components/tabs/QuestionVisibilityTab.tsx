import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
  VisibilityRuleBuilder,
  createDefaultVisibilityGroup,
  type VisibilityCondition,
  type VisibilityGroup,
} from "@/components/questionnaires/VisibilityRuleBuilder";
import type { ProgramQuestion, VisibilityRule, VisibilityRuleGroup } from "@/features/treatments/types";

interface QuestionVisibilityTabProps {
  visibilityRuleGroup: VisibilityRuleGroup | undefined;
  setVisibilityRuleGroup: (val: VisibilityRuleGroup | undefined) => void;
  questions: ProgramQuestion[];
  currentQuestionId: string;
}

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

const toBuilderGroup = (group: VisibilityRuleGroup | undefined): VisibilityGroup => {
  if (!group) return createDefaultVisibilityGroup();

  return {
    type: "group",
    operator: group.mode === "nested" ? "AND" : "OR",
    children: [
      ...group.rules.map<VisibilityCondition>((rule) => ({
        type: "condition",
        question_id: rule.questionId,
        operator: rule.operator,
        value: rule.value,
      })),
      ...(group.subgroups || []).map(toBuilderGroup),
    ],
  };
};

const fromBuilderGroup = (group: VisibilityGroup): VisibilityRuleGroup => {
  const rules: VisibilityRule[] = [];
  const subgroups: VisibilityRuleGroup[] = [];

  group.children.forEach((child) => {
    if (child.type === "group") {
      subgroups.push(fromBuilderGroup(child));
      return;
    }

    rules.push({
      questionId: child.question_id,
      operator: child.operator === "not_equals" ? "not_equals" : "equals",
      value: Array.isArray(child.value) ? child.value.join(",") : String(child.value || ""),
    });
  });

  return {
    mode: group.operator === "AND" ? "nested" : "simple",
    rules,
    subgroups,
  };
};

export function QuestionVisibilityTab({
  visibilityRuleGroup,
  setVisibilityRuleGroup,
  questions,
  currentQuestionId,
}: QuestionVisibilityTabProps) {
  const currentQuestionOrder = questions.find((question) => question.id === currentQuestionId)?.order || 999;
  const eligibleQuestions = questions.filter((question) => (
    question.id !== currentQuestionId && question.order < currentQuestionOrder
  ));

  const hasRules = !!visibilityRuleGroup && (
    visibilityRuleGroup.rules.length > 0 || (visibilityRuleGroup.subgroups || []).length > 0
  );

  return (
    <div className="space-y-4">
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
            questions={eligibleQuestions.map((question) => ({
              id: question.id,
              question_text: question.text,
              order_index: question.order,
              answer_choices: question.choices,
            }))}
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
