import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProgramQuestion } from "@/features/treatments/types";
import { formatQuestionKind } from "./ProgramQuestionRows";

interface ProgramQuestionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: ProgramQuestion | null;
  questionNumber?: number;
  programName: string;
}

const getCleanConsentHtml = (question: ProgramQuestion) => {
  const rawConsentBody =
    question.consentText ||
    question?.consent_form?.consent_text ||
    question?.consent_form?.text ||
    "";

  let body = (rawConsentBody || "").trim();
  if (!body) {
    return "<p>Please review the terms of this consent carefully.</p>";
  }

  const titles = [question.text, question.section]
    .filter((t): t is string => Boolean(t && t.trim().length > 0))
    .map((t) => t.trim());

  const uniqueTitles = Array.from(new Set(titles));

  for (const title of uniqueTitles) {
    if (!title || !body) continue;
    const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const htmlHeadingPattern = new RegExp(
      `^<([a-z0-9]+)[^>]*>(?:<[^>]+>)*\\s*${escapedTitle}\\s*[:\\-]?\\s*(?:</[^>]+>)*</\\1>\\s*`,
      "i"
    );
    body = body.replace(htmlHeadingPattern, "");

    const markdownHeadingPattern = new RegExp(
      `^#{1,6}\\s*${escapedTitle}\\s*[:\\-]?\\s*(\n|<br\\s*/?>)*`,
      "i"
    );
    body = body.replace(markdownHeadingPattern, "");

    const plainHeadingPattern = new RegExp(
      `^${escapedTitle}\\s*[:\\-]?\\s*(\n+|<br\\s*/?>)+`,
      "i"
    );
    body = body.replace(plainHeadingPattern, "");
  }

  body = body.trim();
  const cleanedBody = body || "<p>Please review the terms of this consent carefully.</p>";

  return DOMPurify.sanitize(cleanedBody, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "span",
      "blockquote",
    "a",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
  });
};

const getChoiceLabel = (choice: unknown): string => {
  if (typeof choice === "string") return choice;
  if (!choice || typeof choice !== "object") return String(choice ?? "");
  const obj = choice as Record<string, unknown>;
  return String(obj.label || obj.text || obj.title || obj.name || obj.id || "");
};

const getChoiceId = (choice: unknown): string => {
  if (typeof choice === "string") return choice;
  if (!choice || typeof choice !== "object") return String(choice ?? "");
  const obj = choice as Record<string, unknown>;
  return String(obj.id || obj.value || obj.label || obj.text || "");
};

export function ProgramQuestionDetailModal({
  open,
  onOpenChange,
  question,
  questionNumber,
  programName,
}: ProgramQuestionDetailModalProps) {
  if (!question) return null;

  const sourceLabel =
    question.source === "client" || question.is_client_custom
      ? "Client"
      : question.source === "welliemd"
      ? "WellieMD"
      : "WellieMD";

  const isReadOnly =
    question.locked ||
    question.is_read_only ||
    question.can_be_modified === false ||
    (question.source !== "client" && !question.is_client_custom);

  const dqChoicesSet = new Set(question.dqChoices || []);
  const isConsent =
    question.kind === "consent" ||
    question.kind === "consent_form" ||
    Boolean(question.consentText) ||
    Boolean(question.consent_form?.consent_text) ||
    Boolean(question.consent_form?.text) ||
    question.section?.toLowerCase() === "consents";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[640px] max-w-[calc(100vw-32px)] gap-0 rounded-2xl border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl dark:border-slate-800 dark:bg-[#171b27] dark:text-slate-50 [&>button]:hidden">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5 text-left dark:border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold leading-6 text-slate-950 dark:text-slate-50">
                {questionNumber ? `Question ${questionNumber}` : "Question Details"}
              </DialogTitle>
              <DialogDescription className="mt-1.5 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                {`${programName} · assigned by ${sourceLabel}${isReadOnly ? " · read-only" : ""}`}
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-8 shrink-0 rounded-lg border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
              Close
            </Button>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(85vh-100px)] overflow-y-auto space-y-6 p-6">
          {/* Main Question Text / Consent Name */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isConsent ? `Consent Name` : "Question Prompt"}
            </div>
            <h3 className="mt-1.5 text-base font-bold text-slate-900 dark:text-slate-100">
              {question.text}
            </h3>
          </div>

          {/* Metadata Grid: Type, Required, Section */}
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-[#11151f]">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                Type
              </div>
              <div className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                {formatQuestionKind(question.kind)}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                Required
              </div>
              <div className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                {question.required ? "Yes" : "No"}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                Section
              </div>
              <div className="mt-1 truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                {question.section || "General"}
              </div>
            </div>
          </div>

          {/* Consent Special Preview (Rich HTML + Attestation + Consent Radio Options) */}
          {isConsent ? (
            <div className="space-y-5 border-t border-slate-100 pt-5 dark:border-slate-800">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Consent Text
                </div>
                <div
                  className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-[#11151f] dark:text-slate-200 [&_h1]:text-sm [&_h1]:font-bold [&_h2]:text-xs [&_h2]:font-bold [&_h3]:text-xs [&_h3]:font-semibold [&_p]:mb-2.5 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic"
                  dangerouslySetInnerHTML={{ __html: getCleanConsentHtml(question) }}
                />
              </div>

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Options
                </div>
                <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#11151f]">
                  {(question.choices && question.choices.length > 0
                    ? question.choices
                    : [
                        "I have read the above information and I do consent and wish to move forward",
                        "I have read the above information and I do not wish to continue",
                      ]
                  ).map((choice, idx) => {
                    const choiceLabel = getChoiceLabel(choice);
                    const choiceId = getChoiceId(choice);
                    const isDq =
                      dqChoicesSet.has(choiceId) ||
                      dqChoicesSet.has(choiceLabel) ||
                      (idx === 1 && !question.choices);

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800" />
                          <span className="select-none leading-snug">{choiceLabel}</span>
                        </div>
                        {isDq && (
                          <span className="ml-3 shrink-0 inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
                            Disqualifying
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Standard Non-Consent Form Inputs Preview */
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Answer Options / Input Preview
              </div>

              {/* Single Choice / Yes-No / Choice questions */}
              {(question.kind === "single_choice" || question.kind === "yes_no" || (question.choices && question.choices.length > 0 && question.kind !== "multiple_choice")) && (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#11151f]">
                  {(question.choices && question.choices.length > 0
                    ? question.choices
                    : question.kind === "yes_no"
                    ? ["Yes", "No"]
                    : []
                  ).map((choice, idx) => {
                    const choiceLabel = getChoiceLabel(choice);
                    const choiceId = getChoiceId(choice);
                    const isDq = dqChoicesSet.has(choiceId) || dqChoicesSet.has(choiceLabel);

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800" />
                          <span className="select-none">{choiceLabel}</span>
                        </div>
                        {isDq && (
                          <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
                            Disqualifying
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Multiple Choice */}
              {question.kind === "multiple_choice" && (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#11151f]">
                  {(question.choices || []).map((choice, idx) => {
                    const choiceLabel = getChoiceLabel(choice);
                    const choiceId = getChoiceId(choice);
                    const isDq = dqChoicesSet.has(choiceId) || dqChoicesSet.has(choiceLabel);

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800" />
                          <span className="select-none">{choiceLabel}</span>
                        </div>
                        {isDq && (
                          <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
                            Disqualifying
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Single Line Text / Email / Phone / Number / Zip */}
              {(question.kind === "text" ||
                question.kind === "email" ||
                question.kind === "phone" ||
                question.kind === "number" ||
                question.kind === "zip") && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-[#11151f]">
                  <input
                    type="text"
                    disabled
                    readOnly
                    placeholder={`Patient ${question.kind} response field (disabled)`}
                    className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-400 opacity-80 outline-none dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-500"
                  />
                </div>
              )}

              {/* Multiline Textarea */}
              {question.kind === "textarea" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-[#11151f]">
                  <textarea
                    disabled
                    readOnly
                    rows={3}
                    placeholder="Patient detailed text response area (disabled)"
                    className="w-full cursor-not-allowed resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-400 opacity-80 outline-none dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-500"
                  />
                </div>
              )}

              {/* Date Input */}
              {question.kind === "date" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-[#11151f]">
                  <input
                    type="date"
                    disabled
                    readOnly
                    className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-400 opacity-80 outline-none dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-500"
                  />
                </div>
              )}

              {/* File Upload Area */}
              {question.kind === "file_upload" && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center dark:border-slate-700 dark:bg-[#11151f]">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    File Upload Area (Patient Preview)
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                    Patients can upload documents or images here
                  </div>
                </div>
              )}

              {/* Height / Weight */}
              {question.kind === "height_weight" && (
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-[#11151f]">
                  <div>
                    <div className="text-[11px] font-medium text-slate-400 mb-1">Height (ft / in)</div>
                    <input
                      type="text"
                      disabled
                      readOnly
                      placeholder="e.g. 5 ft 10 in"
                      className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-400 opacity-80 outline-none dark:border-slate-700 dark:bg-[#171b27]"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-400 mb-1">Weight (lbs)</div>
                    <input
                      type="text"
                      disabled
                      readOnly
                      placeholder="e.g. 170 lbs"
                      className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-400 opacity-80 outline-none dark:border-slate-700 dark:bg-[#171b27]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
