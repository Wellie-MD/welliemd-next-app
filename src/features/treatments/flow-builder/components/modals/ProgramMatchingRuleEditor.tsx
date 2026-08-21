import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Layers, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type {
  CustomProgram,
  Program,
  ProgramMatchingCondition,
  ProgramMatchingConfig,
  ProgramMatchingGroup,
  ProgramMatchingNode,
  ProgramMatchingOperator,
} from "@/features/treatments/types";
import {
  addCondition,
  addSubgroup,
  countConditions,
  describeRule,
  emptyGroup,
  isGroup,
  normalizeRule,
  operatorNeedsSecondValue,
  operatorNeedsValue,
  operatorsForKind,
  removeNode,
  serializeRule,
  updateNode,
  validateRule,
  type MatchingIssue,
  type MatchingSourceField,
  type RulePath,
} from "@/features/treatments/flow-builder/utils/programMatchingRules";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customProgram: CustomProgram;
  /** The Program inclusion being edited. Rules are saved per inclusion. */
  programId: string | null;
  programs: Program[];
  sources: MatchingSourceField[];
  onSave: (rules: CustomProgram["programMatchingRules"]) => Promise<void> | void;
}

const pathKey = (path: RulePath) => path.join(".");

export function ProgramMatchingRuleEditor({
  open,
  onOpenChange,
  customProgram,
  programId,
  programs,
  sources,
  onSave,
}: Props) {
  const program = programs.find((item) => item.id === programId) || null;
  const storedConfig = programId ? customProgram.programMatchingRules?.[programId] : undefined;

  const [rule, setRule] = useState<ProgramMatchingGroup>(emptyGroup());
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !programId) return;
    setRule(normalizeRule(storedConfig?.rule));
    setEnabled(storedConfig?.enabled !== false);
    // Re-seed only when the dialog opens for a given inclusion, so typing is
    // never clobbered by an unrelated parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, programId]);

  const issues = useMemo(() => validateRule(rule, sources), [rule, sources]);
  const issuesByPath = useMemo(() => {
    const map = new Map<string, MatchingIssue[]>();
    issues.forEach((issue) => {
      const key = pathKey(issue.path);
      map.set(key, [...(map.get(key) || []), issue]);
    });
    return map;
  }, [issues]);

  const conditionCount = countConditions(rule);
  const summary = describeRule(rule, sources);
  const hasIssues = issues.length > 0;

  const handleSave = async () => {
    if (!programId) return;
    setSaving(true);
    try {
      const next: Record<string, ProgramMatchingConfig> = {
        ...(customProgram.programMatchingRules || {}),
        [programId]: { enabled, rule: serializeRule(rule) },
      };
      await onSave(next);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[86vh] max-w-4xl flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0">
        <DialogHeader className="border-b border-slate-200 px-5 py-4">
          <DialogTitle className="text-sm font-bold text-slate-900">
            Configure matching rules — {program?.name || "Program"}
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Show this Program only when these conditions match. Rules may use answers from earlier
            Custom Program questions and available shared fields. Leave empty to always offer this Program.
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {!program ? (
            <p className="text-sm text-slate-500">Select a Program row to configure its matching rules.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] text-slate-600">
                  <div className="font-semibold text-slate-900">{program.name}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span>Treatment Type: {program.treatmentTypeName || program.treatmentTypeKey || "—"}</span>
                    <span>Stage: Onboarding</span>
                    <span>Visit Type: {program.visitType || "—"}</span>
                  </div>
                  <p className="mt-2 max-w-xl text-[10px] text-slate-500">
                    This edits only how this Program is offered inside this Custom Program. Its clinical
                    questions, disqualifiers, products, labs and consents stay with the Program.
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-[11px] font-semibold text-slate-700">
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                  {enabled ? "Offered" : "Not offered"}
                </label>
              </div>

              {!enabled && (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800">
                  This Program stays attached but is never offered to patients. Its rules below are kept
                  so you can re-enable it later.
                </p>
              )}

              <div className="mt-5">
                <RuleGroupEditor
                  group={rule}
                  path={[]}
                  depth={0}
                  sources={sources}
                  issuesByPath={issuesByPath}
                  onChange={setRule}
                  root={rule}
                />
              </div>

              {conditionCount === 0 && (
                <p className="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-[11px] italic text-slate-500">
                  No conditions — this Program is always offered. Add a condition to limit when it appears.
                </p>
              )}

              <div className="mt-5 rounded-md border border-slate-200 p-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Rule summary</div>
                <p className="mt-1.5 text-[11px] text-slate-700">{summary}</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {conditionCount === 0
                    ? "Always offered"
                    : `Conditional · ${conditionCount} ${conditionCount === 1 ? "rule" : "rules"}`}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="items-center border-t border-slate-200 px-5 py-3">
          <div className="mr-auto flex items-center gap-1.5 text-xs text-slate-500">
            {hasIssues ? (
              <>
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                {issues.length} {issues.length === 1 ? "issue" : "issues"} to resolve before saving.
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Rules are valid.
              </>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={saving || hasIssues || !program} onClick={handleSave}>
            {saving ? "Saving…" : "Save matching rules"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RuleGroupEditor({
  group,
  path,
  depth,
  sources,
  issuesByPath,
  onChange,
  root,
}: {
  group: ProgramMatchingGroup;
  path: RulePath;
  depth: number;
  sources: MatchingSourceField[];
  issuesByPath: Map<string, MatchingIssue[]>;
  onChange: (next: ProgramMatchingGroup) => void;
  root: ProgramMatchingGroup;
}) {
  const isRoot = path.length === 0;
  const helper = group.combinator === "and"
    ? "All conditions in this group must match."
    : "Any condition in this group can match.";

  return (
    <div
      className={cn(
        "rounded-md border p-3",
        depth === 0 ? "bg-slate-50" : "bg-white",
        depth === 0
          ? "border-slate-200"
          : group.combinator === "and"
            ? "border-blue-200"
            : "border-pink-200",
        !isRoot && "mt-2.5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
          {isRoot ? "Matching rule" : "Condition group"}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={group.combinator}
            onValueChange={(value: "and" | "or") =>
              onChange(updateNode(root, path, { combinator: value }))
            }
          >
            <SelectTrigger className="h-7 w-[110px] text-[11px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="and">AND group</SelectItem>
              <SelectItem value="or">OR group</SelectItem>
            </SelectContent>
          </Select>
          {!isRoot && (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600"
              onClick={() => onChange(removeNode(root, path))}
            >
              <Trash2 className="h-3 w-3" /> Remove group
            </button>
          )}
        </div>
      </div>
      <div className="mt-1.5 text-[11px] italic text-slate-500">{helper}</div>

      <div className="mt-2">
        {group.rules.map((child, index) => {
          const childPath = [...path, index];
          return isGroup(child) ? (
            <RuleGroupEditor
              key={pathKey(childPath)}
              group={child}
              path={childPath}
              depth={depth + 1}
              sources={sources}
              issuesByPath={issuesByPath}
              onChange={onChange}
              root={root}
            />
          ) : (
            <ConditionEditor
              key={pathKey(childPath)}
              condition={child}
              path={childPath}
              sources={sources}
              issues={issuesByPath.get(pathKey(childPath)) || []}
              onChange={onChange}
              root={root}
            />
          );
        })}
      </div>

      <div className="mt-2 flex gap-1.5 border-t border-dashed border-slate-200 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[11px]"
          onClick={() => onChange(addCondition(root, path))}
        >
          <Plus className="mr-1 h-3 w-3" /> Add condition
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[11px]"
          onClick={() => onChange(addSubgroup(root, path))}
        >
          <Layers className="mr-1 h-3 w-3" /> Add subgroup
        </Button>
      </div>
    </div>
  );
}

function ConditionEditor({
  condition,
  path,
  sources,
  issues,
  onChange,
  root,
}: {
  condition: ProgramMatchingCondition;
  path: RulePath;
  sources: MatchingSourceField[];
  issues: MatchingIssue[];
  onChange: (next: ProgramMatchingGroup) => void;
  root: ProgramMatchingGroup;
}) {
  const source = sources.find((item) => item.id === condition.field);
  const operators = operatorsForKind(source?.kind);
  const grouped = useMemo(() => {
    const map = new Map<string, MatchingSourceField[]>();
    sources.forEach((item) => {
      map.set(item.group, [...(map.get(item.group) || []), item]);
    });
    return [...map.entries()];
  }, [sources]);

  const patch = (values: Partial<ProgramMatchingCondition>) =>
    onChange(updateNode(root, path, values));

  const showsChoices = (source?.kind === "single" || source?.kind === "multiple")
    && (source?.choices?.length || 0) > 0
    && condition.operator !== "in"
    && condition.operator !== "not_in";

  return (
    <div className="mb-2 rounded-md border border-slate-200 bg-white p-2.5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Condition</div>
        <button
          type="button"
          className="text-slate-400 hover:text-rose-600"
          title="Remove condition"
          onClick={() => onChange(removeNode(root, path))}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-[1.4fr_0.9fr_1fr] gap-2">
        <div>
          <label className="mb-1 block text-[10.5px] font-medium text-slate-500">Field</label>
          <Select
            value={condition.field}
            onValueChange={(field) => {
              const next = sources.find((item) => item.id === field);
              const allowed = operatorsForKind(next?.kind).map((item) => item.value);
              // Changing the field resets the answer, and the operator too when
              // it cannot apply to the new field type.
              patch({
                field,
                value: "",
                value2: undefined,
                operator: allowed.includes(condition.operator) ? condition.operator : allowed[0],
              });
            }}
          >
            <SelectTrigger className="h-8 text-[11px]">
              <SelectValue placeholder="Select a field" />
            </SelectTrigger>
            <SelectContent>
              {grouped.length === 0 ? (
                <SelectItem value="__none" disabled>No inputs available before Stage 2</SelectItem>
              ) : (
                grouped.map(([groupName, items]) => (
                  <SelectGroup key={groupName}>
                    <SelectLabel className="text-[10px] uppercase tracking-wider">{groupName}</SelectLabel>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-[10.5px] font-medium text-slate-500">Operator</label>
          <Select
            value={condition.operator}
            onValueChange={(operator: ProgramMatchingOperator) => patch({ operator })}
          >
            <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {operators.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-[10.5px] font-medium text-slate-500">Value</label>
          {!operatorNeedsValue(condition.operator) ? (
            <div className="px-2 py-1.5 text-[11px] italic text-slate-400">— No value needed —</div>
          ) : operatorNeedsSecondValue(condition.operator) ? (
            <div className="flex flex-col gap-1.5">
              <Input
                className="h-8 text-[11px]"
                type="number"
                placeholder="Min"
                value={String(condition.value ?? "")}
                onChange={(event) => patch({ value: event.target.value })}
              />
              <Input
                className="h-8 text-[11px]"
                type="number"
                placeholder="Max"
                value={String(condition.value2 ?? "")}
                onChange={(event) => patch({ value2: event.target.value })}
              />
            </div>
          ) : showsChoices ? (
            <Select value={String(condition.value ?? "")} onValueChange={(value) => patch({ value })}>
              <SelectTrigger className="h-8 text-[11px]">
                <SelectValue placeholder="Select an answer" />
              </SelectTrigger>
              <SelectContent>
                {(source?.choices || []).map((choice) => (
                  <SelectItem key={choice} value={choice}>{choice}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : source?.kind === "number" ? (
            <Input
              className="h-8 text-[11px]"
              type="number"
              placeholder="e.g. 27"
              value={String(condition.value ?? "")}
              onChange={(event) => patch({ value: event.target.value })}
            />
          ) : (
            <Input
              className="h-8 text-[11px]"
              placeholder={source ? "Enter a value" : "Select a field first"}
              disabled={!source}
              value={String(condition.value ?? "")}
              onChange={(event) => patch({ value: event.target.value })}
            />
          )}
        </div>
      </div>

      {issues.length > 0 && (
        <ul className="mt-2 list-disc pl-4 text-[10px] text-rose-600">
          {issues.map((issue, index) => (
            <li key={`${pathKey(issue.path)}-${index}`}>{issue.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
