import { useRef, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectGroup,
  SelectLabel,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { normalizeChoiceDisplay } from "@/utils/choiceValue";
import {
  visibilityIssueId,
  visibilityPathLabel,
  normalizeVisibilityQuestionId,
  type VisibilityValidationIssue,
} from "./visibilityRuleValidation";

export const DERIVED_BMI_ID = "__derived_bmi__";

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
  validationIssues?: VisibilityValidationIssue[];
}

const NUMERIC_OPERATORS = new Set<VisibilityConditionOperator>(["gt", "gte", "lt", "lte", "between"]);

const CONDITION_OPERATORS: Array<{
  value: VisibilityConditionOperator;
  label: string;
}> = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Does not equal" },
  { value: "in", label: "Is one of" },
  { value: "not_in", label: "Is not one of" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does not contain" },
  { value: "gt", label: "Greater than" },
  { value: "gte", label: "Greater or equal" },
  { value: "lt", label: "Less than" },
  { value: "lte", label: "Less or equal" },
  { value: "between", label: "In between" },
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
  updater: (node: VisibilityCondition | VisibilityGroup) => VisibilityCondition | VisibilityGroup
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
  const questionId = typeof question.id === "string" ? question.id : "";
  const isProfileSource = questionId.startsWith("__patient_profile_");
  return isProfileSource || !question.order_index
    ? question.question_text
    : `${question.order_index}. ${question.question_text}`;
}

const isPatientProfileQuestion = (question: QuestionOption): boolean =>
  typeof question.id === "string" && question.id.startsWith("__patient_profile_");

function ConditionEditor({
  node,
  path,
  questions,
  onChange,
  onRemove,
  validationIssues,
}: {
  node: VisibilityCondition;
  path: number[];
  questions: QuestionOption[];
  onChange: (path: number[], updater: (node: VisibilityCondition) => VisibilityCondition) => void;
  onRemove: (path: number[]) => void;
  validationIssues: VisibilityValidationIssue[];
}) {
  const questionId = normalizeVisibilityQuestionId(node);
  const selectedQuestion = questions.find((question) => question.id === questionId);
  const isPatientProfileSource = questionId.startsWith("__patient_profile_");
  const choiceOptions = getQuestionChoices(selectedQuestion);
  const isMultiValue = ["in", "not_in"].includes(node.operator);
  const isBetween = node.operator === "between";
  const isNumericOp = NUMERIC_OPERATORS.has(node.operator);
  const valueText = Array.isArray(node.value) ? node.value.join(", ") : node.value;

  const betweenValues = Array.isArray(node.value) && node.value.length === 2
    ? node.value
    : ["", ""];
  const questionIssue = validationIssues.find((issue) => issue.field === "question");
  const valueIssue = validationIssues.find((issue) => issue.field === "value");
  const hasIssue = Boolean(questionIssue || valueIssue);

  const updateValue = (raw: string) => {
    const nextValue = isMultiValue
      ? raw.split(",").map((item) => item.trim()).filter(Boolean)
      : raw;
    onChange(path, (current) => ({ ...current, value: nextValue }));
  };

  return (
    <div
      className={`space-y-3 rounded-lg border bg-background p-3 ${hasIssue ? "border-red-400 ring-1 ring-red-100" : ""}`}
      data-visibility-condition-path={path.join(".")}
    >
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Condition {visibilityPathLabel(path)}
        </Label>
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(path)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs">Question</Label>
          <Select
            value={questionId}
            onValueChange={(questionId) => {
              const isBmi = questionId === DERIVED_BMI_ID;
              onChange(path, (current) => ({
                ...current,
                question_id: questionId,
                question_type: isBmi ? "bmi" : undefined,
                value: "",
              }));
            }}
          >
            <SelectTrigger
              className={questionIssue ? "min-w-0 border-red-500 text-left" : "min-w-0 text-left"}
              data-visibility-field="question"
              aria-invalid={Boolean(questionIssue)}
              aria-describedby={questionIssue ? visibilityIssueId(questionIssue) : undefined}
            >
              <SelectValue placeholder="Select question" />
            </SelectTrigger>
            <SelectContent className="w-[min(32rem,calc(100vw-2rem))]">
              <SelectGroup>
                <SelectLabel>Earlier questions</SelectLabel>
                {questions.filter((question) => !isPatientProfileQuestion(question)).map((question) => (
                  <SelectItem
                    key={question.id}
                    value={question.id}
                    className="whitespace-normal py-2 leading-5"
                  >
                    {formatQuestionLabel(question)}
                  </SelectItem>
                ))}
              </SelectGroup>
              {questions.some(isPatientProfileQuestion) && (
                <SelectGroup>
                  <SelectLabel>Patient profile</SelectLabel>
                  {questions.filter(isPatientProfileQuestion).map((question) => (
                    <SelectItem
                      key={question.id}
                      value={question.id}
                      className="whitespace-normal py-2 leading-5"
                    >
                      {formatQuestionLabel(question)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
          {questionIssue && (
            <p id={visibilityIssueId(questionIssue)} className="text-xs font-medium text-red-600">
              {questionIssue.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Field (optional)</Label>
          {isPatientProfileSource ? (
            <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
              Uses the selected profile field
            </div>
          ) : (
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
          )}
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
                value: ["in", "not_in"].includes(operator)
                  ? Array.isArray(current.value)
                    ? current.value
                    : current.value
                    ? [String(current.value)]
                    : []
                  : operator === "between"
                  ? ["", ""]
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
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={betweenValues[0]}
                onChange={(event) =>
                  onChange(path, (current) => ({
                    ...current,
                    value: [event.target.value, betweenValues[1]],
                  }))
                }
                placeholder="Min"
                className={valueIssue ? "border-red-500" : undefined}
                data-visibility-field="value"
                aria-invalid={Boolean(valueIssue)}
                aria-describedby={valueIssue ? visibilityIssueId(valueIssue) : undefined}
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="number"
                value={betweenValues[1]}
                onChange={(event) =>
                  onChange(path, (current) => ({
                    ...current,
                    value: [betweenValues[0], event.target.value],
                  }))
                }
                placeholder="Max"
                className={valueIssue ? "border-red-500" : undefined}
                data-visibility-field="value"
                aria-invalid={Boolean(valueIssue)}
                aria-describedby={valueIssue ? visibilityIssueId(valueIssue) : undefined}
              />
            </div>
          ) : isNumericOp ? (
            <Input
              type="number"
              value={valueText}
              onChange={(event) => updateValue(event.target.value)}
              placeholder="Numeric value"
              className={valueIssue ? "border-red-500" : undefined}
              data-visibility-field="value"
              aria-invalid={Boolean(valueIssue)}
              aria-describedby={valueIssue ? visibilityIssueId(valueIssue) : undefined}
            />
          ) : choiceOptions.length > 0 && !isMultiValue ? (
            <Select value={valueText} onValueChange={updateValue}>
              <SelectTrigger
                className={valueIssue ? "border-red-500" : undefined}
                data-visibility-field="value"
                aria-invalid={Boolean(valueIssue)}
                aria-describedby={valueIssue ? visibilityIssueId(valueIssue) : undefined}
              >
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
              className={valueIssue ? "border-red-500" : undefined}
              data-visibility-field="value"
              aria-invalid={Boolean(valueIssue)}
              aria-describedby={valueIssue ? visibilityIssueId(valueIssue) : undefined}
            />
          )}
          {valueIssue && (
            <p id={visibilityIssueId(valueIssue)} className="text-xs font-medium text-red-600">
              {valueIssue.message}
            </p>
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
  validationIssues,
}: {
  root: VisibilityGroup;
  node: VisibilityGroup;
  path: number[];
  questions: QuestionOption[];
  isRoot?: boolean;
  onChange: (next: VisibilityGroup) => void;
  validationIssues: VisibilityValidationIssue[];
}) {
  const appendLockRef = useRef<number>(0);
  const groupIssue = validationIssues.find(
    (issue) => issue.field === "group" && issue.path.join(".") === path.join("."),
  );

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
    <div
      className={`space-y-3 rounded-lg border bg-muted/20 p-3 ${groupIssue ? "border-red-400 ring-1 ring-red-100" : ""}`}
      data-visibility-group-path={path.join(".")}
    >
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
        {groupIssue && (
          <p id={visibilityIssueId(groupIssue)} className="text-xs font-medium text-red-600">
            {groupIssue.message}
          </p>
        )}
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
                  validationIssues={validationIssues}
                />
                <div className="mt-2 flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => onChange(removeNodeAtPath(root, childPath))}>
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
              validationIssues={validationIssues.filter(
                (issue) => issue.path.join(".") === childPath.join("."),
              )}
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
  validationIssues = [],
}: VisibilityRuleBuilderProps) {
  return (
    <GroupEditor
      root={value}
      node={value}
      path={[]}
      questions={questions}
      isRoot
      onChange={onChange}
      validationIssues={validationIssues}
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
