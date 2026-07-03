import { useRef, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { normalizeChoiceDisplay } from "@/utils/choiceValue";

export type VisibilityConditionOperator =
  | "equals"
  | "not_equals"
  | "in"
  | "not_in"
  | "contains"
  | "not_contains"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between";

export interface VisibilityCondition {
  type: "condition";
  question_id: string;
  question_type?: string;
  operator: VisibilityConditionOperator;
  value: string | string[];
  field?: string;
}

export interface VisibilityGroup {
  type: "group";
  operator: "AND" | "OR";
  children: Array<VisibilityCondition | VisibilityGroup>;
}

interface QuestionOption {
  id: string;
  question_text: string;
  order_index?: number;
  answer_choices?: Array<string | Record<string, unknown>>;
}

interface VisibilityRuleBuilderProps {
  value: VisibilityGroup;
  onChange: (next: VisibilityGroup) => void;
  questions: QuestionOption[];
}

export const NUMERIC_OPERATORS = new Set(["gt", "gte", "lt", "lte", "between"]);

const CONDITION_OPERATORS: Array<{
  value: VisibilityConditionOperator;
  label: string;
}> = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Does not equal" },
  { value: "gte", label: "Greater than or equal (>=)" },
  { value: "gt", label: "Greater than (>)" },
  { value: "lte", label: "Less than or equal (<=)" },
  { value: "lt", label: "Less than (<)" },
  { value: "in", label: "Is one of" },
  { value: "not_in", label: "Is not one of" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does not contain" },
  { value: "between", label: "In Between" },
];

function defaultCondition(questionId = ""): VisibilityCondition {
  return {
    type: "condition",
    question_id: questionId,
    operator: "equals",
    value: "",
  };
}

function cloneNode<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function updateNodeAtPath(
  root: VisibilityGroup,
  path: number[],
  updater: (
    node: VisibilityCondition | VisibilityGroup
  ) => VisibilityCondition | VisibilityGroup
): VisibilityGroup {
  const next = cloneNode(root);
  let current: VisibilityGroup = next;

  for (let index = 0; index < path.length - 1; index += 1) {
    current = current.children[path[index]] as VisibilityGroup;
  }

  const targetIndex = path[path.length - 1];
  current.children[targetIndex] = updater(current.children[targetIndex]);
  return next;
}

function updateGroupAtPath(
  root: VisibilityGroup,
  path: number[],
  updater: (node: VisibilityGroup) => VisibilityGroup
): VisibilityGroup {
  if (path.length === 0) {
    return updater(cloneNode(root));
  }
  return updateNodeAtPath(root, path, (node) => updater(node as VisibilityGroup));
}

function removeNodeAtPath(root: VisibilityGroup, path: number[]): VisibilityGroup {
  const next = cloneNode(root);
  if (path.length === 0) {
    return next;
  }

  let current: VisibilityGroup = next;
  for (let index = 0; index < path.length - 1; index += 1) {
    current = current.children[path[index]] as VisibilityGroup;
  }

  current.children.splice(path[path.length - 1], 1);
  return next;
}

function appendChildAtPath(
  root: VisibilityGroup,
  path: number[],
  child: VisibilityCondition | VisibilityGroup
): VisibilityGroup {
  const next = cloneNode(root);
  let current: VisibilityGroup = next;

  for (const index of path) {
    current = current.children[index] as VisibilityGroup;
  }

  current.children.push(child);
  return next;
}

function getQuestionChoices(question: QuestionOption | undefined): string[] {
  if (!question?.answer_choices) return [];
  return question.answer_choices.map((choice) => normalizeChoiceDisplay(choice));
}

function formatQuestionLabel(question: QuestionOption): string {
  return question.order_index
    ? `${question.order_index}. ${question.question_text}`
    : question.question_text;
}

function ConditionEditor({
  node,
  path,
  questions,
  onChange,
  onRemove,
}: {
  node: VisibilityCondition;
  path: number[];
  questions: QuestionOption[];
  onChange: (
    path: number[],
    updater: (node: VisibilityCondition) => VisibilityCondition
  ) => void;
  onRemove: (path: number[]) => void;
}) {
  const selectedQuestion = questions.find((question) => question.id === node.question_id);
  const choiceOptions = getQuestionChoices(selectedQuestion);
  const isMultiValue = ["in", "not_in", "between"].includes(node.operator);
  const isBetween = node.operator === "between";
  const valueText = Array.isArray(node.value) ? node.value.join(", ") : node.value;

  const updateValue = (raw: string) => {
    const nextValue = isMultiValue
      ? raw.split(",").map((item) => item.trim()).filter(Boolean)
      : raw;
    onChange(path, (current) => ({ ...current, value: nextValue }));
  };

  const updateBetweenValue = (index: 0 | 1, raw: string) => {
    const arr = Array.isArray(node.value) ? [...node.value] : ["", ""];
    arr[index] = raw;
    onChange(path, (current) => ({ ...current, value: arr }));
  };

  return (
    <div className="space-y-3 rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Condition
        </Label>
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(path)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs">Question</Label>
          <Select
            value={node.question_id}
            onValueChange={(questionId) =>
              onChange(path, (current) => ({
                ...current,
                question_id: questionId,
                value: "",
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select question" />
            </SelectTrigger>
            <SelectContent>
              {questions.map((question) => (
                <SelectItem key={question.id} value={question.id}>
                  {formatQuestionLabel(question)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Field (optional)</Label>
          <Input
            value={node.field || ""}
            onChange={(event) =>
              onChange(path, (current) => ({
                ...current,
                field: event.target.value || undefined,
              }))
            }
            placeholder="medication.code or dose.dose_mapping_id"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs">Operator</Label>
          <Select
            value={node.operator}
            onValueChange={(operator: VisibilityConditionOperator) =>
              onChange(path, (current) => ({
                ...current,
                operator,
                value: operator === "between"
                  ? Array.isArray(current.value) && current.value.length === 2
                    ? current.value
                    : [String(current.value ?? ""), ""]
                  : ["in", "not_in"].includes(operator)
                  ? Array.isArray(current.value)
                    ? current.value
                    : current.value
                    ? [String(current.value)]
                    : []
                  : Array.isArray(current.value)
                  ? current.value[0] || ""
                  : current.value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_OPERATORS.map((operator) => (
                <SelectItem key={operator.value} value={operator.value}>
                  {operator.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Value</Label>
          {isBetween ? (
            <div className="flex flex-col gap-2">
              <Input
                type="number"
                value={Array.isArray(node.value) ? node.value[0] ?? "" : ""}
                onChange={(event) => updateBetweenValue(0, event.target.value)}
                placeholder="Min value"
              />
              <Input
                type="number"
                value={Array.isArray(node.value) ? node.value[1] ?? "" : ""}
                onChange={(event) => updateBetweenValue(1, event.target.value)}
                placeholder="Max value"
              />
            </div>
          ) : choiceOptions.length > 0 && !isMultiValue ? (
            <Select value={valueText} onValueChange={updateValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select answer" />
              </SelectTrigger>
              <SelectContent>
                {choiceOptions.map((choice) => (
                  <SelectItem key={choice} value={choice}>
                    {choice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={valueText}
              onChange={(event) => updateValue(event.target.value)}
              placeholder={isMultiValue ? "value1, value2" : "Trigger value"}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function GroupEditor({
  root,
  node,
  path,
  questions,
  isRoot = false,
  onChange,
}: {
  root: VisibilityGroup;
  node: VisibilityGroup;
  path: number[];
  questions: QuestionOption[];
  isRoot?: boolean;
  onChange: (next: VisibilityGroup) => void;
}) {
  const appendLockRef = useRef<number>(0);

  const guardAppend = (
    event: MouseEvent<HTMLButtonElement>,
    child: VisibilityCondition | VisibilityGroup
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const now = Date.now();
    if (now - appendLockRef.current < 250) {
      return;
    }
    appendLockRef.current = now;
    onChange(appendChildAtPath(root, path, child));
  };

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            {isRoot ? "Visibility Rule" : "Condition Group"}
          </Label>
          <p className="text-xs text-muted-foreground">
            {node.operator === "AND"
              ? "All children in this group must match."
              : "Any child in this group can match."}
          </p>
        </div>
        <Select
          value={node.operator}
          onValueChange={(operator: "AND" | "OR") =>
            onChange(
              updateGroupAtPath(root, path, (current) => ({
                ...current,
                operator,
              }))
            )
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">AND group</SelectItem>
            <SelectItem value="OR">OR group</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {node.children.map((child, index) => {
          const childPath = [...path, index];
          if (child.type === "group") {
            return (
              <div key={childPath.join("-")} className="pl-3">
                <GroupEditor
                  root={root}
                  node={child}
                  path={childPath}
                  questions={questions}
                  onChange={onChange}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange(removeNodeAtPath(root, childPath))}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove group
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <ConditionEditor
              key={childPath.join("-")}
              node={child}
              path={childPath}
              questions={questions}
              onChange={(targetPath, updater) => {
                onChange(updateNodeAtPath(root, targetPath, updater));
              }}
              onRemove={(targetPath) => {
                onChange(removeNodeAtPath(root, targetPath));
              }}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 border-t pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(event) => guardAppend(event, defaultCondition())}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add condition
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(event) =>
            guardAppend(event, {
              type: "group",
              operator: "AND",
              children: [defaultCondition()],
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add subgroup
        </Button>
      </div>
    </div>
  );
}

export function VisibilityRuleBuilder({
  value,
  onChange,
  questions,
}: VisibilityRuleBuilderProps) {
  return (
    <GroupEditor
      root={value}
      node={value}
      path={[]}
      questions={questions}
      isRoot
      onChange={onChange}
    />
  );
}

export function createDefaultVisibilityGroup(): VisibilityGroup {
  return {
    type: "group",
    operator: "AND",
    children: [defaultCondition()],
  };
}
