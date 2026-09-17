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
  onSave: (rule?: VisibilityRuleGroup) => Promise<void>;
  contextName: string;
}

export function ConsentPlacementRuleDialog({
  open, onOpenChange, consentName, sources, loadRule, onSave, contextName,
}: ConsentPlacementRuleDialogProps) {
  const [rule, setRule] = useState<VisibilityRuleGroup | undefined>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setRule(undefined);
    setLoadFailed(false);
    setError(null);
    setShowErrors(false);
    void loadRule().then((loaded) => {
      if (active) setRule(loaded);
    }).catch(() => {
      if (active) {
        setLoadFailed(true);
        setError("Could not load this rule. Close and try again.");
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [open, loadRule]);

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
          {loading ? <p className="text-sm text-slate-600">Loading rule…</p> : (
            <ConsentVisibilityRules
              value={rule}
              onChange={(next) => { setRule(next); setError(null); }}
              sources={sources}
              description="Choose patient profile information or an answer collected before the consent step. Leave this empty to show it whenever the shared rule passes."
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
