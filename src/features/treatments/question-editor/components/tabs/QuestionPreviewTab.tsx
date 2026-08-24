import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { QuestionKind } from "@/features/treatments/types";
import type { ConsentPreviewOption } from "@/features/treatments/common/utils/consentPreview";
import { getCleanConsentBody } from "@/features/treatments/common/utils/consentPreview";

interface QuestionPreviewTabProps {
  text: string;
  kind: QuestionKind;
  choices: string[];
  dqChoices: string[];
  consentText: string;
  consentOptions?: ConsentPreviewOption[];
  isLibraryConsent?: boolean;
  order: number;
  totalQuestions: number;
}

export function QuestionPreviewTab({
  text,
  kind,
  choices,
  dqChoices,
  consentText,
  consentOptions = [],
  isLibraryConsent = false,
  order,
  totalQuestions,
}: QuestionPreviewTabProps) {
  const [singleValue, setSingleValue] = useState("");
  const [multiValues, setMultiValues] = useState<string[]>([]);
  const [freeTextValue, setFreeTextValue] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);

  const isChoiceType = kind === "single_choice" || kind === "multiple_choice";
  const isSingleChoice = kind === "single_choice" || kind === "yes_no";
  const isMultipleChoice = kind === "multiple_choice";

  const previewChoices = useMemo(() => {
    if (kind === "yes_no") return ["Yes", "No"];
    if (isChoiceType) return choices.length > 0 ? choices : ["Option 1", "Option 2"];
    return [];
  }, [choices, isChoiceType, kind]);

  useEffect(() => {
    setSingleValue("");
    setMultiValues([]);
    setFreeTextValue("");
    setConsentAccepted(false);
  }, [kind, text, choices]);

  const toggleMultiChoice = (choice: string) => {
    setMultiValues((current) => (
      current.includes(choice)
        ? current.filter((item) => item !== choice)
        : [...current, choice]
    ));
  };

  const renderChoiceList = () => (
    <div className="space-y-2">
      {previewChoices.map((choice) => {
        const isSelected = isMultipleChoice ? multiValues.includes(choice) : singleValue === choice;
        const isDisqualifying = dqChoices.includes(choice);

        return (
          <button
            key={choice}
            type="button"
            onClick={() => {
              if (isMultipleChoice) {
                toggleMultiChoice(choice);
                return;
              }
              setSingleValue(choice);
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
              isSelected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50",
              isDisqualifying && "border-red-200 bg-red-50 hover:bg-red-50"
            )}
            data-testid={`preview-choice-${choice.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center border bg-white",
                isMultipleChoice ? "rounded" : "rounded-full",
                isSelected ? "border-blue-500 text-blue-600" : "border-slate-300 text-transparent"
              )}
            >
              {isSelected ? <Check className="h-3 w-3" /> : null}
            </span>
            <span className={cn("text-sm font-medium", isDisqualifying ? "text-red-700" : "text-slate-700")}>
              {choice}
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderLibraryConsentOptions = () => (
    <div className="space-y-2">
      {consentOptions.map((option) => {
        const isSelected = singleValue === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setSingleValue(option.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
              isSelected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50",
              option.disqualifies && "border-red-200 bg-red-50 hover:bg-red-50",
            )}
            data-testid={`preview-consent-option-${option.id}`}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border bg-white",
                isSelected ? "border-blue-500 text-blue-600" : "border-slate-300 text-transparent",
              )}
            >
              {isSelected ? <Check className="h-3 w-3" /> : null}
            </span>
            <span className={cn("text-sm font-medium", option.disqualifies ? "text-red-700" : "text-slate-700")}>
              {option.text}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="bg-[#1c2333] h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">Patient Preview</span>
        </div>
        <span className="text-[10px] text-slate-400">Updates live</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
          <div className="flex shrink-0 items-center border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <div className="mr-4 flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex flex-1 justify-center">
              <div className="rounded bg-slate-100/80 px-4 py-1 text-[10px] font-medium text-slate-400">
                Tenant questionnaire preview
              </div>
            </div>
            <div className="w-[42px]" />
          </div>

          <div className="p-6">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Question {order} of {totalQuestions}
            </div>

            <h2 className="mb-6 text-lg font-bold leading-snug text-slate-900">
              {text || "Enter question text..."}
            </h2>

            {kind === "text" ? (
              <Input
                value={freeTextValue}
                onChange={(event) => setFreeTextValue(event.target.value)}
                placeholder="Enter your answer"
                className="h-10 bg-slate-50 text-sm"
                data-testid="preview-text-input"
              />
            ) : kind === "textarea" ? (
              <textarea
                value={freeTextValue}
                onChange={(event) => setFreeTextValue(event.target.value)}
                placeholder="Enter your answer"
                className="min-h-[96px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                data-testid="preview-textarea-input"
              />
            ) : kind === "number" ? (
              <Input
                type="number"
                value={freeTextValue}
                onChange={(event) => setFreeTextValue(event.target.value)}
                placeholder="Enter number"
                className="h-10 bg-slate-50 text-sm"
                data-testid="preview-number-input"
              />
            ) : isChoiceType || isSingleChoice ? (
              renderChoiceList()
            ) : kind === "consent" ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div
                    className={cn(
                      "text-xs leading-relaxed text-slate-600 [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4",
                      isLibraryConsent && "prose prose-sm max-w-none text-xs text-slate-800 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_h3]:text-xs [&_h3]:font-semibold [&_h4]:text-xs [&_h4]:font-semibold [&_h5]:text-xs [&_h5]:font-semibold [&_h6]:text-xs [&_h6]:font-semibold [&_p]:mb-2.5 [&_p:last-child]:mb-0 [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic",
                    )}
                    dangerouslySetInnerHTML={{
                      __html: getCleanConsentBody(consentText || "Consent document text appears here...", [text]),
                    }}
                  />
                </div>
                {isLibraryConsent ? (
                  renderLibraryConsentOptions()
                ) : (
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={consentAccepted}
                      onCheckedChange={(checked) => setConsentAccepted(checked === true)}
                      className="mt-0.5"
                      data-testid="preview-consent-checkbox"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      I have read and agree to the terms above.
                    </span>
                  </label>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400">
                Standard Input Preview
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
