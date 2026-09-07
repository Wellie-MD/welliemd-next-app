import { useEffect, useMemo, useState } from "react";
import { FlaskConical, Loader2 } from "lucide-react";
import { labsApi, type LabPanel } from "@/api/labs";
import type { CombinedLabPanel } from "@/features/labs/types";
import type { ProgramLabRequirement } from "@/features/treatments/types";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

import { useQueries } from "@tanstack/react-query";
import { treatmentConfigurationApi } from "@/features/treatments/api/configurationApi";
import { treatmentQueryKeys } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { isPersistedUuid } from "@/features/treatments/api/mappers";
import {
  DERIVED_BMI_ID,
  VisibilityRuleBuilder,
} from "@/components/questionnaires/VisibilityRuleBuilder";
import {
  fromBuilderGroup,
  PATIENT_PROFILE_AGE_ID,
  PATIENT_PROFILE_SEX_ID,
  toBuilderGroup,
} from "@/features/treatments/utils/visibilityBuilderAdapters";
import type { ProgramQuestion, VisibilityRuleGroup, VisibilityRule } from "@/features/treatments/types";
import {
  isSelectableTarget,
  requirementForTarget,
  requirementTargetKey,
  targetKey,
  targetMethods,
  targetName,
  type ProgramLabTarget,
} from "../../components/programLabRequirementCatalog";

interface CheckoutLabsSectionProps {
  requirements: ProgramLabRequirement[];
  onChange: (requirements: ProgramLabRequirement[]) => void;
  onPanelsLoaded?: (panels: LabPanel[]) => void;
  onCombinedPanelsLoaded?: (panels: CombinedLabPanel[]) => void;
  disabled?: boolean;
  eligibleQuestions?: ProgramQuestion[];
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

/**
 * Lab selection belongs visually to the Checkout element, but is persisted
 * through ProgramLabRequirement because it is also consumed by release
 * manifests, tenant assignment, and the Beluga release gate.
 */
export function CheckoutLabsSection({
  requirements,
  onChange,
  onPanelsLoaded,
  onCombinedPanelsLoaded,
  disabled = false,
  eligibleQuestions = [],
}: CheckoutLabsSectionProps) {
  const [panels, setPanels] = useState<LabPanel[]>([]);
  const [combinedPanels, setCombinedPanels] = useState<CombinedLabPanel[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Builder Questions Logic Copied from QuestionVisibilityTab to avoid cross-component coupling ---
  const sectionQuestions = useMemo(() => eligibleQuestions.filter((question) => question.kind === "section"), [eligibleQuestions]);
  
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

  const builderQuestions = useMemo(() => {
    const hasBmiQuestion = eligibleQuestions.some(
      (q) => q.kind === "height_weight" || q.kind === "bmi"
    );

    const qs = eligibleQuestions
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
          qs.push({
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
      qs.push({
        id: DERIVED_BMI_ID,
        question_text: "BMI (Calculated)",
        order_index: bmiQuestion?.order ?? 0,
      });
    }

    qs.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    qs.push(
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
    return qs;
  }, [eligibleQuestions, sectionQuestions, sectionFieldQueries]);
  // -------------------------------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([labsApi.getLabPanels(), labsApi.getCombinedPanels()])
      .then(([nextPanels, nextCombinedPanels]) => {
        if (!cancelled) setPanels(nextPanels);
        if (!cancelled) setCombinedPanels(nextCombinedPanels);
        if (!cancelled) onPanelsLoaded?.(nextPanels);
        if (!cancelled) onCombinedPanelsLoaded?.(nextCombinedPanels);
      })
      .catch(() => {
        if (!cancelled) {
          toast({
            title: "Labs unavailable",
            description: "The Junction lab catalog could not be loaded.",
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectablePanels = useMemo(
    () => panels.filter((panel) => panel.is_active && panel.is_assignable !== false),
    [panels],
  );
  const selectableTargets = useMemo<ProgramLabTarget[]>(
    () => [
      ...selectablePanels.map((panel) => ({ kind: "single" as const, panel })),
      ...combinedPanels
        .map((panel) => ({ kind: "combined" as const, panel }))
        .filter(isSelectableTarget),
    ],
    [combinedPanels, selectablePanels],
  );
  const selectedIds = useMemo(
    () => new Set(requirements.map(requirementTargetKey)),
    [requirements],
  );

  const toggleTarget = (target: ProgramLabTarget) => {
    if (disabled) return;
    const selected = selectedIds.has(targetKey(target));
    const next = selected
      ? requirements
          .filter((requirement) => requirementTargetKey(requirement) !== targetKey(target))
          .map((requirement, index) => ({ ...requirement, displayOrder: index + 1 }))
      : [
          ...requirements,
          requirementForTarget(target, requirements.length + 1),
        ];
    onChange(next);
  };

  const updateRequirement = (requirement: ProgramLabRequirement, updates: Partial<ProgramLabRequirement>) => {
    onChange(
      requirements.map((req) =>
        requirementTargetKey(req) === requirementTargetKey(requirement)
          ? { ...req, ...updates }
          : req
      )
    );
  };

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-900">
            <FlaskConical className="h-4 w-4 text-blue-600" />
            Labs to include
          </div>
          <p className="mt-1 text-[11.5px] leading-normal text-slate-400">
            Attach lab panels ordered through Junction alongside this checkout. Patients
            choose the collection method, but cannot skip a required panel.
          </p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
      </div>

      {!loading && selectableTargets.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 px-4 py-5 text-center text-[11.5px] text-slate-500">
          No active, assignable Junction panels are available. Configure the panel
          under Products → Labs first.
        </div>
      )}

      <div className="space-y-4">
        {selectableTargets.map((target) => {
          const selected = selectedIds.has(targetKey(target));
          const requirement = requirements.find(
            (r) => requirementTargetKey(r) === targetKey(target),
          );
          const methods = targetMethods(target);

          return (
            <div key={targetKey(target)} className={`rounded-lg border transition-colors ${selected ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <label
                className={`flex cursor-pointer items-start gap-3 px-3 py-3 ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-blue-600"
                  checked={selected}
                  disabled={disabled}
                  onChange={() => toggleTarget(target)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-bold text-slate-900">
                    {targetName(target)}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-slate-500">
                    {target.kind === "combined" ? "Combined panel · " : "Single panel · "}
                    {methods.join(" · ")}
                  </span>
                </span>
              </label>

              {selected && requirement && (
                <div className="border-t border-blue-100 bg-white p-4 space-y-4 rounded-b-lg">
                  <div className="space-y-1.5">
                    <label className="text-[11.5px] font-bold text-slate-600">
                      Patient Instructions
                    </label>
                    <textarea
                      value={requirement.instructions || ""}
                      onChange={(e) => updateRequirement(requirement, { instructions: e.target.value })}
                      disabled={disabled}
                      placeholder="Special instructions for the patient regarding this lab (e.g. fasting required)"
                      className="w-full min-h-[80px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-700 shadow-sm outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11.5px] font-bold text-slate-600">
                      Visibility Rule
                    </label>
                    {!requirement.visibilityRuleGroup ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-400">
                        Always included.
                        <div className="mt-4 flex justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateRequirement(requirement, { visibilityRuleGroup: createTreatmentRuleGroup() })}
                            disabled={disabled}
                            className="h-8 border-slate-200 bg-white text-xs font-semibold text-slate-600 shadow-sm"
                          >
                            + Limit when this lab is included
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <VisibilityRuleBuilder
                          value={toBuilderGroup(requirement.visibilityRuleGroup)}
                          onChange={(nextGroup) => updateRequirement(requirement, { visibilityRuleGroup: fromBuilderGroup(nextGroup) })}
                          questions={builderQuestions}
                        />
                        <div className="mt-3 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs font-semibold text-red-500 hover:text-red-700"
                            onClick={() => updateRequirement(requirement, { visibilityRuleGroup: undefined })}
                            disabled={disabled}
                          >
                            Remove rule
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {requirements.length > 0 && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-semibold text-blue-800">
          {requirements.length} required lab panel{requirements.length === 1 ? "" : "s"} selected.
          Junction orders are created after final checkout and gate the Beluga release.
        </div>
      )}
    </section>
  );
}
