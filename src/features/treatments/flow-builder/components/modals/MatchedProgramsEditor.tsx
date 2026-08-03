import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { CustomProgram, Program, ProgramMatchingCondition, ProgramMatchingConfig, ProgramMatchingRule } from "@/features/treatments/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customProgram: CustomProgram;
  programs: Program[];
  onSave: (rules: CustomProgram["programMatchingRules"]) => Promise<void> | void;
}

const emptyRule = (): ProgramMatchingRule => ({ combinator: "and", rules: [] });
const emptyConfig = (): ProgramMatchingConfig => ({ enabled: true, rule: emptyRule() });
const profileFields = new Set(["age", "bmi", "sex", "gender", "service_state"]);

function evaluateCondition(condition: ProgramMatchingCondition, answers: Record<string, string>) {
  const actual = answers[condition.field] ?? "";
  const expected = String(condition.value ?? "");
  if (condition.operator === "exists") return Boolean(actual) === (expected !== "false");
  if (condition.operator === "contains" || condition.operator === "not_contains") {
    const result = actual.split(",").map((value) => value.trim()).includes(expected);
    return condition.operator === "contains" ? result : !result;
  }
  if (condition.operator === "eq" || condition.operator === "neq") return condition.operator === "eq" ? actual === expected : actual !== expected;
  const left = Number(actual); const right = Number(expected);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  if (condition.operator === "gt") return left > right;
  if (condition.operator === "gte") return left >= right;
  if (condition.operator === "lt") return left < right;
  if (condition.operator === "lte") return left <= right;
  if (condition.operator === "between") { const [low, high] = expected.split(",").map(Number); return Number.isFinite(low) && Number.isFinite(high) && left >= low && left <= high; }
  return false;
}

export function MatchedProgramsEditor({ open, onOpenChange, customProgram, programs, onSave }: Props) {
  const attached = useMemo(() => programs.filter((item) => customProgram.includedProgramIds.includes(item.id)), [programs, customProgram.includedProgramIds]);
  const matchingQuestions = useMemo(() => customProgram.flowItems.filter((item) => item.kind === "routing_question"), [customProgram.flowItems]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState(customProgram.programMatchingRules || {});
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, string>>({ service_state: "TX", age: "35", bmi: "31", sex: "female" });

  useEffect(() => {
    if (!open) return;
    setDraft(structuredClone(customProgram.programMatchingRules || {}));
    setSelectedId((current) => attached.some((item) => item.id === current) ? current : attached[0]?.id || "");
  }, [open, customProgram.programMatchingRules, attached]);

  const program = attached.find((item) => item.id === selectedId);
  const config = draft[selectedId] || emptyConfig();
  const rule = ("rules" in config.rule ? config.rule : emptyRule()) as ProgramMatchingRule;
  const updateConfig = (next: ProgramMatchingConfig) => setDraft((current) => ({ ...current, [selectedId]: next }));
  const updateRule = (next: ProgramMatchingRule) => updateConfig({ ...config, rule: next });
  const matchingQuestionIds = new Set(matchingQuestions.map((item) => item.sourceId || item.id));
  const invalid = rule.rules.some((condition) => !condition.field || !condition.operator || (!profileFields.has(condition.field) && !matchingQuestionIds.has(condition.field)));
  const matchedPrograms = attached.filter((item) => {
    const candidate = draft[item.id] || emptyConfig();
    if (!candidate.enabled) return false;
    const candidateRule = ("rules" in candidate.rule ? candidate.rule : emptyRule()) as ProgramMatchingRule;
    const results = candidateRule.rules.map((condition) => evaluateCondition(condition, previewAnswers));
    return !results.length || (candidateRule.combinator === "and" ? results.every(Boolean) : results.some(Boolean));
  });

  const addCondition = () => updateRule({
    ...rule,
    rules: [...rule.rules, { field: matchingQuestions[0]?.sourceId || matchingQuestions[0]?.id || "age", operator: "eq", value: "" }],
  });
  const updateCondition = (index: number, patch: Partial<ProgramMatchingCondition>) => updateRule({
    ...rule,
    rules: rule.rules.map((condition, current) => current === index ? { ...condition, ...patch } : condition),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[82vh] max-w-6xl flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0">
        <DialogHeader className="border-b border-slate-200 px-5 py-4">
          <DialogTitle className="text-sm font-bold text-slate-900">Configure Matched Programs</DialogTitle>
          <p className="text-xs text-slate-500">Define which attached Programs appear after the patient answers the matching questions.</p>
        </DialogHeader>
        <div className="grid min-h-0 flex-1 grid-cols-[230px_1fr_280px]">
          <aside className="overflow-auto border-r border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Attached Programs</div>
            <div className="space-y-1.5">
              {attached.map((item) => {
                const itemRule = draft[item.id]?.rule as ProgramMatchingRule | undefined;
                return <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-md border p-2.5 text-left ${selectedId === item.id ? "border-blue-400 bg-white ring-1 ring-blue-100" : "border-transparent hover:bg-white"}`}>
                  <div className="text-xs font-semibold text-slate-900">{item.name}</div>
                  <div className="mt-1 text-[10px] text-slate-500">{itemRule?.rules?.length || 0} matching conditions</div>
                </button>;
              })}
            </div>
          </aside>
          <section className="overflow-auto p-5">
            {!program ? <p className="text-sm text-slate-500">Attach a Program before configuring matching.</p> : <>
              <div className="flex items-center justify-between">
                <div><h3 className="text-base font-bold text-slate-900">{program.name}</h3><p className="text-xs text-slate-500">Configure the answer conditions that make this Program available.</p></div>
                <label className="flex items-center gap-2 text-xs font-semibold"><Switch checked={config.enabled} onCheckedChange={(enabled) => updateConfig({ ...config, enabled })} /> Matching enabled</label>
              </div>
              <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Eligibility summary — read only</div>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-600">
                  <span>States: {program.serviceStatesAll ? "All" : program.serviceStates?.join(", ") || "None"}</span><span>·</span>
                  <span>Age: {program.minAge ?? "Any"}–{program.maxAge ?? "Any"}</span><span>·</span>
                  <span>BMI: {program.minBmi ?? "Any"}–{program.maxBmi ?? "Any"}</span><span>·</span><span>Sex: {program.sexRequirement || "Any"}</span>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-700">Show this Program when
                <Select value={rule.combinator} onValueChange={(value: "and" | "or") => updateRule({ ...rule, combinator: value })}><SelectTrigger className="h-7 w-20 text-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="and">ALL</SelectItem><SelectItem value="or">ANY</SelectItem></SelectContent></Select>
                conditions match
              </div>
              <div className="mt-3 space-y-2">
                {rule.rules.map((condition, index) => <div key={index} className="grid grid-cols-[1.3fr_150px_1fr_32px] gap-2 rounded-md border border-slate-200 p-2">
                  <Select value={condition.field} onValueChange={(field) => updateCondition(index, { field })}><SelectTrigger className="h-8 text-[10px]"><SelectValue placeholder="Select question" /></SelectTrigger><SelectContent>
                    <SelectItem value="age">Patient age</SelectItem><SelectItem value="bmi">Current BMI</SelectItem><SelectItem value="sex">Patient sex</SelectItem><SelectItem value="gender">Patient gender</SelectItem>
                    {matchingQuestions.map((question) => <SelectItem key={question.id} value={question.sourceId || question.id}>{question.title}</SelectItem>)}
                  </SelectContent></Select>
                  <Select value={condition.operator} onValueChange={(operator: ProgramMatchingCondition["operator"]) => updateCondition(index, { operator })}><SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger><SelectContent>
                    <SelectItem value="eq">equals</SelectItem><SelectItem value="neq">does not equal</SelectItem><SelectItem value="contains">contains</SelectItem><SelectItem value="not_contains">does not contain</SelectItem><SelectItem value="gte">greater/equal</SelectItem><SelectItem value="lte">less/equal</SelectItem><SelectItem value="between">between</SelectItem><SelectItem value="exists">has an answer</SelectItem>
                  </SelectContent></Select>
                  <Input className="h-8 text-[10px]" value={String(condition.value ?? "")} onChange={(event) => updateCondition(index, { value: event.target.value })} placeholder="Expected answer" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => updateRule({ ...rule, rules: rule.rules.filter((_, current) => current !== index) })}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>)}
              </div>
              <Button variant="outline" size="sm" className="mt-3 h-8 text-xs" onClick={addCondition}><Plus className="mr-1.5 h-3.5 w-3.5" />Add condition</Button>
              {!rule.rules.length && <p className="mt-3 text-xs text-amber-700">No answer conditions: this Program matches whenever its service-state and profile eligibility pass.</p>}
            </>}
          </section>
          <aside className="overflow-auto bg-[#111c34] p-4 text-white">
            <div className="flex items-center justify-between"><div className="text-[9px] font-bold uppercase tracking-wider text-slate-300">{previewMode ? "Sample rule inputs" : "Rule authoring harness"}</div><button className="text-[9px] font-semibold text-blue-300" onClick={() => setPreviewMode((value) => !value)}>{previewMode ? "View harness result" : "Test rule inputs"}</button></div>
            {previewMode && <div className="mt-4 space-y-2 rounded bg-white p-3 text-slate-900">
              {[{ id: "service_state", label: "State" }, { id: "age", label: "Age" }, { id: "bmi", label: "BMI" }, { id: "sex", label: "Sex" }, ...matchingQuestions.map((item) => ({ id: item.sourceId || item.id, label: item.title }))].map((field) => <label key={field.id} className="block text-[9px] font-semibold text-slate-600">{field.label}<Input className="mt-1 h-7 text-[10px]" value={previewAnswers[field.id] || ""} onChange={(event) => setPreviewAnswers((current) => ({ ...current, [field.id]: event.target.value }))} /></label>)}
              <p className="text-[9px] text-slate-400">For multiple answers, enter comma-separated values. This checks draft rule shape only; use Patient Preview for authoritative eligibility.</p>
            </div>}
            <div className="mt-5 rounded bg-white p-4 text-slate-900">
              <h4 className="text-xs font-bold">Based on what you shared, you seem eligible for:</h4>
              <p className="mt-1 text-[10px] text-slate-500">Select one or more areas you would like to explore.</p>
              {matchedPrograms.map((item) => <div key={item.id} className="mt-3 rounded border border-blue-400 bg-blue-50 p-3"><div className="text-xs font-bold">{item.name}</div><div className="mt-1 text-[10px] text-slate-500">{item.description}</div></div>)}
              {!matchedPrograms.length && <p className="mt-4 text-[10px] text-slate-500">No Programs match these sample answers.</p>}
            </div>
          </aside>
        </div>
        <DialogFooter className="items-center border-t border-slate-200 px-5 py-3">
          <div className="mr-auto flex items-center gap-1.5 text-xs text-slate-500">{invalid ? <AlertTriangle className="h-4 w-4 text-rose-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}{invalid ? "Complete every condition before saving." : "Rules are valid."}</div>
          <Button variant="outline" onClick={() => setPreviewMode(true)}>Preview Answers</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={saving || invalid} onClick={async () => { setSaving(true); try { await onSave(draft); onOpenChange(false); } finally { setSaving(false); } }}>{saving ? "Saving…" : "Save Rules"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
