import { useEffect, useState } from "react";
import { CheckCircle2, Info, Plus, Save, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConsentForm, Program, ProgramCheckoutQuestion, ProgramQuestion } from "../../../types";

interface ProgramFlowConfigPanelProps {
  open: boolean;
  nodeId: string | null;
  nodeType: string | null;
  onClose: () => void;
  program: Program;
  questions: ProgramQuestion[];
  allConsents: ConsentForm[];
  onSaveProgram: (updatedProgram: Program) => void;
  onAddCheckoutQuestion?: () => void;
  onEditCheckoutQuestion?: (checkoutQuestionId: string) => void;
}

const panelTitle = (nodeType: string | null) => {
  if (nodeType === "auth") return "Patient Authentication";
  if (nodeType === "consent") return "Consents";
  if (nodeType === "checkout") return "Checkout Routing";
  if (nodeType === "start") return "Start";
  if (nodeType === "end") return "Completion";
  return "Flow Node";
};

export function ProgramFlowConfigPanel({
  open,
  nodeId,
  nodeType,
  onClose,
  program,
  allConsents,
  onSaveProgram,
  onAddCheckoutQuestion,
  onEditCheckoutQuestion,
}: ProgramFlowConfigPanelProps) {
  const [selectedConsentIds, setSelectedConsentIds] = useState<string[]>([]);
  const [checkoutQuestions, setCheckoutQuestions] = useState<ProgramCheckoutQuestion[]>([]);

  useEffect(() => {
    if (!open || !nodeId) return;

    if (nodeType === "consent") {
      setSelectedConsentIds(program.consentIds || []);
    }

    if (nodeType === "checkout") {
      setCheckoutQuestions(program.checkoutQuestions || []);
    }
  }, [open, nodeId, nodeType, program]);

  if (!open || !nodeId) return null;

  const handleSaveConsents = () => {
    onSaveProgram({
      ...program,
      consentIds: selectedConsentIds,
    });
    onClose();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-[560px] flex-col border-l border-slate-200 bg-slate-50 shadow-2xl animate-in slide-in-from-right">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Program Flow
          </span>
          <h2 className="text-base font-bold leading-tight text-slate-900">
            {panelTitle(nodeType)}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {(nodeType === "start" || nodeType === "end") && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 shadow-sm">
            <Info className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            This system step is derived from the Program intake lifecycle.
          </div>
        )}

        {nodeType === "auth" && (
          <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-6 text-sm text-blue-900">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-700">
              Patient Authentication · Locked first step
            </h3>
            <p className="leading-relaxed">
              Patients enter their name, email, validated US phone number, and required consent here. Existing patients log in and new patients create an account. This system boundary cannot be configured, duplicated, deleted, or reordered.
            </p>
          </div>
        )}

        {nodeType === "consent" && (
          <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Required Consents
              </h3>
            </div>
            <div className="space-y-3">
              {allConsents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs italic text-slate-400">
                  No consents are available.
                </div>
              ) : (
                allConsents.map((consent) => {
                  const isChecked = selectedConsentIds.includes(consent.id);
                  return (
                    <label
                      key={consent.id}
                      className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold text-slate-800">
                          {consent.name}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Scope: {consent.scope}
                        </span>
                      </span>
                      <Switch
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          setSelectedConsentIds((current) =>
                            checked
                              ? [...current, consent.id]
                              : current.filter((id) => id !== consent.id)
                          );
                        }}
                      />
                    </label>
                  );
                })
              )}
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button onClick={handleSaveConsents}>
                <Save className="mr-2 h-4 w-4" />
                Save Consents
              </Button>
            </div>
          </div>
        )}

        {nodeType === "checkout" && (
          <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Checkout Questions
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onAddCheckoutQuestion?.();
                  onClose();
                }}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Group
              </Button>
            </div>
            <div className="space-y-3">
              {checkoutQuestions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs italic text-slate-400">
                  No checkout questions are configured.
                </div>
              ) : (
                checkoutQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-slate-800">
                        {question.text}
                      </div>
                      <div className="mt-1 text-[10px] font-semibold text-slate-400">
                        {question.products?.length || 0} product route{question.products?.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onEditCheckoutQuestion?.(question.id);
                        onClose();
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {nodeType === "question" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            Question nodes are edited through the existing Program question editor.
          </div>
        )}
      </div>
    </div>
  );
}
