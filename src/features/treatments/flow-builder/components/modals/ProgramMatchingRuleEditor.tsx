import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  Grid2X2,
  Layers,
  LockKeyhole,
  Play,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  onOpenPreview?: () => void;
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
  onOpenPreview,
}: Props) {
  const program = programs.find((item) => item.id === programId) || null;
  const storedConfig = programId ? customProgram.programMatchingRules?.[programId] : undefined;

  const [rule, setRule] = useState<ProgramMatchingGroup>(emptyGroup());
  const [enabled, setEnabled] = useState(true);
  const [search, setSearch] = useState("");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [dirty, setDirty] = useState(false);
  const changeRevision = useRef(0);

  useEffect(() => {
    if (!open || !programId) return;
    setRule(normalizeRule(storedConfig?.rule));
    setEnabled(storedConfig?.enabled !== false);
    setSearch("");
    setDirty(false);
    setSaveState("saved");
    changeRevision.current = 0;
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

  const persist = useCallback(async () => {
    if (!programId) return;
    const savingRevision = changeRevision.current;
    setSaveState("saving");
    try {
      const next: Record<string, ProgramMatchingConfig> = {
        ...(customProgram.programMatchingRules || {}),
        [programId]: { enabled, rule: serializeRule(rule) },
      };
      await onSave(next);
      if (savingRevision === changeRevision.current) {
        setDirty(false);
        setSaveState("saved");
      }
    } catch (error) {
      if (savingRevision === changeRevision.current) setSaveState("error");
      throw error;
    }
  }, [customProgram.programMatchingRules, enabled, onSave, programId, rule]);

  useEffect(() => {
    if (!open || !dirty || hasIssues) return;
    const timeout = window.setTimeout(() => {
      void persist().catch(() => undefined);
    }, 650);
    return () => window.clearTimeout(timeout);
  }, [dirty, hasIssues, open, persist]);

  const changeRule = (next: ProgramMatchingGroup) => {
    changeRevision.current += 1;
    setRule(next);
    setDirty(true);
  };

  const changeEnabled = (next: boolean) => {
    changeRevision.current += 1;
    setEnabled(next);
    setDirty(true);
  };

  const closeEditor = useCallback(async () => {
    if (dirty && hasIssues) return;
    if (dirty && !hasIssues) {
      try {
        await persist();
      } catch {
        return;
      }
    }
    onOpenChange(false);
  }, [dirty, hasIssues, onOpenChange, persist]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") void closeEditor();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
    // Closing must use the current dirty rule tree, not the values captured
    // when the workspace first opened.
  }, [closeEditor, open]);

  const visibleFlowItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return customProgram.flowItems.filter((item) => !needle || item.title.toLowerCase().includes(needle));
  }, [customProgram.flowItems, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/55 p-3" role="dialog" aria-modal="true" aria-label={`Program visibility rules — ${program?.name || "Program"}`}>
      <div className="mx-auto flex h-full max-h-[920px] w-full max-w-[1500px] flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-5">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => void closeEditor()}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-slate-900">{customProgram.name}</h2>
            <p className="truncate text-[11px] text-slate-500">Eligibility · {program?.name || "Program"}</p>
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2 text-xs" onClick={onOpenPreview} disabled={!onOpenPreview}>
            <Play className="h-3.5 w-3.5" /> Test Patient Flow
          </Button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(480px,1fr)_380px] max-lg:grid-cols-[240px_minmax(440px,1fr)] max-md:block max-md:overflow-auto">
          <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-slate-50 max-md:min-h-[360px]">
            <div className="border-b border-slate-200 px-4 py-4">
              <div className="mb-3 text-xs font-semibold text-slate-900">Flow</div>
              <label className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-slate-400">
                <Search className="h-3.5 w-3.5" />
                <input className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the flow..." />
              </label>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              {visibleFlowItems.map((item, index) => (
                <FlowSidebarItem key={item.id} item={item} index={customProgram.flowItems.indexOf(item) + 1 || index + 1} active={item.kind === "program" && item.sourceId === programId} />
              ))}
            </div>
            <div className="border-t border-slate-200 p-3">
              <Button variant="outline" className="h-9 w-full border-dashed text-xs" disabled>
                <Plus className="mr-1 h-3.5 w-3.5" /> New Question
              </Button>
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto bg-white px-7 py-5 max-md:min-h-[620px]">
            {!program ? (
              <p className="text-sm text-slate-500">Select a Program row to configure its visibility rules.</p>
            ) : (
              <div className="mx-auto max-w-3xl">
                <SectionHeading icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="teal">Program · {program.name}</SectionHeading>
                <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-xs leading-5 text-slate-700">
                      This card represents the <strong>{program.name}</strong> program in the patient flow. The clinical questions, disqualifiers, and products live in the module itself — edit those by opening the module directly.
                    </p>
                    <label className="flex shrink-0 items-center gap-2 text-[11px] font-semibold text-slate-700">
                      <Switch checked={enabled} onCheckedChange={changeEnabled} />
                      {enabled ? "Offered" : "Not offered"}
                    </label>
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-3 h-8 bg-white text-xs">
                    <Link to={`/dashboard/treatments/programs/${program.id}`}><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open program</Link>
                  </Button>
                </div>

                <div className="mt-7">
                  <SectionHeading icon={<Layers className="h-3.5 w-3.5" />} tone="amber">Visibility Rules</SectionHeading>
                  <p className="mt-4 text-xs leading-5 text-slate-600">
                    Show this program in the patient flow only when these conditions match — based on answers to earlier custom questions and shared fields. Leave empty to always show it.
                  </p>

                  {!enabled && (
                    <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      This Program stays attached but is not offered. Its authored rules are preserved for when it is re-enabled.
                    </p>
                  )}

                  {conditionCount === 0 ? (
                    <p className="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[11px] italic text-slate-400">
                      No visibility rules — this Program will always be visible. Add a rule to limit when it shows.
                    </p>
                  ) : (
                    <div className="mt-4">
                      <RuleGroupEditor group={rule} path={[]} depth={0} sources={sources} issuesByPath={issuesByPath} onChange={changeRule} root={rule} />
                    </div>
                  )}

                  {conditionCount === 0 && (
                    <Button variant="outline" className="mt-2 h-9 w-full border-dashed text-xs" onClick={() => changeRule(addCondition(rule, []))}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add visibility rule
                    </Button>
                  )}

                  <div className={cn("mt-3 flex items-center gap-2 rounded-md px-3 py-2 text-[11px]", saveState === "error" ? "bg-rose-50 text-rose-700" : hasIssues ? "bg-amber-50 text-amber-800" : "bg-slate-50 text-slate-500")}>
                    {saveState === "error" ? <CircleHelp className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5 text-emerald-500" />}
                    {saveState === "saving" ? "Saving changes…" : saveState === "error" ? "Changes could not be saved. Correct the issue or try again." : hasIssues ? `${issues.length} rule ${issues.length === 1 ? "issue" : "issues"} must be resolved before saving.` : "Changes save automatically"}
                  </div>
                </div>
              </div>
            )}
          </main>

          <aside className="flex min-h-0 flex-col bg-slate-950 px-4 py-4 text-white max-lg:hidden">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Patient Preview</span>
              <span className="font-normal normal-case text-slate-400">Updates live</span>
            </div>
            <div className="mt-5 overflow-hidden rounded-md bg-slate-100 shadow-xl">
              <div className="flex h-10 items-center gap-1.5 border-b border-slate-200 px-3">
                <span className="h-2 w-2 rounded-full bg-rose-500" /><span className="h-2 w-2 rounded-full bg-amber-400" /><span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="ml-3 rounded bg-white px-3 py-1 font-mono text-[9px] text-slate-400">welliemd.com/intake</span>
              </div>
              <div className="bg-white px-7 py-12 text-center text-slate-900">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-teal-700">
                  <CheckCircle2 className="h-3 w-3" /> Treatment match
                </span>
                <h3 className="mt-4 text-base font-bold">{program?.name || "Program"}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {!enabled ? "Will not be offered to patients in this flow." : conditionCount === 0 ? "Will always be offered to the patient as a potential treatment." : `Will be offered only when ${conditionCount} visibility ${conditionCount === 1 ? "rule passes" : "rules pass"}.`}
                </p>
              </div>
            </div>
            <p className="mt-4 px-3 text-center text-[11px] italic leading-5 text-slate-400">
              This preview reflects how visibility rules will gate this eligibility — open the full <strong>Preview</strong> on the plan builder to test with sample patient answers.
            </p>
            {conditionCount > 0 && <p className="mt-4 rounded-md border border-slate-700 bg-slate-900 p-3 text-[11px] leading-5 text-slate-300">{summary}</p>}
          </aside>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ icon, tone, children }: { icon: React.ReactNode; tone: "teal" | "amber"; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold uppercase tracking-wide text-slate-900">
      <span className={cn("grid h-6 w-6 place-items-center rounded-md", tone === "teal" ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-800")}>{icon}</span>
      {children}
    </div>
  );
}

function FlowSidebarItem({ item, index, active }: { item: CustomProgram["flowItems"][number]; index: number; active: boolean }) {
  const icon = item.kind === "authentication" ? <LockKeyhole className="h-3.5 w-3.5" />
    : item.kind === "routing_question" ? <CircleHelp className="h-3.5 w-3.5" />
      : item.kind === "section" || item.kind === "section_field" ? <Grid2X2 className="h-3.5 w-3.5" />
        : item.kind === "program" ? <ShieldCheck className="h-3.5 w-3.5" />
          : item.kind === "checkout" ? <ShoppingCart className="h-3.5 w-3.5" />
            : <CheckCircle2 className="h-3.5 w-3.5" />;
  return (
    <div className={cn("grid grid-cols-[22px_24px_minmax(0,1fr)] items-start gap-1.5 rounded-md px-2 py-2", active ? "bg-slate-200" : "text-slate-500")}>
      <span className="pt-0.5 text-right text-[10px] text-slate-400">{index}</span>
      <span className={cn("grid h-6 w-6 place-items-center rounded-md", item.kind === "program" ? "bg-teal-50 text-teal-700" : item.kind === "routing_question" ? "bg-indigo-50 text-indigo-700" : "bg-white text-slate-500")}>{icon}</span>
      <span className="min-w-0">
        <span className={cn("block line-clamp-2 text-[11px] leading-4", active && "font-semibold text-slate-900")}>{item.title}</span>
        <span className="block text-[9px] uppercase tracking-wide text-slate-400">{item.kind.replaceAll("_", " ")}</span>
      </span>
    </div>
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
