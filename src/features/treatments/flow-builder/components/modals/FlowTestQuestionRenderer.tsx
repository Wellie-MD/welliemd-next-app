import { useId } from "react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { ProgramQuestion } from "@/features/treatments/types";

// ---------------------------------------------------------------------------
// DQ badge helper — inline to keep this file self-contained
// ---------------------------------------------------------------------------
function DqBadge() {
  return (
    <span className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-red-100 text-red-600">
      DQ
    </span>
  );
}

function getDqChoices(question: ProgramQuestion): string[] {
  if (question.dqChoices?.length) return question.dqChoices;
  if (question.flags?.includes("disqualifying") && question.kind === "single_choice") {
    return question.choices?.includes("Yes") ? ["Yes"] : [];
  }
  if (question.flags?.includes("disqualifying") && question.kind === "yes_no") {
    return ["Yes"];
  }
  return [];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface FlowTestQuestionRendererProps {
  question: ProgramQuestion;
  answer: string | string[] | undefined;
  onSingleChange: (questionId: string, value: string) => void;
  onMultiChange: (questionId: string, choice: string, checked: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function FlowTestQuestionRenderer({
  question,
  answer,
  onSingleChange,
  onMultiChange,
}: FlowTestQuestionRendererProps) {
  const uid = useId();
  const dqChoices = getDqChoices(question);
  const isDqQuestion =
    (question.flags?.includes("disqualifying") ?? false) ||
    dqChoices.length > 0;

  // ── single_choice / yes_no ────────────────────────────────────────────────
  if (question.kind === "single_choice" || question.kind === "yes_no") {
    const choices =
      question.choices ??
      (question.kind === "yes_no" ? ["Yes", "No"] : []);

    return (
      <div data-testid={`flow-test-question-${question.id}`}>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[13px] font-medium leading-snug text-slate-800">
            {question.text}
          </span>
          {isDqQuestion && <DqBadge />}
        </div>
        <RadioGroup
          value={(answer as string) ?? ""}
          onValueChange={(val) => onSingleChange(question.id, val)}
          className="gap-1.5"
          aria-label={question.text}
        >
          {choices.map((choice) => {
            const choiceIsDq = dqChoices.includes(choice);
            return (
              <label
                key={choice}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] text-slate-700 transition-colors",
                  answer === choice
                    ? "border-blue-400 bg-blue-50/50"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <RadioGroupItem
                  value={choice}
                  id={`${uid}-${question.id}-${choice}`}
                  className="shrink-0"
                />
                <span className="flex-1">{choice}</span>
                {choiceIsDq && <DqBadge />}
              </label>
            );
          })}
        </RadioGroup>
      </div>
    );
  }

  // ── multiple_choice ───────────────────────────────────────────────────────
  if (question.kind === "multiple_choice") {
    const choices = question.choices ?? [];
    const selected = (answer as string[] | undefined) ?? [];

    return (
      <div data-testid={`flow-test-question-${question.id}`}>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[13px] font-medium leading-snug text-slate-800">
            {question.text}
          </span>
          {isDqQuestion && <DqBadge />}
        </div>
        <div className="space-y-1.5" role="group" aria-label={question.text}>
          {choices.map((choice) => {
            const choiceIsDq = dqChoices.includes(choice);
            const isChecked = selected.includes(choice);
            return (
              <label
                key={choice}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] text-slate-700 transition-colors",
                  isChecked
                    ? "border-blue-400 bg-blue-50/50"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <Checkbox
                  id={`${uid}-${question.id}-${choice}`}
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    onMultiChange(question.id, choice, checked === true)
                  }
                  className="shrink-0"
                  aria-label={choice}
                />
                <span className="flex-1">{choice}</span>
                {choiceIsDq && <DqBadge />}
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  // ── number / text / textarea / date / email / phone / zip ─────────────────
  if (
    question.kind === "number" ||
    question.kind === "text" ||
    question.kind === "textarea" ||
    question.kind === "date" ||
    question.kind === "email" ||
    question.kind === "phone" ||
    question.kind === "zip"
  ) {
    const inputType =
      question.kind === "date"
        ? "date"
        : question.kind === "number"
        ? "number"
        : question.kind === "email"
        ? "email"
        : question.kind === "phone"
        ? "tel"
        : "text";

    const placeholder =
      question.kind === "number"
        ? "Number"
        : question.kind === "date"
        ? "MM/DD/YYYY"
        : question.kind === "zip"
        ? "ZIP code"
        : "";

    return (
      <div data-testid={`flow-test-question-${question.id}`}>
        <div className="mb-2 flex items-center gap-2">
          <label
            htmlFor={`${uid}-${question.id}`}
            className="text-[13px] font-medium leading-snug text-slate-800"
          >
            {question.text}
          </label>
          {isDqQuestion && <DqBadge />}
        </div>
        <Input
          id={`${uid}-${question.id}`}
          type={inputType}
          placeholder={placeholder}
          value={(answer as string) ?? ""}
          onChange={(e) => onSingleChange(question.id, e.target.value)}
          className="h-9 w-48 rounded-lg border-slate-200 text-sm"
        />
      </div>
    );
  }

  // ── consent ────────────────────────────────────────────────────────────────
  if (question.kind === "consent") {
    const isChecked = answer === "agreed";
    return (
      <div data-testid={`flow-test-question-${question.id}`}>
        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-3 text-[12px] text-slate-600 transition-colors hover:bg-slate-50">
          <Checkbox
            id={`${uid}-${question.id}-consent`}
            checked={isChecked}
            onCheckedChange={(checked) =>
              onSingleChange(question.id, checked === true ? "agreed" : "")
            }
            className="mt-0.5 shrink-0"
            aria-label={question.text}
          />
          <span>{question.consentText ?? question.text}</span>
        </label>
      </div>
    );
  }

  // ── checkout (preview placeholder) ────────────────────────────────────────
  if (question.kind === "checkout") {
    return (
      <div
        data-testid={`flow-test-question-${question.id}`}
        className="rounded-lg border border-dashed border-emerald-300 bg-emerald-50/40 px-3 py-2.5 text-[11.5px] font-semibold text-emerald-700"
      >
        Checkout — {question.text}
      </div>
    );
  }

  // ── fallback for unsupported kinds ─────────────────────────────────────────
  return (
    <div
      data-testid={`flow-test-question-${question.id}`}
      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] italic text-slate-400"
    >
      {question.text}
      <span className="ml-2 text-[10px] not-italic text-slate-300">
        ({question.kind})
      </span>
    </div>
  );
}
