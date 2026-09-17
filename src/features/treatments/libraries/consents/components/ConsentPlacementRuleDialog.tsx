import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { QuestionOption } from "@/components/questionnaires/VisibilityRuleBuilder";
import type { VisibilityRuleGroup } from "@/features/treatments/types";
import { ConsentVisibilityRules, consentRuleIssues } from "./ConsentVisibilityRules";

interface ConsentPlacementRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consentName: string;
  sources: QuestionOption[];
  loadRule: () => Promise<VisibilityRuleGroup | undefined>;
  loadSharedRule?: () => Promise<VisibilityRuleGroup | undefined>;
  onSave: (rule?: VisibilityRuleGroup) => Promise<void>;
  contextName: string;
  sharedRule?: VisibilityRuleGroup;
}

const operatorLabel = (operator: string) => ({
  eq: "equals",
  neq: "does not equal",
  gt: "is greater than",
  gte: "is at least",
  lt: "is less than",
  lte: "is at most",
  contains: "contains",
  not_contains: "does not contain",
  in: "is one of",
  not_in: "is not one of",
  between: "is between",
  exists: "exists",
  is_empty: "is empty",
  is_not_empty: "is not empty",
}[operator] || operator);

export const consentRuleSummary = (rule?: VisibilityRuleGroup): string => {
  const conditions = [
    ...(rule?.rules || []).map((condition) => {
      const source = condition.source === "patient_profile"
        ? condition.field === "sex" ? "Sex assigned at birth" : "Patient age"
        : condition.questionId || "Program answer";
      const value = condition.value === undefined ? "" : ` ${condition.value}`;
      return `${source} ${operatorLabel(condition.operator)}${value}`.trim();
    }),
    ...(rule?.subgroups || []).map(consentRuleSummary),
  ].filter(Boolean);
  if (!conditions.length) return "Always applies";
  return conditions.join(rule?.mode === "simple" ? " OR " : " AND ");
};

export const resolveSharedConsentRule = (
  placement: {
    id: string;
    source_id?: string;
    visibility_rule?: VisibilityRuleGroup;
    visibilityRuleGroup?: VisibilityRuleGroup;
  } | null,
  library: Array<{
    id: string;
    visibilityRuleGroup?: VisibilityRuleGroup;
  }>,
): VisibilityRuleGroup | undefined => {
  if (!placement) return undefined;
  const sourceIds = new Set(
    [placement.source_id, placement.id].filter(Boolean),
  );
  return library.find((consent) => sourceIds.has(consent.id))?.visibilityRuleGroup
    || placement.visibility_rule
    || placement.visibilityRuleGroup;
};

export function ConsentPlacementRuleDialog({
  open, onOpenChange, consentName, sources, loadRule, loadSharedRule, onSave, contextName, sharedRule,
}: ConsentPlacementRuleDialogProps) {
  const [rule, setRule] = useState<VisibilityRuleGroup | undefined>();
  const [authoritativeSharedRule, setAuthoritativeSharedRule] = useState<VisibilityRuleGroup | undefined>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const answerSources = sources.filter((source) => !source.id.startsWith("__patient_profile_"));

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setRule(undefined);
    setAuthoritativeSharedRule(undefined);
    setLoadFailed(false);
    setError(null);
    setShowErrors(false);
    void Promise.all([
      loadRule(),
      loadSharedRule ? loadSharedRule() : Promise.resolve(sharedRule),
    ]).then(([loadedPlacement, loadedShared]) => {
      if (active) {
        setRule(loadedPlacement);
        setAuthoritativeSharedRule(loadedShared);
      }
    }).catch(() => {
      if (active) {
        setLoadFailed(true);
        setError("Could not load this rule. Close and try again.");
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [open, loadRule, loadSharedRule, sharedRule]);

  const save = async () => {
    if (consentRuleIssues(rule).length) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(rule);
      onOpenChange(false);
    } catch {
      setError("Could not save the visibility rule. Please check the selected source and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-[760px] min-w-0 flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-slate-200 px-4 py-4 sm:px-6">
          <DialogTitle className="text-base font-bold">When should {consentName} appear?</DialogTitle>
          <p className="text-xs text-slate-600">This rule applies only to its use in {contextName}. The shared consent rule still applies.</p>
        </DialogHeader>
        <div className="min-w-0 overflow-y-auto px-4 py-4 sm:px-6">
          <section className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4" aria-label="Shared consent visibility rule">
            <h3 className="text-sm font-bold text-emerald-950">Shared Consent rule</h3>
            <p className="mt-1 text-xs text-emerald-900">{consentRuleSummary(authoritativeSharedRule ?? sharedRule)}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-emerald-800">
              Set in the Consent library. This rule is read-only here and must pass together with the Program rule below.
            </p>
          </section>
          {loading ? <p className="text-sm text-slate-600">Loading rule…</p> : (
            <ConsentVisibilityRules
              value={rule}
              onChange={(next) => { setRule(next); setError(null); }}
              sources={answerSources}
              description="Choose an answer collected before the consent step. Leave this empty to show it whenever the shared rule passes."
              showErrors={showErrors}
            />
          )}
          {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-800">{error}</p>}
        </div>
        <DialogFooter className="shrink-0 border-t border-slate-200 px-4 py-3 sm:px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={() => void save()} disabled={loading || saving || loadFailed}>
            {saving ? "Saving…" : "Save visibility rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
