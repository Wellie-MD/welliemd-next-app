import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { CommonSectionField, QuestionKind } from "@/features/treatments/types";

interface QuestionPreviewTabProps {
  text: string;
  kind: QuestionKind;
  choices: string[];
  dqChoices: string[];
  consentText: string;
  order: number;
  totalQuestions: number;
  sectionFields?: CommonSectionField[];
  sectionFieldCount?: number;
  sectionFieldsLoading?: boolean;
}

const sectionFieldChoices = (field: CommonSectionField): string[] => {
  const rawChoices = field.configuration?.choices;
  if (!Array.isArray(rawChoices)) return [];
  return rawChoices
    .map((choice) => {
      if (typeof choice === "string" || typeof choice === "number") return String(choice);
      if (typeof choice === "object" && choice !== null) {
        const record = choice as Record<string, unknown>;
        return String(record.label || record.text || record.name || record.value || "");
      }
      return "";
    })
    .filter(Boolean);
};

function SectionFieldPreview({ field }: { field: CommonSectionField }) {
  const choices = field.kind === "yes_no"
    ? ["Yes", "No"]
    : sectionFieldChoices(field);
  const isChoiceField = field.kind === "single_choice" || field.kind === "multiple_choice" || field.kind === "yes_no";

  return (
    <div className="space-y-1.5" data-testid={`section-preview-field-${field.sourceFieldId || field.id}`}>
      <label className="block text-xs font-semibold text-slate-700">
        {field.label}
        {field.required ? <span className="ml-1 text-red-400">*</span> : null}
      </label>
      {field.kind === "textarea" ? (
        <textarea disabled className="min-h-16 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm" placeholder="Enter your answer" />
      ) : isChoiceField ? (
        <div className="space-y-1.5">
          {(choices.length ? choices : ["Option 1", "Option 2"]).slice(0, 4).map((choice) => (
            <div key={choice} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <span className={cn("h-3.5 w-3.5 border border-slate-300 bg-white", field.kind === "multiple_choice" ? "rounded" : "rounded-full")} />
              {choice}
            </div>
          ))}
        </div>
      ) : (
        <Input disabled type={field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text"} placeholder="Enter your answer" className="h-9 bg-slate-50 text-sm" />
      )}
    </div>
  );
}

export function QuestionPreviewTab({
  text,
  kind,
  choices,
  dqChoices,
  consentText,
  order,
  totalQuestions,
  sectionFields = [],
  sectionFieldCount,
  sectionFieldsLoading = false,
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

  const renderShippingAddress = () => (
    <div className="space-y-3" data-testid="preview-shipping-address">
      <label className="block text-xs font-semibold text-slate-700">
        Street Address
        <Input className="mt-1 h-9 bg-slate-50 text-sm" placeholder="123 Main Street" />
      </label>
      <label className="block text-xs font-semibold text-slate-700">
        <span>Apartment, Suite, or Unit</span>
        <span className="ml-1 font-normal text-slate-400">Optional</span>
        <Input className="mt-1 h-9 bg-slate-50 text-sm" placeholder="Apt 4B" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-semibold text-slate-700">
          City
          <Input className="mt-1 h-9 bg-slate-50 text-sm" placeholder="City" />
        </label>
        <label className="block text-xs font-semibold text-slate-700">
          State
          <Input className="mt-1 h-9 bg-slate-50 text-sm" placeholder="State" />
        </label>
      </div>
      <label className="block text-xs font-semibold text-slate-700">
        ZIP Code
        <Input className="mt-1 h-9 bg-slate-50 text-sm" placeholder="12345" />
      </label>
    </div>
  );

  const renderSectionPreview = () => {
    const visibleFields = sectionFields.slice(0, 5);
    const totalFields = sectionFieldCount ?? sectionFields.length;
    const remainingFields = Math.max(0, totalFields - visibleFields.length);

    return (
      <div className="space-y-4" data-testid="section-patient-preview">
        {sectionFieldsLoading && visibleFields.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400">
            Loading section fields…
          </div>
        ) : visibleFields.length > 0 ? (
          visibleFields.map((field) => <SectionFieldPreview key={field.id || field.sourceFieldId} field={field} />)
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400">
            No section fields available.
          </div>
        )}
        {remainingFields > 0 ? (
          <div className="rounded-md bg-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-500" data-testid="section-preview-more-fields">
            +{remainingFields} more fields
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <aside className="hidden h-full min-w-0 flex-col overflow-hidden bg-[#1c2333] xl:flex">
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

            {kind === "section" ? (
              renderSectionPreview()
            ) : kind === "shipping_address" ? (
              renderShippingAddress()
            ) : kind === "text" ? (
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
                <div className="relative h-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                  {consentText || "Consent document text appears here..."}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent" />
                </div>
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
