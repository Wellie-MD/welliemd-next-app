import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisibilityRuleBuilder, type QuestionOption } from "@/components/questionnaires/VisibilityRuleBuilder";
import { validateVisibilityGroup } from "@/components/questionnaires/visibilityRuleValidation";
import {
  fromBuilderGroup,
  PATIENT_PROFILE_AGE_ID,
  PATIENT_PROFILE_SEX_ID,
  toBuilderGroup,
} from "@/features/treatments/utils/visibilityBuilderAdapters";
import type { VisibilityRuleGroup } from "@/features/treatments/types";

export const profileConsentSources: QuestionOption[] = [
  {
    id: PATIENT_PROFILE_SEX_ID,
    question_text: "Patient profile — Sex assigned at birth",
    question_type: "sex",
    answer_choices: ["Male", "Female", "Other"],
  },
  {
    id: PATIENT_PROFILE_AGE_ID,
    question_text: "Patient profile — Age",
    question_type: "number",
  },
];

export const consentRuleIssues = (rule?: VisibilityRuleGroup) =>
  rule ? validateVisibilityGroup(toBuilderGroup(rule)) : [];

interface ConsentVisibilityRulesProps {
  value?: VisibilityRuleGroup;
  onChange: (next?: VisibilityRuleGroup) => void;
  sources: QuestionOption[];
  description: string;
  showErrors?: boolean;
}

export function ConsentVisibilityRules({
  value,
  onChange,
  sources,
  description,
  showErrors = false,
}: ConsentVisibilityRulesProps) {
  const issues = showErrors ? consentRuleIssues(value) : [];
  return (
    <section className="min-w-0 space-y-3" aria-label="Consent visibility rules">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-emerald-600" />
        <h3 className="text-sm font-bold text-slate-900">Visibility rules</h3>
      </div>
      <p className="text-xs leading-relaxed text-slate-600">{description}</p>
      {issues.length > 0 && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          Complete every condition before saving.
        </div>
      )}
      {!value ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-600">
          No rule — this consent is shown whenever it is included in the patient flow.
          <div className="mt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => onChange({
              mode: "nested",
              rules: [{ questionId: "", operator: "eq", value: "" }],
              subgroups: [],
            })}>
              Add visibility rule
            </Button>
          </div>
        </div>
      ) : (
        <div className="min-w-0 overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <VisibilityRuleBuilder
            value={toBuilderGroup(value)}
            onChange={(next) => onChange(fromBuilderGroup(next))}
            questions={sources}
            validationIssues={issues}
          />
          <div className="mt-3 flex justify-end">
            <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={() => onChange(undefined)}>
              Remove rule
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
