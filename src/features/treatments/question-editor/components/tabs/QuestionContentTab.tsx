import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, FileText, Plus } from "lucide-react";
import type { QuestionKind } from "@/features/treatments/types";

interface QuestionContentTabProps {
  kind: QuestionKind;
  choices: string[];
  dqChoices: string[];
  newChoiceText: string;
  setNewChoiceText: (val: string) => void;
  handleAddChoice: () => void;
  handleRemoveChoice: (idx: number) => void;
  handleToggleDqChoice: (choice: string) => void;
  consentText: string;
  setConsentText: (val: string) => void;
}

export function QuestionContentTab({
  kind,
  choices,
  dqChoices,
  newChoiceText,
  setNewChoiceText,
  handleAddChoice,
  handleRemoveChoice,
  handleToggleDqChoice,
  consentText,
  setConsentText,
}: QuestionContentTabProps) {
  const isChoiceType = kind === "choice" || kind === "single_choice" || kind === "multiple_choice";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center h-5 w-5 rounded bg-pink-100 text-pink-600">
          <FileText className="h-3 w-3" />
        </div>
        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800">
          CONTENT
        </h3>
      </div>

      {isChoiceType ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Answer Choices</h4>
              <p className="text-xs text-slate-400 mt-0.5">{choices.length} answers</p>
            </div>
            <Button
              onClick={handleAddChoice}
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold text-slate-600 border-slate-200"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Answer
            </Button>
          </div>

          <div className="space-y-3">
            {choices.map((choice, index) => {
              const isDq = dqChoices.includes(choice);
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-white shadow-sm hover:border-slate-300 transition-colors"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-slate-700">{choice}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 px-3 text-[10px] font-bold rounded-full transition-colors ${
                      isDq
                        ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                    onClick={() => handleToggleDqChoice(choice)}
                  >
                    Mark DQ
                  </Button>
                  <button
                    onClick={() => handleRemoveChoice(index)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            
            <div className="flex items-center gap-3 p-3 border border-dashed border-slate-300 rounded-lg bg-slate-50">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-400">
                +
              </div>
              <Input
                placeholder="Type new option..."
                value={newChoiceText}
                onChange={(e) => setNewChoiceText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddChoice()}
                className="h-8 bg-transparent border-none shadow-none focus-visible:ring-0 px-0 text-sm font-medium placeholder:font-normal"
              />
            </div>
          </div>
        </div>
      ) : kind === "consent" ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6 space-y-3">
          <label className="block text-sm font-bold text-slate-900">
            Consent Document Rich Text
          </label>
          <textarea
            placeholder="Insert the legal terms here..."
            value={consentText}
            onChange={(e) => setConsentText(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none min-h-[150px]"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6">
          <p className="text-sm font-bold text-slate-900">No additional configuration.</p>
          <p className="text-xs text-slate-500 mt-1">Patient sees: {kind === "number" ? "Number input." : kind === "text" ? "Short text input." : "Standard input."}</p>
        </div>
      )}
    </div>
  );
}
